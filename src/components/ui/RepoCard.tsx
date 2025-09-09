"use client";

import { GitHubRepo } from "@/lib/types";
import { Star, GitFork, Eye, Calendar, ExternalLink } from "lucide-react";

interface RepoCardProps {
  repo?: GitHubRepo;
  onSelect?: (repo: GitHubRepo) => void;
  isSelected?: boolean;
}

export function RepoCard({ repo, onSelect, isSelected = false }: RepoCardProps) {
  // Handle undefined repo prop
  if (!repo) {
    return (
      <div className="border rounded-lg p-4 border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">Repository data not available</div>
      </div>
    );
  }

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
        hover:border-gray-300 hover:shadow-sm
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
      `}
      onClick={() => onSelect?.(repo)}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate">
            {repo.name}
          </h3>
          <p className="text-xs text-gray-600 truncate">
            {repo.owner?.login || 'Unknown owner'}
          </p>
        </div>
        {repo.html_url && (
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {repo.description && (
        <p className="text-xs text-gray-700 mb-2 line-clamp-2">
          {repo.description}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          <span>{formatNumber(repo.stargazers_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          <span>{formatNumber(repo.forks_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{formatNumber(repo.watchers_count)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          {repo.language && (
            <>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>{repo.language}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(repo.updated_at)}</span>
        </div>
      </div>

      {repo.topics && repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {repo.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {topic}
            </span>
          ))}
          {repo.topics.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{repo.topics.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}