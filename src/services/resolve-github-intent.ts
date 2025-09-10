// src/services/resolve-github-intent.ts
import { z } from "zod";

export type ResolvedIntent =
  | { kind: "search_repos"; params: { q: string; per_page?: number } }
  | { kind: "get_repo"; params: { owner: string; repo: string } }
  | { kind: "list_org_repos"; params: { org: string; per_page?: number } }
  | { kind: "list_user_repos"; params: { username: string; per_page?: number } }
  | { kind: "list_issues"; params: { owner: string; repo: string; state?: "open" | "closed" | "all"; per_page?: number } }
  | { kind: "list_prs"; params: { owner: string; repo: string; state?: "open" | "closed" | "all"; per_page?: number } }
  | { kind: "list_commits"; params: { owner: string; repo: string; sha?: string; per_page?: number } }
  | { kind: "summarize_repo"; params: { owner: string; repo: string } };

export const resolveGitHubIntentInputSchema = z.object({
  input: z.string().min(1).describe("Natural language request, e.g. 'grab me 10 repos from tambo-ai org'"),
  fallback_per_page: z.number().int().min(1).max(100).optional().default(10),
});

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Normalize state words like 'opened/close/all' → open/closed/all */
function normalizeState(s?: string): "open" | "closed" | "all" | undefined {
  if (!s) return undefined;
  const k = s.toLowerCase();
  if (["open", "opened", "active"].includes(k)) return "open";
  if (["closed", "close", "merged", "resolved"].includes(k)) return "closed";
  if (["all", "any"].includes(k)) return "all";
  return undefined;
}

/** Try to extract count/limit from phrases like "10", "top 10", "give me 25", etc. */
function extractCount(text: string): number | undefined {
  const m =
    text.match(/\b(top|first|latest|new|recent)\s+(\d{1,3})\b/i) ||
    text.match(/\b(\d{1,3})\s+(repos?|repositories|issues|prs|pull requests?)\b/i) ||
    text.match(/\b(\d{1,3})\b/);
  if (!m) return undefined;
  const n = parseInt(m[m.length - 1], 10);
  return Number.isFinite(n) ? clamp(n, 1, 100) : undefined;
}

/** Extract owner/org from phrases like 'from tambo-ai org', 'in vercel org', 'user microsoft', 'owner openai' */
function extractOwner(text: string): string | undefined {
  const orgLike = text.match(/\b(?:from|in|of)\s+([a-z0-9-_]+)\s+(?:org|organization|account)\b/i);
  if (orgLike) return orgLike[1];
  const userLike = text.match(/\b(?:user|owner|org|organization|account)\s*[:\-]?\s*([a-z0-9-_]+)\b/i);
  if (userLike) return userLike[1];
  return undefined;
}

/** Extract full repo like "owner/repo" or phrases 'repo tambo-ai/tambo' */
function extractFullName(text: string): { owner: string; repo: string } | undefined {
  const slash = text.match(/\b([a-z0-9-_]+)\/([a-z0-9-_.]+)\b/i);
  if (slash) return { owner: slash[1], repo: slash[2] };
  const repoWord = text.match(/\brepo\s+([a-z0-9-_]+)\/([a-z0-9-_.]+)\b/i);
  if (repoWord) return { owner: repoWord[1], repo: repoWord[2] };
  
  // Handle special case for "tamb repo" -> "tambo-ai/tambo"
  if (/\btamb\s+repo\b/i.test(text)) {
    return { owner: "tambo-ai", repo: "tambo" };
  }
  
  return undefined;
}

