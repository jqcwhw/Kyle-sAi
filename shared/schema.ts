import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  sources: json("sources").$type<Source[]>().default([]),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull(), // 'cia' | 'fbi' | 'nara' | 'nsa' | 'wayback' | 'academic' | 'web'
  description: text("description"),
  documentDate: text("document_date"),
  declassifiedDate: text("declassified_date"),
  pages: text("pages"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  resultsCount: text("results_count"),
});

// Types
export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.enum(['cia', 'fbi', 'nara', 'nsa', 'wayback', 'academic', 'web', 'doe']),
  description: z.string().optional(),
  documentDate: z.string().optional(),
  declassifiedDate: z.string().optional(),
  pages: z.string().optional(),
  snippet: z.string().optional(),
});

export type Source = z.infer<typeof sourceSchema>;

// Insert schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  timestamp: true,
});

// Inferred types
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type SearchHistoryItem = typeof searchHistory.$inferSelect;

// Chat request/response types
export const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  sources: z.array(z.enum(['cia', 'fbi', 'nara', 'nsa', 'wayback', 'web'])).default(['cia', 'fbi', 'nara', 'nsa', 'wayback', 'web']),
  maxSources: z.number().min(5).max(50).default(20),
  archiveYears: z.number().min(5).max(75).default(25),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  message: z.string(),
  sources: z.array(sourceSchema),
  conversationId: z.string(),
  messageId: z.string(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;
