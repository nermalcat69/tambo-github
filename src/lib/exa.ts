import Exa from 'exa-js';

export interface ExaSearchResult {
  title: string;
  url: string;
  text?: string;
  publishedDate?: string;
  author?: string;
}

export interface ExaSearchOptions {
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  useAutoprompt?: boolean;
  type?: 'neural' | 'keyword';
}

export class ExaService {
  private static instance: ExaService;
  private exa: Exa | null = null;

  private constructor() {}

  private getExa(): Exa {
    if (!this.exa) {
      if (typeof window !== 'undefined') {
        throw new Error('Exa service can only be used on the server side');
      }
      if (!process.env.EXASEARCH_API_KEY) {
        throw new Error('EXASEARCH_API_KEY environment variable is required');
      }
      this.exa = new Exa(process.env.EXASEARCH_API_KEY);
    }
    return this.exa;
  }

  public static getInstance(): ExaService {
    if (!ExaService.instance) {
      ExaService.instance = new ExaService();
    }
    return ExaService.instance;
  }

  async search(
    query: string,
    options: ExaSearchOptions = {}
  ): Promise<ExaSearchResult[]> {
    try {
      const searchOptions = {
        numResults: options.numResults || 10,
        includeDomains: options.includeDomains,
        excludeDomains: options.excludeDomains,
        startCrawlDate: options.startCrawlDate,
        endCrawlDate: options.endCrawlDate,
        startPublishedDate: options.startPublishedDate,
        endPublishedDate: options.endPublishedDate,
        useAutoprompt: options.useAutoprompt ?? true,
        type: options.type || 'neural',
        contents: {
          text: true,
        },
      };

      const result = await this.getExa().searchAndContents(query, searchOptions);
      
      return result.results.map((item: any) => ({
        title: item.title,
        url: item.url,
        text: item.text,
        publishedDate: item.publishedDate,
        author: item.author,
      }));
    } catch (error) {
      console.error('Exa search error:', error);
      throw new Error('Failed to perform search');
    }
  }

  async searchGitHubIssues(
    query: string,
    repository?: string
  ): Promise<ExaSearchResult[]> {
    const searchQuery = repository 
      ? `${query} site:github.com/${repository}/issues`
      : `${query} site:github.com issues`;
    
    return this.search(searchQuery, {
      numResults: 5,
      includeDomains: ['github.com'],
      type: 'neural',
    });
  }

  async searchGitHubPRs(
    query: string,
    repository?: string
  ): Promise<ExaSearchResult[]> {
    const searchQuery = repository 
      ? `${query} site:github.com/${repository}/pull`
      : `${query} site:github.com pull requests`;
    
    return this.search(searchQuery, {
      numResults: 5,
      includeDomains: ['github.com'],
      type: 'neural',
    });
  }

  async searchDocumentation(
    query: string,
    technology?: string
  ): Promise<ExaSearchResult[]> {
    const searchQuery = technology 
      ? `${query} ${technology} documentation`
      : `${query} documentation`;
    
    return this.search(searchQuery, {
      numResults: 8,
      includeDomains: [
        'docs.github.com',
        'developer.github.com',
        'stackoverflow.com',
        'dev.to',
        'medium.com'
      ],
      type: 'neural',
    });
  }
}

let exaServiceInstance: ExaService | null = null;

export const exaService = {
  getInstance: () => {
    if (!exaServiceInstance) {
      exaServiceInstance = ExaService.getInstance();
    }
    return exaServiceInstance;
  },
  search: async (query: string, options: ExaSearchOptions = {}) => {
    return exaService.getInstance().search(query, options);
  },
  searchGitHubIssues: async (query: string, repository?: string) => {
    return exaService.getInstance().searchGitHubIssues(query, repository);
  },
  searchGitHubPRs: async (query: string, repository?: string) => {
    return exaService.getInstance().searchGitHubPRs(query, repository);
  },
  searchDocumentation: async (query: string, technology?: string) => {
    return exaService.getInstance().searchDocumentation(query, technology);
  }
};