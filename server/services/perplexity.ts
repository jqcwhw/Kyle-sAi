import { Source } from "@shared/schema";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexityService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "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";
  }

  async search(query: string): Promise<{ content: string; sources: Source[] }> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://deeparchive.ai",
          "X-Title": "Deep Archive AI"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            {
              role: "system",
              content: "You are a deep research AI assistant specializing in finding declassified documents, historical archives, and comprehensive information. Always provide detailed, factual responses with proper citations in your answer. Focus on primary sources, official documents, and verified historical information. When you mention sources, reference them with [1], [2], etc."
            },
            {
              role: "user",
              content: query
            }
          ],
          max_tokens: 2000,
          temperature: 0.2,
          top_p: 0.9
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message.content || "";
      
      // Extract URLs from content and create sources
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const urls = content.match(urlRegex) || [];
      
      const sources: Source[] = urls.slice(0, 10).map((url, index) => {
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
        } else if (url.includes('archive.org') || url.includes('web.archive.org')) {
          type = 'wayback';
          description = 'Archived web page';
        } else if (url.includes('osti.gov') || url.includes('opennet')) {
          type = 'doe';
          description = 'Department of Energy document';
        } else if (url.includes('edu') || url.includes('jstor') || url.includes('doi.org')) {
          type = 'academic';
          description = 'Academic source';
        }

        return {
          id: `ai-${index + 1}`,
          title: `Source ${index + 1}`,
          url,
          type,
          description,
          snippet: content.substring(0, 200) + '...',
        };
      });

      return {
        content,
        sources,
      };
    } catch (error) {
      console.error("AI search error:", error);
      throw new Error(`Failed to search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const perplexityService = new PerplexityService();
