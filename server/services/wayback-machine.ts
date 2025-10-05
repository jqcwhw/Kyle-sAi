import { Source } from "@shared/schema";

interface WaybackSearchOptions {
  query: string;
  yearsBack: number;
  maxResults: number;
}

interface WaybackCDXResponse {
  urlkey: string;
  timestamp: string;
  original: string;
  mimetype: string;
  statuscode: string;
  digest: string;
  length: string;
}

export class WaybackMachineService {
  private readonly CDX_API_URL = 'http://web.archive.org/cdx/search/cdx';

  async search(options: WaybackSearchOptions): Promise<Source[]> {
    const { query, yearsBack, maxResults } = options;
    const results: Source[] = [];

    try {
      // Search for government domains and relevant sites
      const domains = [
        'cia.gov',
        'fbi.gov',
        'archives.gov',
        'nsa.gov',
        'whitehouse.gov',
        'defense.gov',
        'state.gov'
      ];

      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - yearsBack);

      for (const domain of domains) {
        try {
          const domainResults = await this.searchDomain(domain, query, startDate, endDate, maxResults);
          results.push(...domainResults);
        } catch (error) {
          console.error(`Error searching domain ${domain}:`, error);
        }
      }

      return results.slice(0, maxResults);
    } catch (error) {
      console.error("Wayback Machine search error:", error);
      return [];
    }
  }

  private async searchDomain(domain: string, query: string, startDate: Date, endDate: Date, limit: number): Promise<Source[]> {
    const fromDate = this.formatDate(startDate);
    const toDate = this.formatDate(endDate);
    
    // Construct CDX API URL
    const url = new URL(this.CDX_API_URL);
    url.searchParams.set('url', `*.${domain}/*${query}*`);
    url.searchParams.set('from', fromDate);
    url.searchParams.set('to', toDate);
    url.searchParams.set('output', 'json');
    url.searchParams.set('collapse', 'urlkey');
    url.searchParams.set('limit', limit.toString());

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`CDX API error: ${response.status}`);
      }

      const data = await response.text();
      const lines = data.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return [];
      }

      // Skip header line and process results
      const results: Source[] = [];
      for (let i = 1; i < lines.length && i <= limit; i++) {
        try {
          const fields = lines[i].split(' ');
          if (fields.length >= 3) {
            const timestamp = fields[1];
            const originalUrl = fields[2];
            
            // Create wayback URL
            const waybackUrl = `https://web.archive.org/web/${timestamp}/${originalUrl}`;
            
            // Extract meaningful title from URL
            const title = this.extractTitleFromUrl(originalUrl);
            
            results.push({
              id: `wayback-${domain}-${i}`,
              title,
              url: waybackUrl,
              type: 'wayback',
              description: `Archived version of ${domain} page from ${this.formatTimestamp(timestamp)}`,
              snippet: `Historical snapshot of government document or webpage related to "${query}"`,
            });
          }
        } catch (error) {
          console.error("Error parsing CDX line:", error);
        }
      }

      return results;
    } catch (error) {
      console.error(`Error fetching from CDX API for ${domain}:`, error);
      return [];
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  private formatTimestamp(timestamp: string): string {
    if (timestamp.length !== 14) return timestamp;
    
    const year = timestamp.slice(0, 4);
    const month = timestamp.slice(4, 6);
    const day = timestamp.slice(6, 8);
    
    return `${year}-${month}-${day}`;
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract filename or last path segment
      const segments = pathname.split('/').filter(s => s);
      const lastSegment = segments[segments.length - 1];
      
      if (lastSegment) {
        // Remove file extension and decode
        const title = decodeURIComponent(lastSegment).replace(/\.[^.]+$/, '');
        return title.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      
      return `Archived ${urlObj.hostname} Document`;
    } catch (error) {
      return 'Archived Government Document';
    }
  }

  async getSnapshot(url: string, timestamp?: string): Promise<string | null> {
    try {
      const waybackUrl = timestamp 
        ? `https://web.archive.org/web/${timestamp}/${url}`
        : `https://web.archive.org/web/${url}`;

      const response = await fetch(waybackUrl);
      if (!response.ok) {
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error("Error fetching Wayback snapshot:", error);
      return null;
    }
  }
}

export const waybackMachineService = new WaybackMachineService();