/** Extract simple filters like language/topic/base branch */
function extractFilters(text: string): { language?: string; topic?: string; shaOrBranch?: string } {
  const out: { language?: string; topic?: string; shaOrBranch?: string } = {};
  const lang = text.match(/\b(?:language|lang)\s*[:\-]?\s*([a-zA-Z#+.]+)\b/i);
  if (lang) out.language = lang[1];

  const topic = text.match(/\b(?:topic|tag)\s*[:\-]?\s*([a-z0-9-]+)\b/i);
  if (topic) out.topic = topic[1];

  const branch = text.match(/\b(?:branch|sha)\s*[:\-]?\s*([a-z0-9._\-\/]+)\b/i);
  if (branch) out.shaOrBranch = branch[1];

  return out;
}

/** If user says issues/PRs/commits with state */
function extractLane(text: string): "issues" | "prs" | "commits" | "repos" | undefined {
  const t = text.toLowerCase();
  if (/\bissues?\b/.test(t)) return "issues";
  if (/\b(prs?|pull requests?)\b/.test(t)) return "prs";
  if (/\bcommits?\b/.test(t)) return "commits";
  if (/\brepos?(?:itories)?\b/.test(t)) return "repos";
  return undefined;
}

function buildSearchQuery(owner?: string, language?: string, topic?: string, extra?: string): string {
  const parts: string[] = [];
  if (owner) parts.push(`org:${owner} user:${owner}`);
  if (language) parts.push(`language:${language}`);
  if (topic) parts.push(`topic:${topic}`);
  if (extra) parts.push(extra);
  return parts.join(" ").trim() || "stars:>0";
}

/**
 * Main resolver
 */
export function resolveGitHubIntent(input: z.infer<typeof resolveGitHubIntentInputSchema>): ResolvedIntent {
  const { input: textRaw, fallback_per_page } = resolveGitHubIntentInputSchema.parse(input);
  const text = textRaw.trim();

  // 1) Check for summarization requests first
  const isSummarization = /\b(summarize|summary|analyze|overview|describe)\b/i.test(text);
  if (isSummarization) {
    const full = extractFullName(text);
    if (full) {
      return { kind: "summarize_repo", params: full };
    }
  }

  // 2) Direct repo reference?
  const full = extractFullName(text);
  if (full) {
    // If they asked about issues/PRs/commits explicitly, route accordingly
    const lane = extractLane(text);
    const state = normalizeState(text.match(/\b(open|opened|closed|close|all|any|merged|resolved)\b/i)?.[1]);
    const perPage = extractCount(text) ?? fallback_per_page;

    if (lane === "issues") return { kind: "list_issues", params: { ...full, state, per_page: perPage } };
    if (lane === "prs") return { kind: "list_prs", params: { ...full, state, per_page: perPage } };
    if (lane === "commits") {
      const { shaOrBranch } = extractFilters(text);
      return { kind: "list_commits", params: { ...full, sha: shaOrBranch, per_page: perPage } };
    }
    return { kind: "get_repo", params: full };
  }

  // 2) Check for organization/user repository listing patterns
  const owner = extractOwner(text);
  const count = extractCount(text) ?? fallback_per_page;
  const { language, topic } = extractFilters(text);

  // Detect if this is specifically asking for org/user repos (not search)
  const isOrgRepoList = /\b(?:list|show|get|grab|fetch|all)\b.*\b(?:repos?|repositories)\b.*\b(?:from|of|in)\s+([a-z0-9-_]+)\s+(?:org|organization)\b/i.test(text);
  const isUserRepoList = /\b(?:list|show|get|grab|fetch|all)\b.*\b(?:repos?|repositories)\b.*\b(?:from|of|in|by)\s+(?:user\s+)?([a-z0-9-_]+)\b/i.test(text) && !/\borg\b/i.test(text);
  const isSimpleOrgList = /\b([a-z0-9-_]+)\s+(?:org|organization)\s+repos?\b/i.test(text);
  const isSimpleUserList = /\b([a-z0-9-_]+)\s+repos?\b/i.test(text) && !/\borg\b/i.test(text);

  if (owner && (isOrgRepoList || isSimpleOrgList)) {
    return { kind: "list_org_repos", params: { org: owner, per_page: count } };
  }

  if (owner && (isUserRepoList || isSimpleUserList)) {
    return { kind: "list_user_repos", params: { username: owner, per_page: count } };
  }

  // 3) Fall back to search for more complex queries
  const q = buildSearchQuery(owner, language, topic, text /* keep extra words as keywords */);

  return { kind: "search_repos", params: { q, per_page: count } };
}
