import {
  GitHubRepo,
  GitHubIssue,
  GitHubPR,
  GitHubCommit,
  GitHubBranch,
  RepoInput,
  IssuesInput,
  PRsInput,
  CommitsInput,
  githubRepoSchema,
  githubIssueSchema,
  githubPRSchema,
  githubCommitSchema,
  githubBranchSchema,
} from "@/lib/types";

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

  async getRepository({ owner, repo }: RepoInput): Promise<GitHubRepo> {
    const data = await this.request<unknown>(`/repos/${owner}/${repo}`);
    return githubRepoSchema.parse(data);
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
    
    const params = new URLSearchParams();
    params.set("state", state);
    params.set("per_page", String(per_page));
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
      
      console.log(`[GitHub API] Filtered repo issues (excluding PRs):`, {
        count: issuesOnly.length,
        originalCount: dataArray.length,
        filteredCount: dataArray.length - issuesOnly.length
      });
      
      // Fallback: If all items are PRs and user asked for issues, try with different parameters
      if (issuesOnly.length === 0 && dataArray.length > 0) {
        console.log(`[GitHub API] All items are PRs, trying alternative approach...`);
        
        // Try with issue-specific filter
        const issueParams = new URLSearchParams();
        issueParams.set("state", state);
        issueParams.set("per_page", String(per_page));
        issueParams.set("page", String(page));
        if (labels) issueParams.set("labels", labels);
        if (assignee) issueParams.set("assignee", assignee);
        
        // Add issue filter to explicitly exclude PRs
        issueParams.set("filter", "issues");
        
        const issueEndpoint = `/repos/${owner}/${repo}/issues?${issueParams.toString()}`;
        console.log(`[GitHub API] Trying with issue filter: ${this.baseUrl}${issueEndpoint}`);
        
        try {
          const issueData = await this.request<unknown[]>(issueEndpoint);
          console.log(`[GitHub API] With issue filter:`, { count: issueData.length });
          
          const filteredIssues = Array.isArray(issueData) ? issueData.filter((item: unknown) => !(item as Record<string, unknown>).pull_request) : [];
          console.log(`[GitHub API] Filtered issues with issue filter:`, { count: filteredIssues.length });
          
          if (filteredIssues.length > 0) {
            return filteredIssues.map(item => githubIssueSchema.parse(item));
          }
        } catch (fallbackError) {
          console.log(`[GitHub API] Fallback approach failed:`, fallbackError);
        }
      }
      
      if (issuesOnly.length === 0 && dataArray.length > 0) {
        console.log(`[GitHub API] Warning: All ${dataArray.length} items were filtered out as PRs. The repository may have only PRs in the requested state.`);
      }
      
      return issuesOnly.map(item => githubIssueSchema.parse(item));
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

  async getRepositoryCommits({
    owner,
    repo,
    sha,
    per_page = 30,
  }: CommitsInput): Promise<GitHubCommit[]> {
    const params = new URLSearchParams({
      per_page: per_page.toString(),
    });

    if (sha) params.append("sha", sha);

    const data = await this.request<unknown[]>(`/repos/${owner}/${repo}/commits?${params}`);
    return data.map(item => githubCommitSchema.parse(item));
  }

  async getRepositoryBranches({ owner, repo }: RepoInput): Promise<GitHubBranch[]> {
    const data = await this.request<unknown[]>(`/repos/${owner}/${repo}/branches`);
    return data.map(branch => githubBranchSchema.parse(branch));
  }

  async getPullRequest({ owner, repo }: RepoInput, prNumber: number): Promise<GitHubPR> {
    const data = await this.request<unknown>(`/repos/${owner}/${repo}/pulls/${prNumber}`);
    return githubPRSchema.parse(data);
  }

  async getIssue({ owner, repo }: RepoInput, issueNumber: number): Promise<GitHubIssue> {
    const data = await this.request<unknown>(`/repos/${owner}/${repo}/issues/${issueNumber}`);
    return githubIssueSchema.parse(data);
  }

  async searchRepositories(query: string, per_page = 30): Promise<GitHubRepo[]> {
    const params = new URLSearchParams({
      q: query,
      per_page: per_page.toString(),
    });
    const data = await this.request<{ items: unknown[] }>(`/search/repositories?${params}`);
    return data.items.map(item => githubRepoSchema.parse(item));
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

  async getUserRepositories(username: string, per_page = 30): Promise<GitHubRepo[]> {
    const params = new URLSearchParams({
      per_page: per_page.toString(),
      sort: 'updated',
      direction: 'desc'
    });
    const data = await this.request<unknown[]>(`/users/${username}/repos?${params}`);
    return data.map(item => githubRepoSchema.parse(item));
  }

  async getRateLimit() {
    return this.request<unknown>("/rate_limit");
  }

  // Action methods (require write permissions)
  async starRepository({ owner, repo }: RepoInput): Promise<void> {
    await this.request(`/user/starred/${owner}/${repo}`, {
      method: "PUT",
    });
  }

  async unstarRepository({ owner, repo }: RepoInput): Promise<void> {
    await this.request(`/user/starred/${owner}/${repo}`, {
      method: "DELETE",
    });
  }

  async createIssueComment(
    { owner, repo }: RepoInput,
    issueNumber: number,
    body: string
  ): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    });
  }

  async addIssueLabels(
    { owner, repo }: RepoInput,
    issueNumber: number,
    labels: string[]
  ): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ labels }),
    });
  }

  // Methods for summarization data
  async getRepositoryReadme({ owner, repo }: RepoInput): Promise<{ content: string; encoding: string } | null> {
    try {
      const response = await this.request<unknown>(`/repos/${owner}/${repo}/readme`);
      const responseObj = response as Record<string, unknown>;
      return {
        content: responseObj.content as string,
        encoding: responseObj.encoding as string
      };
    } catch (error) {
      if (error instanceof GitHubAPIError && error.status === 404) {
        return null; // No README found
      }
      throw error;
    }
  }

  async getPullRequestDiff({ owner, repo }: RepoInput, prNumber: number): Promise<string> {
    const response = await this.request<string>(`/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: {
        Accept: "application/vnd.github.v3.diff"
      }
    });
    return response;
  }

  async getIssueComments({ owner, repo }: RepoInput, issueNumber: number): Promise<unknown[]> {
    return this.request<unknown[]>(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`);
  }

  async getPullRequestComments({ owner, repo }: RepoInput, prNumber: number): Promise<unknown[]> {
    return this.request<unknown[]>(`/repos/${owner}/${repo}/pulls/${prNumber}/comments`);
  }
}

// Export singleton instance
export const githubAPI = new GitHubAPI();
export { GitHubAPIError };