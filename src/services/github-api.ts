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
        throw new GitHubAPIError(
          `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`,
          response.status
        );
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
    const data = await this.request<any>(`/repos/${owner}/${repo}`);
    return githubRepoSchema.parse(data);
  }

  async getRepositoryIssues({
    owner,
    repo,
    state = "open",
    labels,
    assignee,
    per_page = 30,
  }: IssuesInput): Promise<GitHubIssue[]> {
    console.log(`[GitHub API] Fetching issues for ${owner}/${repo}`, { state, labels, assignee, per_page });
    
    const params = new URLSearchParams({
      state,
      per_page: per_page.toString(),
    });

    if (labels) params.append("labels", labels);
    if (assignee) params.append("assignee", assignee);

    try {
      const data = await this.request<any[]>(`/repos/${owner}/${repo}/issues?${params}`);
      console.log(`[GitHub API] Raw issues response:`, { count: data.length, hasToken: !!this.token });
      
      // Filter out pull requests (GitHub's issues API includes PRs)
      const issuesOnly = data.filter(item => !item.pull_request);
      console.log(`[GitHub API] Filtered issues (excluding PRs):`, { count: issuesOnly.length });
      
      const parsedIssues = issuesOnly.map(item => {
        try {
          return githubIssueSchema.parse(item);
        } catch (parseError) {
          console.error(`[GitHub API] Failed to parse issue:`, { item, error: parseError });
          throw parseError;
        }
      });
      
      console.log(`[GitHub API] Successfully parsed ${parsedIssues.length} issues`);
      return parsedIssues;
    } catch (error) {
      console.error(`[GitHub API] Error fetching issues for ${owner}/${repo}:`, error);
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

    const data = await this.request<any[]>(`/repos/${owner}/${repo}/pulls?${params}`);
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

    const data = await this.request<any[]>(`/repos/${owner}/${repo}/commits?${params}`);
    return data.map(item => githubCommitSchema.parse(item));
  }

  async getRepositoryBranches({ owner, repo }: RepoInput): Promise<GitHubBranch[]> {
    const data = await this.request<any[]>(`/repos/${owner}/${repo}/branches`);
    return data.map(branch => githubBranchSchema.parse(branch));
  }

  async getPullRequest({ owner, repo }: RepoInput, prNumber: number): Promise<GitHubPR> {
    const data = await this.request<any>(`/repos/${owner}/${repo}/pulls/${prNumber}`);
    return githubPRSchema.parse(data);
  }

  async getIssue({ owner, repo }: RepoInput, issueNumber: number): Promise<GitHubIssue> {
    const data = await this.request<any>(`/repos/${owner}/${repo}/issues/${issueNumber}`);
    return githubIssueSchema.parse(data);
  }

  async searchRepositories(query: string, per_page = 30): Promise<GitHubRepo[]> {
    const params = new URLSearchParams({
      q: query,
      per_page: per_page.toString(),
    });
    const data = await this.request<{ items: any[] }>(`/search/repositories?${params}`);
    return data.items.map(item => githubRepoSchema.parse(item));
  }

  async getOrganizationRepositories(org: string, per_page = 30): Promise<GitHubRepo[]> {
    const params = new URLSearchParams({
      per_page: per_page.toString(),
      sort: 'updated',
      direction: 'desc'
    });
    const data = await this.request<any[]>(`/orgs/${org}/repos?${params}`);
    return data.map(item => githubRepoSchema.parse(item));
  }

  async getUserRepositories(username: string, per_page = 30): Promise<GitHubRepo[]> {
    const params = new URLSearchParams({
      per_page: per_page.toString(),
      sort: 'updated',
      direction: 'desc'
    });
    const data = await this.request<any[]>(`/users/${username}/repos?${params}`);
    return data.map(item => githubRepoSchema.parse(item));
  }

  async getRateLimit() {
    return this.request<any>("/rate_limit");
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
      const response = await this.request<any>(`/repos/${owner}/${repo}/readme`);
      return {
        content: response.content,
        encoding: response.encoding
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

  async getIssueComments({ owner, repo }: RepoInput, issueNumber: number): Promise<any[]> {
    return this.request<any[]>(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`);
  }

  async getPullRequestComments({ owner, repo }: RepoInput, prNumber: number): Promise<any[]> {
    return this.request<any[]>(`/repos/${owner}/${repo}/pulls/${prNumber}/comments`);
  }
}

// Export singleton instance
export const githubAPI = new GitHubAPI();
export { GitHubAPIError };