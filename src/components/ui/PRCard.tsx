"use client";

import { GitHubPR } from "@/lib/types";
import { GitPullRequest, MessageCircle, Calendar, User, CheckCircle, XCircle, Clock, Brain, AlertTriangle, TrendingUp } from "lucide-react";

interface PRAnalysis {
  summary: string;
  complexity: 'low' | 'medium' | 'high';
  impact: 'minor' | 'moderate' | 'major';
  review_priority: 'low' | 'normal' | 'high';
}

interface PRCardProps {
  pr?: GitHubPR;
  analysis?: PRAnalysis;
  onSelect?: (pr: GitHubPR) => void;
  isSelected?: boolean;
}

export function PRCard({ pr, analysis, onSelect, isSelected = false }: PRCardProps) {
  // Handle undefined pr prop
  if (!pr) {
    return (
      <div className="border rounded-md p-3 border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">Pull request data not available</div>
      </div>
    );
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
    switch (pr.state) {
      case 'open':
        return <GitPullRequest className="w-4 h-4 text-green-600" />;
      case 'closed':
        return pr.merged_at ? 
          <CheckCircle className="w-4 h-4 text-purple-600" /> : 
          <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (pr.state) {
      case 'open':
        return 'text-green-600';
      case 'closed':
        return pr.merged_at ? 'text-purple-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    if (pr.state === 'closed' && pr.merged_at) return 'Merged';
    return pr.state.charAt(0).toUpperCase() + pr.state.slice(1);
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

  return (
    <div 
      className={`
        border rounded-md p-3 cursor-pointer transition-all duration-200
        hover:border-gray-300 hover:shadow-sm
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
      `}
      onClick={() => onSelect?.(pr)}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 pr-2">
              {pr.title}
            </h3>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              #{pr.number}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5">
            <span className={getStatusColor()}>
              {getStatusText()}
            </span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{pr.user?.login || 'Unknown user'}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(pr.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{pr.comments || 0}</span>
              </div>
              <div className="text-xs">
                <span className="text-green-600">+{pr.additions || 0}</span>
                <span className="mx-1">/</span>
                <span className="text-red-600">-{pr.deletions || 0}</span>
              </div>
            </div>
            
            {pr.labels && pr.labels.length > 0 && (
              <div className="flex gap-1">
                {pr.labels.slice(0, 2).map((label) => (
                  <span
                    key={label.name}
                    className="px-2 py-1 text-xs rounded-full"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      border: `1px solid #${label.color}40`
                    }}
                  >
                    {label.name}
                  </span>
                ))}
                {pr.labels.length > 2 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{pr.labels.length - 2}
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
          
          {!analysis && pr.body && (
            <p className="text-xs text-gray-700 mt-1.5 line-clamp-2">
              {pr.body.substring(0, 100)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}