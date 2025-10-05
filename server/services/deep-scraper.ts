
import * as cheerio from 'cheerio';
import { Source } from "@shared/schema";

interface ScrapeResult {
  title: string;
  content: string;
  url: string;
  metadata?: Record<string, string>;
}

export class DeepScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async scrapeArchives(query: string): Promise<Source[]> {
    const results: Source[] = [];
    
    const targets = [
      {
        name: 'CIA FOIA',
        url: `https://www.cia.gov/readingroom/search/site/${encodeURIComponent(query)}`,
        type: 'cia' as const
      },
      {
        name: 'FBI Vault',
        url: `https://vault.fbi.gov/search?SearchableText=${encodeURIComponent(query)}`,
        type: 'fbi' as const
      },
      {
        name: 'NSA Declassified',
        url: `https://www.nsa.gov/portals/75/documents/news-features/declassified-documents/search.cfm?q=${encodeURIComponent(query)}`,
        type: 'nsa' as const
      }
    ];

    for (const target of targets) {
      try {
        const scraped = await this.scrapePage(target.url);
        const sources = this.parseSearchResults(scraped, target.type);
        results.push(...sources);
      } catch (error) {
        console.error(`Error scraping ${target.name}:`, error);
      }
    }

    return results;
  }

  async scrapePage(url: string): Promise<ScrapeResult> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove scripts and styles
    $('script, style, noscript').remove();
    
    const title = $('title').text() || $('h1').first().text() || 'Document';
    const content = $('body').text().replace(/\s+/g, ' ').trim();
    
    return {
      title,
      content,
      url,
      metadata: {
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || ''
      }
    };
  }

  private parseSearchResults(scraped: ScrapeResult, type: Source['type']): Source[] {
    const $ = cheerio.load(scraped.content);
    const sources: Source[] = [];
    
    // Generic parsing - adapt based on actual HTML structure
    $('a[href*=".pdf"], a[href*="document"], .search-result').each((i, elem) => {
      if (i >= 10) return; // Limit results
      
      const $elem = $(elem);
      const href = $elem.attr('href') || '';
      const title = $elem.text().trim() || `Document ${i + 1}`;
      
      if (href && !href.startsWith('javascript:')) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, scraped.url).toString();
        
        sources.push({
          id: `scrape-${type}-${i}`,
          title,
          url: fullUrl,
          type,
          description: `Scraped from ${type.toUpperCase()} archives`,
          snippet: title.substring(0, 200)
        });
      }
    });
    
    return sources;
  }

  async extractDocumentText(url: string): Promise<string> {
    try {
      const scraped = await this.scrapePage(url);
      return scraped.content;
    } catch (error) {
      console.error('Error extracting document text:', error);
      return '';
    }
  }
}

export const deepScraper = new DeepScraper();
