"use client";

import { GitHubPR } from "@/lib/types";
import { GitPullRequest, MessageCircle, Calendar, User, CheckCircle, XCircle, Clock, Brain, AlertTriangle, TrendingUp, ExternalLink, FileText, Sparkles } from "lucide-react";

interface PRAnalysis {
  summary: string;
  complexity: 'low' | 'medium' | 'high';
  impact: 'minor' | 'moderate' | 'major';
  review_priority: 'low' | 'normal' | 'high';
}

interface PRCardProps {
  pr?: GitHubPR | unknown; // Allow raw objects for delegation
  analysis?: PRAnalysis;
  onSelect?: (pr: GitHubPR) => void;
  isSelected?: boolean;
  onSummarize?: (pr: GitHubPR) => void;
}

export function PRCard({ pr, analysis, onSelect, isSelected = false, onSummarize }: PRCardProps) {
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
    // If it doesn't look like a PR, return a fallback
    if (!(pr as any).id || !(pr as any).title || !(pr as any).number || !(pr as any).head || !(pr as any).base) {
      return (
        <div className="border rounded-md p-3 border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">Invalid pull request data</div>
          <div className="text-xs text-gray-400 mt-1">
            Keys: {Object.keys(pr as any).join(', ')}
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

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'major': return <AlertTriangle className="w-3 h-3" />;
      case 'moderate': return <TrendingUp className="w-3 h-3" />;
      default: return <CheckCircle className="w-3 h-3" />;
    }
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
      className={`
        border rounded-md p-3 cursor-pointer transition-all duration-200
        hover:border-gray-300 
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
      `}
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
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{(pr as GitHubPR).comments || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{(pr as GitHubPR).changed_files || 0} files</span>
              </div>
              <div className="text-xs">
                <span className="text-green-600">+{(pr as GitHubPR).additions || 0}</span>
                <span className="mx-1">/</span>
                <span className="text-red-600">-{(pr as GitHubPR).deletions || 0}</span>
              </div>
              {onSummarize && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSummarize(pr as GitHubPR);
                  }}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors"
                  title="Summarize PR"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>summarize</span>
                </button>
              )}
              {(pr as GitHubPR).diff_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open((pr as GitHubPR).diff_url, '_blank');
                  }}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="View diff"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>diff</span>
                </button>
              )}
            </div>
            
            {(pr as GitHubPR).labels && (pr as GitHubPR).labels.length > 0 && (
              <div className="flex gap-1">
                {(pr as GitHubPR).labels.slice(0, 2).map((label: Record<string, any>) => (
                  <span
                    key={label.name}
                    className="px-2 py-1 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-full"
                  >
                    {label.name}
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

          {analysis && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md border">
              <div className="flex items-center gap-2 mb-1.5">
                <Brain className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-900">AI Analysis</span>
              </div>
              
              <p className="text-xs text-gray-700 mb-1.5">
                {analysis.summary}
              </p>
              
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Complexity:</span>
                  <span className={`px-2 py-1 rounded-full ${getComplexityColor(analysis.complexity)}`}>
                    {analysis.complexity}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {getImpactIcon(analysis.impact)}
                  <span className="text-gray-600">Impact:</span>
                  <span className="capitalize">{analysis.impact}</span>
                </div>
                
                {analysis.review_priority === 'high' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>High Priority</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!analysis && (pr as GitHubPR).body && (
             <p className="text-xs text-gray-700 mt-1.5 line-clamp-2">
               {(pr as GitHubPR).body?.substring(0, 100)}...
             </p>
           )}
        </div>
      </div>
    </div>
  );
}