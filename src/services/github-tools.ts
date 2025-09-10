import { z } from "zod";
import { githubAPI } from "./github-api";
import {
  repoInputSchema,
  issuesInputSchema,
  prsInputSchema,
  commitsInputSchema,
  githubRepoSchema,
  githubIssueSchema,
  githubPRSchema,
  githubCommitSchema,
} from "@/lib/types";

// Repository Tools
export const getRepository = async (input: z.infer<typeof repoInputSchema>) => {
  try {
    return await githubAPI.getRepository(input);
  } catch (error) {
    throw new Error(`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const searchRepositories = async (input: { q: string; per_page?: number }) => {
  try {
    return await githubAPI.searchRepositories(input.q, input.per_page);
  } catch (error) {
    throw new Error(`Failed to search repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getOrganizationRepositories = async (input: { org: string; per_page?: number }) => {
  try {
    return await githubAPI.getOrganizationRepositories(input.org, input.per_page);
  } catch (error) {
    throw new Error(`Failed to fetch organization repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getUserRepositories = async (input: { username: string; per_page?: number }) => {
  try {
    return await githubAPI.getUserRepositories(input.username, input.per_page);
  } catch (error) {
    throw new Error(`Failed to fetch user repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getRepositoryBranches = async (input: z.infer<typeof repoInputSchema>) => {
  try {
    return await githubAPI.getRepositoryBranches(input);
  } catch (error) {
    throw new Error(`Failed to fetch branches: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Issues Tools
export const getRepositoryIssues = async (input: z.infer<typeof issuesInputSchema>) => {
  console.log('[GitHub Tools] getRepositoryIssues called with:', input);
  try {
    const issues = await githubAPI.getRepositoryIssues(input);
    console.log(`[GitHub Tools] Successfully fetched ${issues.length} issues`);
    return issues;
  } catch (error) {
    console.error('[GitHub Tools] Failed to fetch issues:', error);
    throw new Error(`Failed to fetch issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getOrganizationIssues = async (input: { org: string; state?: "open" | "closed" | "all"; per_page?: number; labels?: string; assignee?: string }) => {
  console.log('[GitHub Tools] getOrganizationIssues called with:', input);
  try {
    const issues = await githubAPI.getOrganizationIssues({
      ...input,
      owner: "", // Required field but not used for org queries
      per_page: input.per_page || 30,
      state: input.state || "open"
    });
    console.log(`[GitHub Tools] Successfully fetched ${issues.length} org issues`);
    return issues;
  } catch (error) {
    console.error('[GitHub Tools] Failed to fetch org issues:', error);
    throw new Error(`Failed to fetch organization issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Test GitHub API connectivity
export const testGitHubAPI = async () => {
  try {
    console.log('[GitHub Tools] Testing GitHub API connectivity...');
    
    // Test with a known public repo that has issues (microsoft/vscode)
    const testRepo = { owner: 'microsoft', repo: 'vscode' };
    const issues = await githubAPI.getRepositoryIssues({
      ...testRepo,
      state: 'open',
      per_page: 5
    });
    
    console.log(`[GitHub Tools] API test successful: Found ${issues.length} issues in ${testRepo.owner}/${testRepo.repo}`);
    
    // Check rate limit
    const rateLimit = await githubAPI.getRateLimit();
    console.log(`[GitHub Tools] Rate limit status:`, rateLimit);
    
    return {
      success: true,
      testRepo,
      issueCount: issues.length,
      rateLimit
    };
  } catch (error) {
    console.error('[GitHub Tools] API test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Pull Requests Tools
export const getRepositoryPRs = async (input: z.infer<typeof prsInputSchema>) => {
  try {
    return await githubAPI.getRepositoryPRs(input);
  } catch (error) {
    throw new Error(`Failed to fetch pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Commits Tools
export const getRepositoryCommits = async (input: z.infer<typeof commitsInputSchema>) => {
  try {
    return await githubAPI.getRepositoryCommits(input);
  } catch (error) {
    throw new Error(`Failed to fetch commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Action Tools (require authentication)
export const starRepository = async (input: z.infer<typeof repoInputSchema>) => {
  try {
    await githubAPI.starRepository(input);
    return { success: true, message: `Successfully starred ${input.owner}/${input.repo}` };
  } catch (error) {
    throw new Error(`Failed to star repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const unstarRepository = async (input: z.infer<typeof repoInputSchema>) => {
  try {
    await githubAPI.unstarRepository(input);
    return { success: true, message: `Successfully unstarred ${input.owner}/${input.repo}` };
  } catch (error) {
    throw new Error(`Failed to unstar repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const addIssueComment = async (input: {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}) => {
  try {
    await githubAPI.createIssueComment(
      { owner: input.owner, repo: input.repo },
      input.issue_number,
      input.body
    );
    return { success: true, message: `Successfully added comment to issue #${input.issue_number}` };
  } catch (error) {
    throw new Error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const addIssueLabels = async (input: {
  owner: string;
  repo: string;
  issue_number: number;
  labels: string[];
}) => {
  try {
    await githubAPI.addIssueLabels(
      { owner: input.owner, repo: input.repo },
      input.issue_number,
      input.labels
    );
    return { success: true, message: `Successfully added labels to issue #${input.issue_number}` };
  } catch (error) {
    throw new Error(`Failed to add labels: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};


// Input schemas for tools
export const searchRepositoriesInputSchema = z.object({
  q: z.string().describe("Search query for repositories"),
  per_page: z.number().min(1).max(100).default(30).optional().describe("Number of results per page"),
});

export const addIssueCommentInputSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
  issue_number: z.number().describe("Issue number"),
  body: z.string().describe("Comment body"),
});

export const addIssueLabelsInputSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
  issue_number: z.number().describe("Issue number"),
  labels: z.array(z.string()).describe("Array of label names to add"),
});

// Response schemas
export const actionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

