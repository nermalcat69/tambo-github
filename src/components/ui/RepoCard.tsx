"use client";

import { GitHubRepo } from "@/lib/types";
import { Star, GitFork, Eye, Calendar, ExternalLink, FileText } from "lucide-react";

interface RepoCardProps {
  repo?: GitHubRepo | unknown; // Allow raw objects for delegation
  onSelect?: (repo: GitHubRepo) => void;
  isSelected?: boolean;
  onSummarize?: (repo: GitHubRepo) => void;
}

export function RepoCard({ repo, onSelect, isSelected = false, onSummarize }: RepoCardProps) {
  // Handle undefined repo prop
  if (!repo) {
    return (
      <div className="border rounded-lg p-4 border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">Repository data not available</div>
      </div>
    );
  }

  // Handle raw objects - detect if this is a repository object
  if (typeof repo === 'object' && repo !== null) {
    const repoObj = repo as Record<string, any>;
    // If it doesn't look like a repository, return a fallback
    if (!repoObj.id || !repoObj.name || !repoObj.owner) {
      return (
        <div className="border rounded-lg p-4 border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">Invalid repository data</div>
          <div className="text-xs text-gray-400 mt-1">
            Keys: {Object.keys(repo).join(', ')}
          </div>
        </div>
      );
    }
  }

  // Type assertion for the repo object
  const repoData = repo as GitHubRepo;

  const formatNumber = (num: number | undefined) => {
    if (num == null || num === undefined) {
      return '0';
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={`
        border rounded-md p-3 cursor-pointer transition-all duration-200
        hover:border-gray-300 
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
      `}
      onClick={() => onSelect?.(repoData)}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate">
            {repoData.name}
          </h3>
          <p className="text-xs text-gray-600 truncate">
            {repoData.owner?.login || 'Unknown owner'}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {onSummarize && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSummarize(repoData);
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Summarize repository"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}
          {repoData.html_url && (
            <a
              href={repoData.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {repoData.description && (
        <p className="text-xs text-gray-700 mb-2 line-clamp-2">
          {repoData.description}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          <span>{formatNumber(repoData.stargazers_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          <span>{formatNumber(repoData.forks_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{formatNumber(repoData.watchers_count)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          {repoData.language && (
            <>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>{repoData.language}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(repoData.updated_at)}</span>
        </div>
      </div>

      {repoData.topics && repoData.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {repoData.topics.slice(0, 3).map((topic: string) => (
            <span
              key={topic}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {topic}
            </span>
          ))}
          {repoData.topics.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{repoData.topics.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}