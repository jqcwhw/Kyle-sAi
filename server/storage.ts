import { type Conversation, type Message, type Bookmark, type SearchHistoryItem, type InsertConversation, type InsertMessage, type InsertBookmark, type InsertSearchHistory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversations(): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Bookmarks
  getBookmarks(): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<boolean>;

  // Search History
  getSearchHistory(limit?: number): Promise<SearchHistoryItem[]>;
  createSearchHistory(search: InsertSearchHistory): Promise<SearchHistoryItem>;
}

export class MemStorage implements IStorage {
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private bookmarks: Map<string, Bookmark>;
  private searchHistoryItems: Map<string, SearchHistoryItem>;

  constructor() {
    this.conversations = new Map();
    this.messages = new Map();
    this.bookmarks = new Map();
    this.searchHistoryItems = new Map();

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample search history
    const sampleSearches = [
      { query: "MKUltra declassified documents analysis", resultsCount: "15" },
      { query: "Watergate scandal primary sources", resultsCount: "8" },
      { query: "Cold War UFO reports FBI Vault", resultsCount: "12" }
    ];

    sampleSearches.forEach(search => {
      const id = randomUUID();
      const now = new Date();
      const randomHoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(now.getTime() - randomHoursAgo * 60 * 60 * 1000);
      
      this.searchHistoryItems.set(id, {
        id,
        ...search,
        timestamp,
      });
    });

    // Sample bookmarks
    const sampleBookmarks = [
      {
        title: "Operation Northwoods Documents",
        url: "https://www.archives.gov/files/research/jfk/releases/docid-32403785.pdf",
        sourceType: "cia",
        description: "Declassified military documents regarding Operation Northwoods",
        documentDate: "1962",
        declassifiedDate: "1997",
        pages: "15"
      },
      {
        title: "Manhattan Project Timeline",
        url: "https://www.osti.gov/opennet/manhattan-project",
        sourceType: "doe",
        description: "Department of Energy collection on Manhattan Project development",
        documentDate: "1942-1946",
        declassifiedDate: "1995",
        pages: "340"
      }
    ];

    sampleBookmarks.forEach(bookmark => {
      const id = randomUUID();
      this.bookmarks.set(id, {
        id,
        ...bookmark,
        createdAt: new Date(),
      });
    });
  }

  // Conversations
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      id,
      ...insertConversation,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const updated: Conversation = {
      ...conversation,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string): Promise<boolean> {
    // Also delete related messages
    const messages = Array.from(this.messages.values()).filter(m => m.conversationId === id);
    messages.forEach(message => this.messages.delete(message.id));
    
    return this.conversations.delete(id);
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      ...insertMessage,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  // Bookmarks
  async getBookmarks(): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = {
      id,
      ...insertBookmark,
      createdAt: new Date(),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<boolean> {
    return this.bookmarks.delete(id);
  }

  // Search History
  async getSearchHistory(limit: number = 20): Promise<SearchHistoryItem[]> {
    return Array.from(this.searchHistoryItems.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistoryItem> {
    const id = randomUUID();
    const searchHistory: SearchHistoryItem = {
      id,
      ...insertSearchHistory,
      timestamp: new Date(),
    };
    this.searchHistoryItems.set(id, searchHistory);
    return searchHistory;
  }
}

export const storage = new MemStorage();
