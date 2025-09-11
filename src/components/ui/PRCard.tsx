"use client";

import { GitHubPR } from "../../lib/types";
import { useChatInput } from "../../contexts/chat-input-context";
import { GitPullRequest, Calendar, User, CheckCircle, XCircle, Clock } from "lucide-react";

interface PRCardProps {
  pr?: GitHubPR | unknown; // Allow raw objects for delegation
  onSelect?: (pr: GitHubPR) => void;
  isSelected?: boolean;
}

export function PRCard({ pr, onSelect }: PRCardProps) {
  const { } = useChatInput();
  // Handle undefined pr prop
  if (!pr) {
    return (
      <div className="border rounded-md p-3 border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">Pull request data not available</div>
      </div>
    );
  }

  // Handle raw objects - detect if this is a PR object
  if (typeof pr === 'object' && pr !== null) {
    const prObj = pr as Record<string, unknown>;
    // If it doesn't look like a PR, return a fallback
    if (!prObj.id || !prObj.title || !prObj.number || !prObj.head || !prObj.base) {
      return (
        <div className="border rounded-md p-3 border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">Invalid pull request data</div>
          <div className="text-xs text-gray-400 mt-1">
            Keys: {Object.keys(prObj).join(', ')}
          </div>
        </div>
      );
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = () => {
    switch ((pr as GitHubPR).state) {
      case 'open':
        return <GitPullRequest className="w-4 h-4 text-green-600" />;
      case 'closed':
        return (pr as GitHubPR).merged_at ? 
          <CheckCircle className="w-4 h-4 text-purple-600" /> : 
          <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch ((pr as GitHubPR).state) {
      case 'open':
        return 'text-green-600';
      case 'closed':
        return (pr as GitHubPR).merged_at ? 'text-purple-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    if ((pr as GitHubPR).state === 'closed' && (pr as GitHubPR).merged_at) return 'Merged';
    return (pr as GitHubPR).state.charAt(0).toUpperCase() + (pr as GitHubPR).state.slice(1);
  };


  const handleClick = () => {
    // Open PR in new tab
    if ((pr as GitHubPR).html_url) {
      window.open((pr as GitHubPR).html_url, '_blank');
    }
    // Also call onSelect if provided
    onSelect?.(pr as GitHubPR);
  };

  return (
    <div 
      className="
        border rounded-md p-3 cursor-pointer transition-all duration-200
        hover:border-gray-300 border-gray-200 bg-white
      "
      onClick={handleClick}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 pr-2">
              {(pr as GitHubPR).title}
            </h3>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              #{(pr as GitHubPR).number}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5">
            <span className={getStatusColor()}>
              {getStatusText()}
            </span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{(pr as GitHubPR).user?.login || 'Unknown user'}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate((pr as GitHubPR).created_at)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            
            {(pr as GitHubPR).labels && (pr as GitHubPR).labels.length > 0 && (
              <div className="flex gap-1">
                {(pr as GitHubPR).labels.slice(0, 2).map((label: Record<string, unknown>, index: number) => (
                  <span
                    key={`${label.name as string}-${index}`}
                    className="px-2 py-1 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-full"
                  >
                    {label.name as string}
                  </span>
                ))}
                {(pr as GitHubPR).labels.length > 2 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{(pr as GitHubPR).labels.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          
          {(pr as GitHubPR).body && (
             <p className="text-xs text-gray-700 mt-1.5 line-clamp-2">
               {(pr as GitHubPR).body?.substring(0, 100)}...
             </p>
           )}
        </div>
      </div>
    </div>
  );
}