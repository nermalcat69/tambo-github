import {
  GitHubRepo,
  GitHubIssue,
  GitHubPR,
  IssuesInput,
  PRsInput,
  githubRepoSchema,
  githubIssueSchema,
  githubPRSchema,
} from "../lib/types";

class GitHubAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "GitHubAPIError";
  }
}

class GitHubAPI {
  private baseUrl = "https://api.github.com";
  private token?: string;

  constructor() {
    // Token should be set via environment variable or user input
    this.token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "tambo-github-tool",
      ...(options.headers as Record<string, string> || {}),
    };
  
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
  
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`;
        
        // Enhanced error handling for fine-grained PAT permissions
        if (response.status === 403) {
          if (!this.token) {
            errorMessage += '\nNo GitHub token provided. Set GITHUB_TOKEN for private repos/orgs.';
          } else {
            errorMessage += '\nToken may lack required permissions for this endpoint. For fine-grained PATs:';
            errorMessage += '\n- Repo issues: "Issues: read" permission';
            errorMessage += '\n- Org search: "search" permission';
            errorMessage += '\n- Check your PAT permissions at https://github.com/settings/tokens';
          }
          console.error(`[GitHub API] Permission issue: ${errorMessage}`);
        } else if (response.status === 404) {
          errorMessage += '\nRepository or organization not found, or access denied. Check the owner/repo name and your token permissions.';
          console.error(`[GitHub API] Not found: ${errorMessage}`);
        }
        
        throw new GitHubAPIError(errorMessage, response.status);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof GitHubAPIError) {
        throw error;
      }
      throw new GitHubAPIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRepositoryIssues({
    owner,
    repo,
    state = "all",
    labels,
    assignee,
    per_page = 30,
    page = 1,
  }: IssuesInput): Promise<GitHubIssue[]> {
    console.log(`[GitHub API] Fetching repo-level issues for ${owner}/${repo}`, { state, labels, assignee, per_page, page });
    
    // Request more items than needed to account for PR filtering
    // GitHub issues endpoint returns both issues and PRs, so we need to filter
    const requestPerPage = Math.min(100, per_page * 3); // Request 3x to account for PRs
    
    const params = new URLSearchParams();
    params.set("state", state);
    params.set("per_page", String(requestPerPage));
    params.set("page", String(page));
    if (labels) params.set("labels", labels);
    if (assignee) params.set("assignee", assignee);
  
    const endpoint = `/repos/${owner}/${repo}/issues?${params.toString()}`;
    console.log(`[GitHub API] Repo issues request URL: ${this.baseUrl}${endpoint}`);
    console.log(`[GitHub API] Repo issues params:`, Object.fromEntries(params.entries()));
  
    try {
      const data = await this.request<unknown[]>(endpoint);
      const dataArray = data as unknown[];
      console.log(`[GitHub API] Raw repo issues response:`, { count: dataArray.length, hasToken: !!this.token });
      
      // Debug: Log the first few items to see what we're getting
      if (dataArray.length > 0) {
        const firstItem = dataArray[0] as Record<string, unknown>;
        console.log(`[GitHub API] First item type check:`, {
          hasPullRequest: firstItem.pull_request,
          isPR: !!firstItem.pull_request,
          url: firstItem.html_url,
          title: firstItem.title,
          number: firstItem.number
        });
      }
  
      // Filter PRs only AFTER we know we received items
        const issuesOnly = Array.isArray(dataArray) ? dataArray.filter((item: unknown) => {
          const itemObj = item as Record<string, unknown>;
          const isPR = !!itemObj.pull_request;
          if (isPR) {
            console.log(`[GitHub API] Filtering out PR:`, { number: itemObj.number, title: itemObj.title });
          }
          return !isPR;
        }) : [];
      
      // Limit to the requested number of issues
      const limitedIssues = issuesOnly.slice(0, per_page);
      
      console.log(`[GitHub API] Filtered repo issues (excluding PRs):`, {
        count: limitedIssues.length,
        originalCount: dataArray.length,
        filteredCount: dataArray.length - issuesOnly.length,
        requestedCount: per_page
      });
      
      // Fallback: If we don't have enough issues, try to get more
      if (limitedIssues.length < per_page && limitedIssues.length === 0 && dataArray.length > 0) {
        console.log(`[GitHub API] All items are PRs, trying alternative approach...`);
        
        // Try with issue-specific filter
        const issueParams = new URLSearchParams();
        issueParams.set("state", state);
        issueParams.set("per_page", String(Math.min(100, per_page * 5))); // Try even more
        issueParams.set("page", String(page));
        if (labels) issueParams.set("labels", labels);
        if (assignee) issueParams.set("assignee", assignee);
        
        const issueEndpoint = `/repos/${owner}/${repo}/issues?${issueParams.toString()}`;
        console.log(`[GitHub API] Trying with more items: ${this.baseUrl}${issueEndpoint}`);
        
        try {
          const issueData = await this.request<unknown[]>(issueEndpoint);
          console.log(`[GitHub API] With more items:`, { count: issueData.length });
          
          const filteredIssues = Array.isArray(issueData) ? issueData.filter((item: unknown) => !(item as Record<string, unknown>).pull_request) : [];
          const limitedFallbackIssues = filteredIssues.slice(0, per_page);
          console.log(`[GitHub API] Filtered issues with fallback:`, { count: limitedFallbackIssues.length });
          
          if (limitedFallbackIssues.length > 0) {
            return limitedFallbackIssues.map(item => githubIssueSchema.parse(item));
          }
        } catch (fallbackError) {
          console.log(`[GitHub API] Fallback approach failed:`, fallbackError);
        }
      }
      
      if (limitedIssues.length === 0 && dataArray.length > 0) {
        console.log(`[GitHub API] Warning: All ${dataArray.length} items were filtered out as PRs. The repository may have only PRs in the requested state.`);
      }
      
      return limitedIssues.map(item => githubIssueSchema.parse(item));
    } catch (error) {
      if (error instanceof GitHubAPIError && error.status === 403) {
        throw new GitHubAPIError(`Access denied to ${owner}/${repo} issues. This repository may require "Issues: read" permission for your token. Check your fine-grained PAT permissions.`, 403);
      }
      throw error;
    }
  }
  
  async getOrganizationIssues({
    org,
    state = "all",
    labels,
    assignee,
    per_page = 30,
    page = 1,
  }: IssuesInput): Promise<GitHubIssue[]> {
    console.log(`[GitHub API] Fetching org-wide issues for ${org}`, { state, labels, assignee, per_page, page });
    
    const queryParts = [`org:${org}`, "is:issue"];
    if (state !== "all") queryParts.push(`state:${state}`);
    
    if (labels) queryParts.push(`label:${labels}`);
    if (assignee) queryParts.push(`assignee:${assignee}`);
    
    const q = queryParts.join(" ");
    
    const params = new URLSearchParams({
      q,
      per_page: String(per_page),
      sort: "created",
      order: "desc",
    });
    params.set("page", String(page));
  
    const endpoint = `/search/issues?${params.toString()}`;
    console.log(`[GitHub API] Org issues request URL: ${this.baseUrl}${endpoint}`);
    console.log(`[GitHub API] Org issues params:`, { q, ...Object.fromEntries(params.entries()) });
  
    try {
      const data = await this.request<{ total_count: number; items: unknown[] }>(endpoint);
      console.log(`[GitHub API] Raw org issues search response:`, { total_count: data.total_count, items_count: data.items.length, hasToken: !!this.token });
  
      // Defensive filtering - ensure items is an array
      const issuesOnly = Array.isArray(data.items) ? data.items : [];
      console.log(`[GitHub API] Org issues (already filtered):`, { count: issuesOnly.length });
      
      return issuesOnly.map(item => githubIssueSchema.parse(item));
    } catch (error) {
      if (error instanceof GitHubAPIError && error.status === 403) {
        throw new GitHubAPIError(`Access denied to search issues in ${org} organization. This requires "search" permission in your fine-grained PAT. Check your token permissions.`, 403);
      }
      throw error;
    }
  }

  async getRepositoryPRs({
    owner,
    repo,
    state = "open",
    base,
    head,
    per_page = 30,
  }: PRsInput): Promise<GitHubPR[]> {
    const params = new URLSearchParams({
      state,
      per_page: per_page.toString(),
    });

    if (base) params.append("base", base);
    if (head) params.append("head", head);

    const data = await this.request<unknown[]>(`/repos/${owner}/${repo}/pulls?${params}`);
    return data.map(item => githubPRSchema.parse(item));
  }

  async getOrganizationRepositories(org: string, per_page = 30): Promise<GitHubRepo[]> {
    const params = new URLSearchParams({
      per_page: per_page.toString(),
      sort: 'updated',
      direction: 'desc'
    });
    const data = await this.request<unknown[]>(`/orgs/${org}/repos?${params}`);
    return data.map(item => githubRepoSchema.parse(item));
  }
}

// Export singleton instance
export const githubAPI = new GitHubAPI();
export { GitHubAPIError };