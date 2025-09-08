"use client";

import { useState } from "react";
import { GitHubRepo, GitHubIssue, GitHubPR } from "@/lib/types";
import { RepoCard } from "./RepoCard";
import { PRCard } from "./PRCard";
import { IssueCard } from "./IssueCard";
import { HealthDashboard } from "./HealthGauge";
import { Timeline } from "./Timeline";
import { Search, Star, GitFork, Eye, Settings, ExternalLink } from "lucide-react";

interface GitHubSidebarProps {
  selectedRepo?: GitHubRepo | null;
  repositories?: GitHubRepo[];
  issues?: GitHubIssue[];
  prs?: GitHubPR[];
  onRepoSelect?: (repo: GitHubRepo) => void;
  onStarRepo?: (repo: GitHubRepo) => void;
  onForkRepo?: (repo: GitHubRepo) => void;
  onWatchRepo?: (repo: GitHubRepo) => void;
}

type TabType = 'overview' | 'issues' | 'prs' | 'activity';

export function GitHubSidebar({
  selectedRepo,
  repositories = [],
  issues = [],
  prs = [],
  onRepoSelect,
  onStarRepo,
  onForkRepo,
  onWatchRepo
}: GitHubSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'issues', label: 'Issues', count: issues.length },
    { id: 'prs', label: 'PRs', count: prs.length },
    { id: 'activity', label: 'Activity', count: null }
  ] as const;

  const mockHealthMetrics = {
    total_issues: issues.length,
    open_issues: issues.filter(i => i.state === 'open').length,
    closed_issues: issues.filter(i => i.state === 'closed').length,
    total_prs: prs.length,
    open_prs: prs.filter(p => p.state === 'open').length,
    merged_prs: prs.filter(p => p.merged_at).length,
    recent_commits: 45,
    active_contributors: 12,
    activity_score: 78
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">GitHub Explorer</h2>
          <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Selected Repository Header */}
      {selectedRepo && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {selectedRepo.name}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {selectedRepo.owner.login}
              </p>
            </div>
            <a
              href={selectedRepo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => onStarRepo?.(selectedRepo)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Star className="w-3 h-3" />
              <span>Star</span>
              <span className="text-gray-500">{formatNumber(selectedRepo.stargazers_count)}</span>
            </button>
            <button
              onClick={() => onForkRepo?.(selectedRepo)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <GitFork className="w-3 h-3" />
              <span>Fork</span>
              <span className="text-gray-500">{formatNumber(selectedRepo.forks_count)}</span>
            </button>
            <button
              onClick={() => onWatchRepo?.(selectedRepo)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>Watch</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-3 py-2 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedRepo ? (
          /* Repository List */
          <div className="p-4 space-y-3">
            <h3 className="font-medium text-gray-900 mb-3">Repositories</h3>
            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onSelect={onRepoSelect}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No repositories found</p>
              </div>
            )}
          </div>
        ) : (
          /* Selected Repository Content */
          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {selectedRepo.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{selectedRepo.description}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Repository Health</h4>
                  <HealthDashboard metrics={mockHealthMetrics} />
                </div>
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-3">
                {issues.length > 0 ? (
                  issues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No issues found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prs' && (
              <div className="space-y-3">
                {prs.length > 0 ? (
                  prs.map((pr) => (
                    <PRCard key={pr.id} pr={pr} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pull requests found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <Timeline
                issues={issues.slice(0, 5)}
                prs={prs.slice(0, 5)}
                maxItems={15}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}