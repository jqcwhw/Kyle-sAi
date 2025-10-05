
import { storage } from "../storage";

export class ConversationMemory {
  private contextWindow = 10; // Remember last 10 messages
  
  async getConversationContext(conversationId: string): Promise<string> {
    const messages = await storage.getMessagesByConversation(conversationId);
    const recentMessages = messages.slice(-this.contextWindow);
    
    const context = recentMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
    
    return context;
  }
  
  async buildEnhancedPrompt(conversationId: string, newQuery: string): Promise<string> {
    const context = await this.getConversationContext(conversationId);
    
    return `Previous conversation:
${context}

Current question: ${newQuery}

Remember our conversation history and provide a response that builds on what we've discussed. Be conversational, empathetic, and remember details I've shared.`;
  }
}

export const conversationMemory = new ConversationMemory();
