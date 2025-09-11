/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools (robust + NL-friendly)
 */

import { z } from "zod";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { RepoCard } from "../components/ui/RepoCard";
import { PRCard } from "../components/ui/PRCard";
import { IssueCard } from "../components/ui/IssueCard";
import { ObjectRenderer } from "../components/ui/ObjectRenderer";
import { GridLayout } from "../components/ui/GridLayout";
import { HealthGauge, HealthDashboard } from "../components/ui/HealthGauge";
import { Timeline } from "../components/ui/Timeline";
import { ReleaseNotes } from "../components/ui/ReleaseNotes";
import { githubRepoSchema, githubIssueSchema, githubPRSchema } from "./types";
import {
  getOrganizationRepositories,
  getRepositoryIssues,
  getRepositoryPRs,
} from "../services/github-tools";
import { resolveGitHubIntent } from "../services/resolve-github-intent";


/* -------------------------------------------------------------------------- */
/*                             SCHEMA UTILITIES                                */
/* -------------------------------------------------------------------------- */

/** Clamp helper */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Convert Zod schema to Tambo-compatible schema */
const createTamboSchema = (zodSchema: z.ZodType) => {
  // Return a Zod function schema as expected by TamboTool interface
  return z.function().args(zodSchema).returns(z.unknown());
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



/* -------------------------------------------------------------------------- */
/*                                   TOOLS                                    */
/* -------------------------------------------------------------------------- */

export const tools: TamboTool[] = [
  /* ---------------------------- NL Intent Parser --------------------------- */
  {
    name: "resolveGitHubIntent",
    description:
      "Parse a natural-language GitHub request and automatically execute the appropriate action. Supports: show repos from organization, show issues from repo, show pull requests from repo.",
    tool: async (params: { input: string; fallback_per_page?: number }) => {
      const intent = resolveGitHubIntent({
        input: params.input,
        fallback_per_page: params.fallback_per_page || 4
      });
      
      // Execute the appropriate action based on intent
      switch (intent.kind) {
        case "list_org_repos":
          return await getOrganizationRepositories(intent.params);
        case "list_issues":
          return await getRepositoryIssues({
            ...intent.params,
            state: intent.params.state || "open",
            per_page: intent.params.per_page || 4,
          });
        case "list_prs":
          return await getRepositoryPRs({
            ...intent.params,
            state: intent.params.state || "open",
            per_page: intent.params.per_page || 4,
          });
        default:
          throw new Error(`Unsupported intent kind: ${(intent as { kind: string }).kind}`);
      }
    },
    toolSchema: createTamboSchema(z.object({
      input: z.string().describe("Natural language request (e.g., 'show 4 repos from vercel', 'show 4 issues from vercel/next.js', 'show 4 pull requests from vercel/next.js')"),
      fallback_per_page: PerPageSchema.describe("Default count if none found").optional(),
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

];

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

export const components: TamboComponent[] = [
  {
    name: "RepoCard",
    description:
      "Repository card (name, desc, stars, forks, language, updated). Now handles raw GitHub repo objects directly. Selectable; AI-friendly. Includes show PRs, and show issues buttons. Can be hidden during summarization.",
    component: RepoCard,
    propsSchema: z.object({
      repo: z.union([githubRepoSchema, z.unknown()]).optional(),
      onSelect: z.function().optional(),
      isSelected: z.boolean().optional(),
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
      "PR card (title, author, status, labels, review state, merge info). Now handles raw GitHub PR objects directly.",
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
    }),
  },
  {
    name: "IssueCard",
    description:
      "Issue card (title, body, labels, assignees, state). Now handles raw GitHub issue objects directly. Auto type detection + selection.",
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
      events: z.array(z.unknown()).optional(),
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
