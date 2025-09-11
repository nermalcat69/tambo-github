import { z } from "zod";
import { githubAPI } from "./github-api";
import {
  issuesInputSchema,
  prsInputSchema,
} from "../lib/types";

// Organization Repository Tools
export const getOrganizationRepositories = async (input: { org: string; per_page?: number }) => {
  try {
    return await githubAPI.getOrganizationRepositories(input.org, input.per_page);
  } catch (error) {
    throw new Error(`Failed to fetch organization repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// Pull Requests Tools
export const getRepositoryPRs = async (input: z.infer<typeof prsInputSchema>) => {
  try {
    return await githubAPI.getRepositoryPRs(input);
  } catch (error) {
    throw new Error(`Failed to fetch pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

