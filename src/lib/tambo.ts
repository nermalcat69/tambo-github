import { RepoCard } from "@/components/ui/RepoCard";
import { PRCard } from "@/components/ui/PRCard";
import { IssueCard } from "@/components/ui/IssueCard";
import { HealthGauge, HealthDashboard } from "@/components/ui/HealthGauge";
import { Timeline } from "@/components/ui/Timeline";
import { ReleaseNotes } from "@/components/ui/ReleaseNotes";
import {
  getRepository,
  searchRepositories,
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
  generateReleaseNotes
} from "@/services/github-tools";

// Register GitHub tools
export const tools = [
  {
    name: "getRepository",
    description: "Fetch detailed information about a GitHub repository",
    tool: getRepository,
  },
  {
    name: "searchRepositories",
    description: "Search for GitHub repositories based on query parameters",
    tool: searchRepositories,
  },
  {
    name: "getRepositoryBranches",
    description: "Get all branches for a GitHub repository",
    tool: getRepositoryBranches,
  },
  {
    name: "getRepositoryIssues",
    description: "Fetch issues from a GitHub repository",
    tool: getRepositoryIssues,
  },
  {
    name: "getRepositoryPRs",
    description: "Fetch pull requests from a GitHub repository",
    tool: getRepositoryPRs,
  },
  {
    name: "getRepositoryCommits",
    description: "Fetch commits from a GitHub repository",
    tool: getRepositoryCommits,
  },
  {
    name: "starRepository",
    description: "Star a GitHub repository",
    tool: starRepository,
  },
  {
    name: "unstarRepository",
    description: "Unstar a GitHub repository",
    tool: unstarRepository,
  },
  {
    name: "addIssueComment",
    description: "Add a comment to a GitHub issue",
    tool: addIssueComment,
  },
  {
    name: "addIssueLabels",
    description: "Add labels to a GitHub issue",
    tool: addIssueLabels,
  },
  {
    name: "analyzeRepository",
    description: "Analyze a GitHub repository for health metrics and insights",
    tool: analyzeRepository,
  },
  {
    name: "analyzePullRequest",
    description: "Analyze a pull request for complexity and review priority",
    tool: analyzePullRequest,
  },
  {
    name: "classifyIssue",
    description: "Classify a GitHub issue by type, effort, and priority",
    tool: classifyIssue,
  },
  {
    name: "generateReleaseNotes",
    description: "Generate release notes from commits and pull requests",
    tool: generateReleaseNotes,
  },
];

// Register components
export const components = [
  {
    name: "RepoCard",
    description: "Display GitHub repository information with stats and actions",
    component: RepoCard,
  },
  {
    name: "PRCard",
    description: "Display pull request information with AI-powered summaries",
    component: PRCard,
  },
  {
    name: "IssueCard",
    description: "Display GitHub issue with AI classification and metadata",
    component: IssueCard,
  },
  {
    name: "HealthGauge",
    description: "Display repository health metrics in a gauge format",
    component: HealthGauge,
  },
  {
    name: "HealthDashboard",
    description: "Display comprehensive repository health dashboard",
    component: HealthDashboard,
  },
  {
    name: "Timeline",
    description: "Display chronological timeline of repository events",
    component: Timeline,
  },
  {
    name: "ReleaseNotes",
    description: "Display formatted release notes with sections and statistics",
    component: ReleaseNotes,
  },
];
