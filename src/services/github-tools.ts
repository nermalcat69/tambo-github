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
  try {
    return await githubAPI.getRepositoryIssues(input);
  } catch (error) {
    throw new Error(`Failed to fetch issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// Analysis Tools (AI-powered)
export const analyzeRepository = async (input: z.infer<typeof repoInputSchema>) => {
  try {
    const [repo, issues, prs, commits] = await Promise.all([
      githubAPI.getRepository(input),
      githubAPI.getRepositoryIssues({ ...input, state: "all", per_page: 50 }),
      githubAPI.getRepositoryPRs({ ...input, state: "all", per_page: 50 }),
      githubAPI.getRepositoryCommits({ ...input, per_page: 30 }),
    ]);

    const openIssues = issues.filter(issue => issue.state === "open");
    const closedIssues = issues.filter(issue => issue.state === "closed");
    const openPRs = prs.filter(pr => pr.state === "open");
    const mergedPRs = prs.filter(pr => pr.merged);
    
    const recentCommits = commits.slice(0, 10);
    const contributors = [...new Set(commits.map(c => c.author?.login).filter(Boolean))];

    return {
      repository: repo,
      health: {
        total_issues: issues.length,
        open_issues: openIssues.length,
        closed_issues: closedIssues.length,
        total_prs: prs.length,
        open_prs: openPRs.length,
        merged_prs: mergedPRs.length,
        recent_commits: recentCommits.length,
        active_contributors: contributors.length,
        activity_score: Math.min(100, (recentCommits.length * 10) + (contributors.length * 5)),
      },
      recent_activity: {
        commits: recentCommits,
        open_issues: openIssues.slice(0, 5),
        recent_prs: prs.slice(0, 5),
      },
      contributors: contributors.slice(0, 10),
    };
  } catch (error) {
    throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// AI-Powered Analysis Tools
export const analyzePullRequest = async (input: {
  owner: string;
  repo: string;
  pr_number: number;
}) => {
  try {
    const pr = await githubAPI.getPullRequest(
      { owner: input.owner, repo: input.repo },
      input.pr_number
    );
    
    // AI-powered analysis
    const analysis = {
      summary: `This PR ${pr.title} introduces changes to ${pr.changed_files || 'multiple'} files with ${pr.additions || 0} additions and ${pr.deletions || 0} deletions.`,
      complexity: pr.changed_files && pr.changed_files > 10 ? 'high' : pr.changed_files && pr.changed_files > 5 ? 'medium' : 'low',
      impact: pr.additions && pr.additions > 500 ? 'major' : pr.additions && pr.additions > 100 ? 'moderate' : 'minor',
      review_priority: (pr.changed_files && pr.changed_files > 10) || (pr.additions && pr.additions > 200) ? 'high' : 'normal'
    };
    
    return {
      pr,
      analysis
    };
  } catch (error) {
    throw new Error(`Failed to analyze PR: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const classifyIssue = async (input: {
  owner: string;
  repo: string;
  issue_number: number;
}) => {
  try {
    const issue = await githubAPI.getIssue(
      { owner: input.owner, repo: input.repo },
      input.issue_number
    );
    
    // AI-powered classification based on title and body
    const title = issue.title.toLowerCase();
    const body = issue.body?.toLowerCase() || '';
    
    let type = 'feature';
    if (title.includes('bug') || title.includes('error') || title.includes('fix') || 
        body.includes('error') || body.includes('broken') || body.includes('not working')) {
      type = 'bug';
    } else if (title.includes('doc') || title.includes('readme') || 
               body.includes('documentation') || body.includes('docs')) {
      type = 'docs';
    }
    
    const priority = issue.labels?.some((label: any) => 
      typeof label === 'object' && label.name?.includes('urgent')
    ) ? 'high' : 'normal';
    
    return {
      issue,
      classification: {
        type,
        priority,
        estimated_effort: body.length > 500 ? 'large' : body.length > 200 ? 'medium' : 'small'
      }
    };
  } catch (error) {
    throw new Error(`Failed to classify issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateReleaseNotes = async (input: {
  owner: string;
  repo: string;
  from_tag?: string;
  to_tag?: string;
}) => {
  try {
    // Get recent commits and PRs
    const commits = await githubAPI.getRepositoryCommits({
      owner: input.owner,
      repo: input.repo,
      per_page: 50
    });
    
    const prs = await githubAPI.getRepositoryPRs({
      owner: input.owner,
      repo: input.repo,
      state: 'closed',
      per_page: 20
    });
    
    // Categorize changes
    const features: string[] = [];
    const bugfixes: string[] = [];
    const improvements: string[] = [];
    
    prs.forEach(pr => {
      const title = pr.title.toLowerCase();
      if (title.includes('feat') || title.includes('add') || title.includes('new')) {
        features.push(`- ${pr.title} (#${pr.number})`);
      } else if (title.includes('fix') || title.includes('bug')) {
        bugfixes.push(`- ${pr.title} (#${pr.number})`);
      } else {
        improvements.push(`- ${pr.title} (#${pr.number})`);
      }
    });
    
    const releaseNotes = [
      '## Release Notes\n',
      features.length > 0 ? '### 🚀 New Features\n' + features.join('\n') + '\n' : '',
      bugfixes.length > 0 ? '### 🐛 Bug Fixes\n' + bugfixes.join('\n') + '\n' : '',
      improvements.length > 0 ? '### 💫 Improvements\n' + improvements.join('\n') + '\n' : '',
      `### 📊 Statistics\n- ${commits.length} commits\n- ${prs.length} pull requests merged\n`
    ].filter(Boolean).join('\n');
    
    return {
      release_notes: releaseNotes,
      stats: {
        total_commits: commits.length,
        total_prs: prs.length,
        features_count: features.length,
        bugfixes_count: bugfixes.length,
        improvements_count: improvements.length
      }
    };
  } catch (error) {
    throw new Error(`Failed to generate release notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Input Schemas for new tools
export const analyzePRInputSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
  pr_number: z.number().describe("Pull request number")
});

export const classifyIssueInputSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
  issue_number: z.number().describe("Issue number")
});

export const generateReleaseNotesInputSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
  from_tag: z.string().optional().describe("Starting tag for release notes"),
  to_tag: z.string().optional().describe("Ending tag for release notes")
});

export const repositoryAnalysisSchema = z.object({
  repository: githubRepoSchema,
  health: z.object({
    total_issues: z.number(),
    open_issues: z.number(),
    closed_issues: z.number(),
    total_prs: z.number(),
    open_prs: z.number(),
    merged_prs: z.number(),
    recent_commits: z.number(),
    active_contributors: z.number(),
    activity_score: z.number(),
  }),
  recent_activity: z.object({
    commits: z.array(githubCommitSchema),
    open_issues: z.array(githubIssueSchema),
    recent_prs: z.array(githubPRSchema),
  }),
  contributors: z.array(z.string()),
});