
import { Source } from "@shared/schema";
import * as cheerio from "cheerio";

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  score: number;
}

export class WebSearchService {
  private userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
  
  async search(query: string, maxResults: number = 10): Promise<Source[]> {
    try {
      // Use multiple search strategies
      const [duckDuckGoResults, braveResults] = await Promise.allSettled([
        this.searchDuckDuckGo(query),
        this.searchBrave(query)
      ]);
      
      let allResults: SearchResult[] = [];
      
      if (duckDuckGoResults.status === 'fulfilled') {
        allResults.push(...duckDuckGoResults.value);
      }
      
      if (braveResults.status === 'fulfilled') {
        allResults.push(...braveResults.value);
      }
      
      // Remove duplicates and rank by relevance
      const uniqueResults = this.deduplicateAndRank(allResults, query);
      
      // Convert to Source format
      return uniqueResults.slice(0, maxResults).map((result, index) => ({
        id: `web-${index + 1}`,
        title: result.title,
        url: result.url,
        type: this.categorizeSource(result.url),
        description: result.snippet,
        snippet: result.snippet
      }));
      
    } catch (error) {
      console.error("Web search error:", error);
      return [];
    }
  }
  
  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: SearchResult[] = [];
      
      $('.result').each((i, elem) => {
        const title = $(elem).find('.result__title').text().trim();
        const link = $(elem).find('.result__url').attr('href');
        const snippet = $(elem).find('.result__snippet').text().trim();
        
        if (title && link) {
          results.push({
            url: link.startsWith('http') ? link : `https://${link}`,
            title,
            snippet: snippet || '',
            score: 0
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error("DuckDuckGo search error:", error);
      return [];
    }
  }
  
  private async searchBrave(query: string): Promise<SearchResult[]> {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) return [];
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodedQuery}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': apiKey
          }
        }
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      
      return (data.web?.results || []).map((result: any) => ({
        url: result.url,
        title: result.title,
        snippet: result.description || '',
        score: 0
      }));
      
    } catch (error) {
      console.error("Brave search error:", error);
      return [];
    }
  }
  
  private deduplicateAndRank(results: SearchResult[], query: string): SearchResult[] {
    // Remove duplicates by URL
    const uniqueMap = new Map<string, SearchResult>();
    
    for (const result of results) {
      const normalizedUrl = this.normalizeUrl(result.url);
      if (!uniqueMap.has(normalizedUrl)) {
        uniqueMap.set(normalizedUrl, result);
      }
    }
    
    // Calculate relevance scores
    const scoredResults = Array.from(uniqueMap.values()).map(result => {
      const score = this.calculateRelevanceScore(result, query);
      return { ...result, score };
    });
    
    // Sort by score descending
    return scoredResults.sort((a, b) => b.score - a.score);
  }
  
  private calculateRelevanceScore(result: SearchResult, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = result.title.toLowerCase();
    const snippetLower = result.snippet.toLowerCase();
    
    // Title match (highest weight)
    if (titleLower.includes(queryLower)) score += 10;
    
    // Individual query words in title
    const queryWords = queryLower.split(/\s+/);
    queryWords.forEach(word => {
      if (word.length > 2) {
        if (titleLower.includes(word)) score += 3;
        if (snippetLower.includes(word)) score += 1;
      }
    });
    
    // Prefer authoritative domains
    const url = result.url.toLowerCase();
    if (url.includes('.gov')) score += 15;
    if (url.includes('.edu')) score += 12;
    if (url.includes('.org')) score += 8;
    if (url.includes('archive.org')) score += 10;
    
    // Penalize common low-quality domains
    if (url.includes('pinterest') || url.includes('quora')) score -= 5;
    
    return score;
  }
  
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove www, trailing slash, query params for comparison
      return parsed.hostname.replace('www.', '') + parsed.pathname.replace(/\/$/, '');
    } catch {
      return url;
    }
  }
  
  private categorizeSource(url: string): Source['type'] {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('cia.gov') || urlLower.includes('foia.cia')) return 'cia';
    if (urlLower.includes('fbi.gov') || urlLower.includes('vault.fbi')) return 'fbi';
    if (urlLower.includes('archives.gov') || urlLower.includes('nara.gov')) return 'nara';
    if (urlLower.includes('nsa.gov')) return 'nsa';
    if (urlLower.includes('archive.org')) return 'wayback';
    if (urlLower.includes('osti.gov') || urlLower.includes('doe.gov')) return 'doe';
    if (urlLower.includes('.edu') || urlLower.includes('jstor')) return 'academic';
    
    return 'web';
  }
}

export const webSearchService = new WebSearchService();
