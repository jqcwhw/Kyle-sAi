import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { perplexityService } from "./services/perplexity";
import { archivalSearchService } from "./services/archival-search";
import { waybackMachineService } from "./services/wayback-machine";
import { chatRequestSchema, insertSearchHistorySchema, insertBookmarkSchema, type ChatResponse, type Source } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Chat endpoint - main AI search functionality
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, conversationId, sources, maxSources, archiveYears } = chatRequestSchema.parse(req.body);

      // Create or get conversation
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
      } else {
        // Create new conversation with message as title
        const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
        conversation = await storage.createConversation({ title });
      }

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
        sources: [],
      });

      // Save to search history
      await storage.createSearchHistory({ query: message });

      // Perform multi-source search
      const allSources: Source[] = [];
      let aiResponse = "";

      try {
        // 1. Search with Perplexity AI for web results and initial analysis
        const perplexityResult = await perplexityService.search(message);
        aiResponse = perplexityResult.content;
        allSources.push(...perplexityResult.sources);

        // 2. Search archival sources if requested
        const archivalSources = sources.filter(s => ['cia', 'fbi', 'nara', 'nsa'].includes(s));
        if (archivalSources.length > 0) {
          const archivalResults = await archivalSearchService.search({
            sources: archivalSources,
            maxResults: Math.floor(maxSources * 0.6), // 60% from archival sources
            query: message
          });
          allSources.push(...archivalResults);
        }

        // 3. Search Wayback Machine if requested
        if (sources.includes('wayback')) {
          const waybackResults = await waybackMachineService.search({
            query: message,
            yearsBack: archiveYears,
            maxResults: Math.floor(maxSources * 0.2) // 20% from wayback
          });
          allSources.push(...waybackResults);
        }

        // Enhance AI response with archival context if we found relevant documents
        if (allSources.some(s => ['cia', 'fbi', 'nara', 'nsa'].includes(s.type))) {
          aiResponse += "\n\nI've found additional declassified documents and archival materials that provide deeper context to this topic. Please refer to the sources panel for direct access to these primary documents.";
        }

      } catch (searchError) {
        console.error("Search error:", searchError);
        aiResponse = "I encountered an issue while searching through the archives. However, I can still provide some general information based on my knowledge base. Please note that some sources may be temporarily unavailable.";
      }

      // Save AI response message
      const responseMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse,
        sources: allSources.slice(0, maxSources), // Limit total sources
      });

      // Update conversation timestamp
      await storage.updateConversation(conversation.id, { updatedAt: new Date() });

      const response: ChatResponse = {
        message: aiResponse,
        sources: allSources.slice(0, maxSources),
        conversationId: conversation.id,
        messageId: responseMessage.id,
      };

      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request format", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get conversation messages
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversation(id);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteConversation(id);
      if (!success) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete conversation error:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Get bookmarks
  app.get("/api/bookmarks", async (req, res) => {
    try {
      const bookmarks = await storage.getBookmarks();
      res.json(bookmarks);
    } catch (error) {
      console.error("Get bookmarks error:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Create bookmark
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const bookmarkData = insertBookmarkSchema.parse(req.body);
      const bookmark = await storage.createBookmark(bookmarkData);
      res.status(201).json(bookmark);
    } catch (error) {
      console.error("Create bookmark error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  // Delete bookmark
  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBookmark(id);
      if (!success) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete bookmark error:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Get search history
  app.get("/api/search-history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const history = await storage.getSearchHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Get search history error:", error);
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });

  // Get Wayback Machine snapshot
  app.get("/api/wayback/snapshot", async (req, res) => {
    try {
      const { url, timestamp } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      const snapshot = await waybackMachineService.getSnapshot(url, timestamp as string);
      if (!snapshot) {
        return res.status(404).json({ message: "Snapshot not found" });
      }

      res.set('Content-Type', 'text/html');
      res.send(snapshot);
    } catch (error) {
      console.error("Get snapshot error:", error);
      res.status(500).json({ message: "Failed to fetch snapshot" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
