/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools (robust + NL-friendly)
 */

import { z } from "zod";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { RepoCard } from "@/components/ui/RepoCard";
import { PRCard } from "@/components/ui/PRCard";
import { IssueCard } from "@/components/ui/IssueCard";
import { ObjectRenderer } from "@/components/ui/ObjectRenderer";
import { GridLayout } from "@/components/ui/GridLayout";
import { HealthGauge, HealthDashboard } from "@/components/ui/HealthGauge";
import { Timeline } from "@/components/ui/Timeline";
import { ReleaseNotes } from "@/components/ui/ReleaseNotes";
import { githubRepoSchema, githubIssueSchema, githubPRSchema } from "@/lib/types";
import {
  getRepository,
  searchRepositories,
  getOrganizationRepositories,
  getUserRepositories,
  getRepositoryBranches,
  getRepositoryIssues,
  getRepositoryPRs,
  getRepositoryCommits,
  starRepository,
  unstarRepository,
  addIssueComment,
  addIssueLabels,
  analyzeRepository,
  analyzePullRequest,
  classifyIssue,
  generateReleaseNotes,
} from "@/services/github-tools";
import { resolveGitHubIntent } from "@/services/resolve-github-intent";


/* -------------------------------------------------------------------------- */
/*                             SCHEMA UTILITIES                                */
/* -------------------------------------------------------------------------- */

/** Clamp helper */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Convert Zod schema to Tambo-compatible schema */
const createTamboSchema = (zodSchema: z.ZodType) => {
  // Return a Zod function schema as expected by TamboTool interface
  return z.function().args(zodSchema).returns(z.any());
};

/** Per-page schema with aliases */
export const PerPageSchema = z
  .union([
    z.number().int().min(1).max(100),
    z.string().transform((s) => {
      const n = parseInt(s, 10);
      return isNaN(n) ? 30 : clamp(n, 1, 100);
    }),
  ])
  .transform((n) => (typeof n === "string" ? parseInt(n, 10) : n))
  .refine((n) => !isNaN(n) && n >= 1 && n <= 100, "Must be 1-100")
  .describe("Results per page (1-100)");

/** Owner + repo schema with aliases */
export const OwnerRepoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  org: z.string().optional(),
  full_name: z.string().optional(),
});

/** State schema */
const StateSchema = z.enum(["open", "closed", "all"]).default("open");

