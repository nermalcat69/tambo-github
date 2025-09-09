/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools (robust + NL-friendly)
 */

import { z } from "zod";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { RepoCard } from "@/components/ui/RepoCard";
import { CardGroup, RepoCardGroup } from "@/components/ui/CardGroup";
import { PRCard } from "@/components/ui/PRCard";
import { IssueCard } from "@/components/ui/IssueCard";
import { HealthGauge, HealthDashboard } from "@/components/ui/HealthGauge";
import { Timeline } from "@/components/ui/Timeline";
import { ReleaseNotes } from "@/components/ui/ReleaseNotes";
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
import { exaService } from "@/lib/exa";

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

  // Exa Search Tools
  {
    name: "searchWithExa",
    description: "Search the web using Exa for general information, documentation, and resources.",
    tool: async (params: { query: string; numResults?: number; includeDomains?: string[]; excludeDomains?: string[] }) => {
      return await exaService.search(params.query, {
        numResults: params.numResults || 10,
        includeDomains: params.includeDomains,
        excludeDomains: params.excludeDomains,
      });
    },
    toolSchema: createTamboSchema(z.object({
      query: z.string().describe("Search query"),
      numResults: z.number().min(1).max(20).optional().describe("Number of results (1-20)"),
      includeDomains: z.array(z.string()).optional().describe("Domains to include in search"),
      excludeDomains: z.array(z.string()).optional().describe("Domains to exclude from search"),
    })),
  },
  {
    name: "searchGitHubIssuesWithExa",
    description: "Search GitHub issues using Exa for better context and discovery.",
    tool: async (params: { query: string; repository?: string }) => {
      return await exaService.searchGitHubIssues(params.query, params.repository);
    },
    toolSchema: createTamboSchema(z.object({
      query: z.string().describe("Search query for GitHub issues"),
      repository: z.string().optional().describe("Specific repository (owner/repo format)"),
    })),
  },
  {
    name: "searchGitHubPRsWithExa",
    description: "Search GitHub pull requests using Exa for better context and discovery.",
    tool: async (params: { query: string; repository?: string }) => {
      return await exaService.searchGitHubPRs(params.query, params.repository);
    },
    toolSchema: createTamboSchema(z.object({
      query: z.string().describe("Search query for GitHub pull requests"),
      repository: z.string().optional().describe("Specific repository (owner/repo format)"),
    })),
  },
  {
    name: "searchDocumentationWithExa",
    description: "Search for documentation and technical resources using Exa.",
    tool: async (params: { query: string; technology?: string }) => {
      return await exaService.searchDocumentation(params.query, params.technology);
    },
    toolSchema: createTamboSchema(z.object({
      query: z.string().describe("Search query for documentation"),
      technology: z.string().optional().describe("Specific technology or framework"),
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
      "Repository card (name, desc, stars, forks, language, updated). Selectable; AI-friendly.",
    component: RepoCard,
    propsDefinition: { repo: { type: "object", optional: true } },
  },
  {
    name: "CardGroup",
    description:
      "Unified grid container for any card type (RepoCard, PRCard, IssueCard). Supports 1-3 columns with responsive layout.",
    component: CardGroup,
    propsDefinition: { 
      children: { type: "node", optional: false },
      title: { type: "string", optional: true },
      columns: { type: "number", optional: true },
      className: { type: "string", optional: true }
    },
  },
  {
    name: "RepoCardGroup",
    description:
      "Legacy alias for CardGroup. Use CardGroup instead for new implementations.",
    component: RepoCardGroup,
    propsDefinition: { 
      children: { type: "node", optional: false },
      title: { type: "string", optional: true },
      columns: { type: "number", optional: true },
      className: { type: "string", optional: true }
    },
  },
  {
    name: "PRCard",
    description:
      "PR card (title, author, status, labels, review state, merge info). Includes AI summaries.",
    component: PRCard,
    propsDefinition: { pr: { type: "object", optional: true } },
  },
  {
    name: "IssueCard",
    description:
      "Issue card (title, body, labels, assignees, state). Auto type detection + selection.",
    component: IssueCard,
    propsDefinition: { issue: { type: "object", optional: true } },
  },
  {
    name: "HealthGauge",
    description:
      "Circular gauge (0–100) with animated progress + status color (red/yellow/green).",
    component: HealthGauge,
    propsDefinition: {
      score: { type: "number", optional: true },
      label: { type: "string", optional: true },
    },
  },
  {
    name: "HealthDashboard",
    description:
      "Grid dashboard of health metrics (quality, activity, docs, tests, community).",
    component: HealthDashboard,
    propsDefinition: { data: { type: "object", optional: true } },
  },
  {
    name: "Timeline",
    description:
      "Vertical timeline for repo events (commits, PRs, issues, releases) with timestamps.",
    component: Timeline,
    propsDefinition: { events: { type: "array", optional: true } },
  },
  {
    name: "ReleaseNotes",
    description:
      "Formatted release notes viewer (version, features, fixes, breaking changes, credits).",
    component: ReleaseNotes,
    propsDefinition: {
      version: { type: "string", optional: true },
      notes: { type: "string", optional: true },
    },
  },
];
