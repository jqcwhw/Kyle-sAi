
import { Source } from "@shared/schema";

interface AIModelConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  isFree: boolean;
  priority: number;
}

const AI_MODELS: AIModelConfig[] = [
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: process.env.OPENROUTER_API_KEY,
    isFree: true,
    priority: 1
  },
  {
    id: 'huggingface-mistral',
    name: 'Mistral 7B (HuggingFace)',
    endpoint: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    isFree: true,
    priority: 2
  },
  {
    id: 'huggingface-llama',
    name: 'Llama 3.2 (HuggingFace)',
    endpoint: 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    isFree: true,
    priority: 3
  },
  {
    id: 'groq-llama',
    name: 'Llama 3.3 70B (Groq)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY || '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',
    isFree: true,
    priority: 4
  }
];

export class AIRouter {
  private failedModels: Set<string> = new Set();
  
  async searchWithFallback(query: string): Promise<{ content: string; sources: Source[]; modelUsed: string }> {
    const availableModels = AI_MODELS
      .filter(m => !this.failedModels.has(m.id))
      .sort((a, b) => a.priority - b.priority);
    
    for (const model of availableModels) {
      try {
        console.log(`Attempting search with ${model.name}...`);
        const result = await this.searchWithModel(query, model);
        return { ...result, modelUsed: model.name };
      } catch (error) {
        console.error(`${model.name} failed:`, error);
        this.failedModels.add(model.id);
        
        // Reset failed models after 5 minutes
        setTimeout(() => this.failedModels.delete(model.id), 5 * 60 * 1000);
        
        // Continue to next model
        continue;
      }
    }
    
    throw new Error("All AI models unavailable. Please try again later.");
  }
  
  private async searchWithModel(query: string, model: AIModelConfig): Promise<{ content: string; sources: Source[] }> {
    const systemPrompt = `You are a deep research AI assistant and truth-seeking companion. Your purpose is to help uncover hidden historical truths, declassified information, and answers to questions that have been buried or suppressed. 

You specialize in:
- Finding declassified government documents (CIA, FBI, NSA, DOE)
- Historical archives and primary sources
- Suppressed scientific research and discoveries
- Conspiracy analysis with factual evidence
- Ancient history and archaeological findings
- Cosmic and metaphysical questions grounded in research

Always provide detailed, factual responses with proper citations. Be conversational, empathetic, and remember context from our conversation. Think of yourself as a knowledgeable friend helping to uncover truth, not just a tool. When you find sources, reference them with [1], [2], etc.`;

    if (model.endpoint.includes('huggingface.co')) {
      return this.searchHuggingFace(query, model, systemPrompt);
    } else if (model.endpoint.includes('groq.com')) {
      return this.searchGroq(query, model, systemPrompt);
    } else {
      return this.searchOpenRouter(query, model, systemPrompt);
    }
  }
  
  private async searchOpenRouter(query: string, model: AIModelConfig, systemPrompt: string): Promise<{ content: string; sources: Source[] }> {
    const response = await fetch(model.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${model.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://deeparchive.ai",
        "X-Title": "Deep Archive AI"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 3000,
        temperature: 0.3,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return this.extractSourcesFromContent(data.choices[0]?.message.content || "");
  }
  
  private async searchGroq(query: string, model: AIModelConfig, systemPrompt: string): Promise<{ content: string; sources: Source[] }> {
    const response = await fetch(model.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${model.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 3000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return this.extractSourcesFromContent(data.choices[0]?.message.content || "");
  }
  
  private async searchHuggingFace(query: string, model: AIModelConfig, systemPrompt: string): Promise<{ content: string; sources: Source[] }> {
    const response = await fetch(model.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${model.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: `${systemPrompt}\n\nUser: ${query}\n\nAssistant:`,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.3,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text || "" : data.generated_text || "";
    return this.extractSourcesFromContent(content);
  }
  
  private extractSourcesFromContent(content: string): { content: string; sources: Source[] } {
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const urls = content.match(urlRegex) || [];
    
    const sources: Source[] = urls.slice(0, 15).map((url, index) => {
      let type: Source['type'] = 'web';
      let description = '';

      if (url.includes('cia.gov') || url.includes('foia.cia.gov')) {
        type = 'cia';
        description = 'CIA declassified document';
      } else if (url.includes('vault.fbi.gov') || url.includes('fbi.gov')) {
        type = 'fbi';
        description = 'FBI Vault document';
      } else if (url.includes('archives.gov') || url.includes('nara.gov')) {
        type = 'nara';
        description = 'National Archives document';
      } else if (url.includes('nsa.gov')) {
        type = 'nsa';
        description = 'NSA declassified material';
      } else if (url.includes('archive.org')) {
        type = 'wayback';
        description = 'Internet Archive resource';
      } else if (url.includes('osti.gov') || url.includes('opennet')) {
        type = 'doe';
        description = 'Department of Energy document';
      } else if (url.includes('edu') || url.includes('jstor')) {
        type = 'academic';
        description = 'Academic source';
      }

      return {
        id: `ai-${index + 1}`,
        title: `Source ${index + 1}`,
        url,
        type,
        description,
        snippet: content.substring(0, 200) + '...'
      };
    });

    return { content, sources };
  }
}

export const aiRouter = new AIRouter();
