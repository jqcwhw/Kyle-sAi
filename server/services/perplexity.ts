import { Source } from "@shared/schema";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
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
    this.apiKey = process.env.PERPLEXITY_API_KEY || "";
    if (!this.apiKey) {
      console.warn("PERPLEXITY_API_KEY not found in environment variables");
    }
  }

  async search(query: string, searchDomains?: string[]): Promise<{ content: string; sources: Source[] }> {
    if (!this.apiKey) {
      throw new Error("Perplexity API key not configured");
    }

    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "You are a deep research AI assistant specializing in finding declassified documents, historical archives, and comprehensive information. Always provide detailed, factual responses with proper citations. Focus on primary sources, official documents, and verified historical information."
            },
            {
              role: "user",
              content: query
            }
          ],
          max_tokens: 2000,
          temperature: 0.2,
          top_p: 0.9,
          search_domain_filter: searchDomains,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: "month",
          top_k: 0,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 1
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      
      // Convert citations to Source objects
      const sources: Source[] = data.citations.map((url, index) => {
        // Determine source type based on URL
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
          id: `perplexity-${index + 1}`,
          title: `Source ${index + 1}`,
          url,
          type,
          description,
          snippet: data.choices[0]?.message.content.substring(0, 200) + '...',
        };
      });

      return {
        content: data.choices[0]?.message.content || "",
        sources,
      };
    } catch (error) {
      console.error("Perplexity search error:", error);
      throw new Error(`Failed to search with Perplexity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const perplexityService = new PerplexityService();