/** Coerced number for issue/PR numbers */
const CoercedNumber = z
  .union([z.number(), z.string()])
  .transform((v) => {
    if (typeof v === "string") {
      const cleaned = v.replace(/^#/, "");
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return v;
  })
  .refine((n) => n > 0, "Must be a positive number");

/* -------------------------------------------------------------------------- */
/*                                   TOOLS                                    */
/* -------------------------------------------------------------------------- */

export const tools: TamboTool[] = [
  /* ---------------------------- NL Intent Parser --------------------------- */
  {
    name: "resolveGitHubIntent",
    description:
      "Parse a natural-language GitHub request and automatically execute the appropriate action. Handles org repos, user repos, searches, and specific repository operations.",
    tool: async (params: { input: string; fallback_per_page?: number }) => {
      const resolvedParams = {
        input: params.input,
        fallback_per_page: params.fallback_per_page ?? 10
      };
      const intent = resolveGitHubIntent(resolvedParams);
      
      switch (intent.kind) {
        case "list_org_repos":
          return await getOrganizationRepositories(intent.params);
        case "list_user_repos":
          return await getUserRepositories(intent.params);
        case "search_repos":
          return await searchRepositories(intent.params);
        case "get_repo":
          return await getRepository(intent.params);
        case "list_issues":
          const issueParams = {
            ...intent.params,
            state: intent.params.state ?? "open" as const,
            per_page: intent.params.per_page ?? 30
          };
          return await getRepositoryIssues(issueParams);
        case "list_prs":
          const prParams = {
            ...intent.params,
            state: intent.params.state ?? "open" as const,
            per_page: intent.params.per_page ?? 30
          };
          return await getRepositoryPRs(prParams);
        case "list_commits":
          const commitParams = {
            ...intent.params,
            per_page: intent.params.per_page ?? 30
          };
          return await getRepositoryCommits(commitParams);
        default:
          throw new Error(`Unknown intent kind: ${(intent as any).kind}`);
      }
    },
    toolSchema: createTamboSchema(z.object({
      input: z.string().describe("Natural language request (e.g., 'show me tambo-ai org repos', 'list vercel repositories')"),
      fallback_per_page: PerPageSchema.describe("Default count if none found").optional(),
    })),
  },

  /* --------------------------------- Read ---------------------------------- */
  {
    name: "getRepository",
    description:
      "Fetch repository info (stars, forks, issues, description, language, license, activity). Accepts owner/org/user aliases or full_name.",
    tool: getRepository,
    toolSchema: createTamboSchema(OwnerRepoSchema),
  },
  {
    name: "searchRepositories",
    description:
      "Search GitHub repos with flexible filters (owner/org aliases, language, topic, sort). Supports natural language queries.",
    tool: searchRepositories,
    toolSchema: createTamboSchema(z
      .object({
        q: z.string().optional().describe("GitHub search query, e.g. 'language:ts topic:tambo'"),
        nlq: z.string().optional().describe("Natural-language search string"),
        owner: z.string().optional(),
        org: z.string().optional(),
        organization: z.string().optional(),
        account: z.string().optional(),
        user: z.string().optional(),
        language: z.string().optional(),
        topic: z.string().optional(),
        sort: z
          .enum(["stars", "forks", "help-wanted-issues", "updated"])
          .optional()
          .describe("Sort field"),
        order: z.enum(["desc", "asc"]).optional(),
        per_page: PerPageSchema.describe("Results per page (aliases: count, limit)").optional(),
      })
      .passthrough()
      .transform((v) => {
        const owner = v.owner || v.org || v.organization || v.account || v.user;
        if (owner) {
          v.q = v.q ? `${v.q} user:${owner}` : `user:${owner}`;
        }
        if (v.language) {
          v.q = v.q ? `${v.q} language:${v.language}` : `language:${v.language}`;
        }
        if (v.topic) {
          v.q = v.q ? `${v.q} topic:${v.topic}` : `topic:${v.topic}`;
        }
        return v;
      })),
  },
  {
    name: "getOrganizationRepositories",
    description:
      "List all repositories for an organization, sorted by last updated. Perfect for exploring org repos.",
    tool: getOrganizationRepositories,
    toolSchema: createTamboSchema(z.object({
      org: z.string().min(1).describe("Organization name"),
      per_page: PerPageSchema.optional(),
    })),
  },
  {
    name: "getUserRepositories",
    description:
      "List all repositories for a user, sorted by last updated. Great for exploring user's projects.",
    tool: getUserRepositories,
    toolSchema: createTamboSchema(z.object({
      username: z.string().min(1).describe("GitHub username"),
      per_page: PerPageSchema.optional(),
    })),
  },
  {
    name: "getRepositoryBranches",
    description:
      "List repository branches with optional per_page. Accepts owner/org aliases or full_name.",
    tool: getRepositoryBranches,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      per_page: PerPageSchema.optional(),
    })),
  },
  {
    name: "getRepositoryIssues",
    description:
      "List issues with filters (state, labels, assignee). Accepts owner/org aliases; per_page/count/limit.",
    tool: getRepositoryIssues,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      state: StateSchema,
      labels: z.string().optional(),
      assignee: z.string().optional(),
      per_page: PerPageSchema.optional(),
    })),
  },
  {
    name: "getRepositoryPRs",
    description:
      "List PRs with filters. Accepts owner/org aliases; base/head branches; loose state; per_page/count/limit.",
    tool: getRepositoryPRs,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      state: StateSchema,
      base: z.string().optional(),
      head: z.string().optional(),
      per_page: PerPageSchema.optional(),
    })),
  },
  {
    name: "getRepositoryCommits",
    description:
      "List commits with optional sha/branch; accepts owner/org aliases; per_page/count/limit.",
    tool: getRepositoryCommits,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      sha: z.string().optional(),
      per_page: PerPageSchema.optional(),
    })),
  },

  /* ---------------------------- Write / Mutations --------------------------- */
  {
    name: "starRepository",
    description: "Star a repository; accepts owner/org aliases.",
    tool: starRepository,
    toolSchema: createTamboSchema(OwnerRepoSchema),
  },
  {
    name: "unstarRepository",
    description: "Unstar a repository; accepts owner/org aliases.",
    tool: unstarRepository,
    toolSchema: createTamboSchema(OwnerRepoSchema),
  },
  {
    name: "addIssueComment",
    description:
      "Comment on an issue; accepts '#42' style issue_number; owner/org aliases; Markdown body.",
    tool: addIssueComment,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      issue_number: CoercedNumber,
      body: z.string(),
    })),
  },
  {
    name: "addIssueLabels",
    description: "Add labels to an issue; accepts '#42' style issue_number; owner/org aliases.",
    tool: addIssueLabels,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      issue_number: CoercedNumber,
      labels: z.array(z.string()).nonempty(),
    })),
  },

  /* ------------------------------ AI / Analysis ----------------------------- */
  {
    name: "analyzeRepository",
    description: "AI analysis for repo health; accepts owner/org aliases.",
    tool: analyzeRepository,
    toolSchema: createTamboSchema(OwnerRepoSchema),
  },
  {
    name: "analyzePullRequest",
    description:
      "AI analysis of a PR; accepts '#123' style pr_number; owner/org aliases; merge readiness insights.",
    tool: analyzePullRequest,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      pr_number: CoercedNumber,
    })),
  },
  {
    name: "classifyIssue",
    description:
      "AI classification of an issue (type/effort/priority); accepts '#42' style issue_number.",
    tool: classifyIssue,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      issue_number: CoercedNumber,
    })),
  },
  {
    name: "generateReleaseNotes",
    description:
      "AI-generated release notes between tags/commits. Accepts owner/org aliases; from_tag/to_tag optional.",
    tool: generateReleaseNotes,
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
      from_tag: z.string().optional(),
      to_tag: z.string().optional(),
    })),
  },
  {
    name: "summarizeRepository",
    description:
      "AI summarization of a repository based on its README, description, and metadata. Provides concise overview of what the repo does.",
    tool: async (params: { owner: string; repo: string; org?: string; full_name?: string }) => {
      try {
        const { githubAPI } = await import("@/services/github-api");
        
        // Get repository info and README
        const [repoInfo, readmeData] = await Promise.all([
          githubAPI.getRepository({ owner: params.owner, repo: params.repo }),
          githubAPI.getRepositoryReadme({ owner: params.owner, repo: params.repo })
        ]);
        
        let readmeContent = "";
        if (readmeData) {
          // Decode base64 content
          readmeContent = readmeData.encoding === 'base64' 
            ? atob(readmeData.content.replace(/\s/g, ''))
            : readmeData.content;
        }
        
        // Create a concise summary
        const summary = `**${repoInfo.name}** - ${repoInfo.description || 'No description available'}\n\n` +
          `**Language:** ${repoInfo.language || 'Not specified'}\n` +
          `**Stars:** ${repoInfo.stargazers_count} | **Forks:** ${repoInfo.forks_count}\n\n` +
          (readmeContent ? `**Overview:** ${readmeContent.substring(0, 300)}...` : 'No README available');
        
        return { summary };
      } catch (error) {
        console.error('Error summarizing repository:', error);
        return { summary: `Error summarizing repository: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    },
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      org: z.string().optional(),
      full_name: z.string().optional(),
    })),
  },
  {
    name: "summarizePullRequest",
    description:
      "AI summarization of a pull request based on its diff, title, description, and comments. Analyzes code changes and impact.",
    tool: async (params: { owner: string; repo: string; pr_number: number; org?: string; full_name?: string }) => {
      try {
        const { githubAPI } = await import("@/services/github-api");
        
        // Get PR info, diff, and comments
        const [prInfo, diff, comments] = await Promise.all([
          githubAPI.getPullRequest({ owner: params.owner, repo: params.repo }, params.pr_number),
          githubAPI.getPullRequestDiff({ owner: params.owner, repo: params.repo }, params.pr_number),
          githubAPI.getPullRequestComments({ owner: params.owner, repo: params.repo }, params.pr_number)
        ]);
        
        // Analyze diff for key changes
        const diffLines = diff.split('\n');
        const addedLines = diffLines.filter(line => line.startsWith('+')).length;
        const removedLines = diffLines.filter(line => line.startsWith('-')).length;
        const filesChanged = (diff.match(/diff --git/g) || []).length;
        
        // Create summary
        const summary = `**PR #${params.pr_number}: ${prInfo.title}**\n\n` +
          `**Status:** ${prInfo.state} | **Author:** ${prInfo.user?.login}\n` +
          `**Changes:** ${filesChanged} files, +${addedLines} additions, -${removedLines} deletions\n\n` +
          `**Description:** ${prInfo.body?.substring(0, 200) || 'No description'}...\n\n` +
          `**Comments:** ${comments.length} review comments`;
        
        return { summary };
      } catch (error) {
        console.error('Error summarizing PR:', error);
        return { summary: `Error summarizing PR: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    },
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      pr_number: CoercedNumber,
      org: z.string().optional(),
      full_name: z.string().optional(),
    })),
  },
  {
    name: "summarizeIssue",
    description:
      "AI summarization of an issue based on its title, description, comments, and labels. Provides context and key points.",
    tool: async (params: { owner: string; repo: string; issue_number: number; org?: string; full_name?: string }) => {
      try {
        const { githubAPI } = await import("@/services/github-api");
        
        // Get issue info and comments
        const [issueInfo, comments] = await Promise.all([
          githubAPI.getIssue({ owner: params.owner, repo: params.repo }, params.issue_number),
          githubAPI.getIssueComments({ owner: params.owner, repo: params.repo }, params.issue_number)
        ]);
        
        // Extract labels
        const labels = issueInfo.labels?.map((label: any) => label.name).join(', ') || 'None';
        
        // Get recent comments
        const recentComments = comments.slice(-3).map((comment: any) => 
          `${comment.user?.login}: ${comment.body?.substring(0, 100)}...`
        ).join('\n');
        
        // Create summary
        const summary = `**Issue #${params.issue_number}: ${issueInfo.title}**\n\n` +
          `**Status:** ${issueInfo.state} | **Author:** ${issueInfo.user?.login}\n` +
          `**Labels:** ${labels}\n\n` +
          `**Description:** ${issueInfo.body?.substring(0, 200) || 'No description'}...\n\n` +
          `**Activity:** ${comments.length} comments` +
          (recentComments ? `\n\n**Recent Comments:**\n${recentComments}` : '');
        
        return { summary };
      } catch (error) {
        console.error('Error summarizing issue:', error);
        return { summary: `Error summarizing issue: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    },
    toolSchema: createTamboSchema(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      issue_number: CoercedNumber,
      org: z.string().optional(),
      full_name: z.string().optional(),
    })),
  },


];

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

export const components: TamboComponent[] = [
  {
    name: "RepoCard",
    description:
      "Repository card (name, desc, stars, forks, language, updated). Now handles raw GitHub repo objects directly. Selectable; AI-friendly. Includes summarize button.",
    component: RepoCard,
    propsSchema: z.object({
      repo: z.union([githubRepoSchema, z.unknown()]).optional(),
      onSelect: z.function().optional(),
      isSelected: z.boolean().optional(),
      onSummarize: z.function().optional(),
    }),
  },
  {
    name: "ObjectRenderer",
    description:
      "Smart object renderer that detects GitHub object types (repo, issue, PR) and delegates to appropriate card components. Handles raw objects safely.",
    component: ObjectRenderer,
    propsSchema: z.object({
      data: z.unknown(),
      index: z.number().optional(),
      onSelect: z.function().optional(),
      isSelected: z.boolean().optional(),
    }),
  },
  {
    name: "GridLayout",
    description:
      "Grid layout component for displaying multiple items (repositories, issues, PRs) in a responsive grid. Supports 1-4 columns with responsive breakpoints. Perfect for showing lists of GitHub data.",
    component: GridLayout,
    propsSchema: z.object({
      items: z.array(z.unknown()),
      columns: z.enum(["1", "2", "3", "4"]).transform(val => parseInt(val) as 1 | 2 | 3 | 4).optional(),
      onSelect: z.function().optional(),
      selectedIndex: z.number().optional(),
    }),
  },

  {
    name: "PRCard",
    description:
      "PR card (title, author, status, labels, review state, merge info). Now handles raw GitHub PR objects directly. Includes AI summaries and summarize button.",
    component: PRCard,
    propsSchema: z.object({
      pr: z.union([githubPRSchema, z.unknown()]).optional(),
      analysis: z.object({
        summary: z.string(),
        complexity: z.enum(['low', 'medium', 'high']),
        impact: z.enum(['minor', 'moderate', 'major']),
        review_priority: z.enum(['low', 'normal', 'high']),
      }).optional(),
      onSelect: z.function().optional(),
      isSelected: z.boolean().optional(),
      onSummarize: z.function().optional(),
    }),
  },
  {
    name: "IssueCard",
    description:
      "Issue card (title, body, labels, assignees, state). Now handles raw GitHub issue objects directly. Auto type detection + selection. Includes summarize button.",
    component: IssueCard,
    propsSchema: z.object({
      issue: z.union([githubIssueSchema, z.unknown()]).optional(),
      classification: z.object({
        type: z.enum(['bug', 'feature', 'docs']),
        priority: z.enum(['normal', 'high']),
        estimated_effort: z.enum(['small', 'medium', 'large']),
      }).optional(),
      onSelect: z.function().optional(),
      isSelected: z.boolean().optional(),
      onSummarize: z.function().optional(),
    }),
  },
  {
    name: "HealthGauge",
    description:
      "Circular gauge (0–100) with animated progress + status color (red/yellow/green).",
    component: HealthGauge,
    propsSchema: z.object({
      score: z.number().optional(),
      label: z.string().optional(),
    }),
  },
  {
    name: "HealthDashboard",
    description:
      "Grid dashboard of health metrics (quality, activity, docs, tests, community).",
    component: HealthDashboard,
    propsSchema: z.object({
      data: z.object({}).optional(),
    }),
  },
  {
    name: "Timeline",
    description:
      "Vertical timeline for repo events (commits, PRs, issues, releases) with timestamps.",
    component: Timeline,
    propsSchema: z.object({
      events: z.array(z.any()).optional(),
    }),
  },
  {
    name: "ReleaseNotes",
    description:
      "Formatted release notes viewer (version, features, fixes, breaking changes, credits).",
    component: ReleaseNotes,
    propsSchema: z.object({
      version: z.string().optional(),
      notes: z.string().optional(),
    }),
  },
];
