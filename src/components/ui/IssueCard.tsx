"use client";

import { GitHubIssue } from "@/lib/types";
import { AlertCircle, MessageCircle, Calendar, User, CheckCircle, XCircle, Bug, FileText, Lightbulb, Brain, Clock } from "lucide-react";

interface IssueClassification {
  type: 'bug' | 'feature' | 'docs';
  priority: 'normal' | 'high';
  estimated_effort: 'small' | 'medium' | 'large';
}

interface IssueCardProps {
  issue?: GitHubIssue;
  classification?: IssueClassification;
  onSelect?: (issue: GitHubIssue) => void;
  isSelected?: boolean;
}

export function IssueCard({ issue, classification, onSelect, isSelected = false }: IssueCardProps) {
  // Handle undefined issue prop
  if (!issue) {
    return (
      <div className="border rounded-md p-3 border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">Issue data not available</div>
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
    return issue.state === 'open' ? 
      <AlertCircle className="w-4 h-4 text-green-600" /> : 
      <CheckCircle className="w-4 h-4 text-purple-600" />;
  };

  const getStatusColor = () => {
    return issue.state === 'open' ? 'text-green-600' : 'text-purple-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-3 h-3 text-red-600" />;
      case 'feature': return <Lightbulb className="w-3 h-3 text-blue-600" />;
      case 'docs': return <FileText className="w-3 h-3 text-green-600" />;
      default: return <AlertCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'text-red-600 bg-red-50';
      case 'feature': return 'text-blue-600 bg-blue-50';
      case 'docs': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'large': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'small': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div 
      className={`
        border rounded-md p-3 cursor-pointer transition-all duration-200
        hover:border-gray-300 hover:shadow-sm
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
      `}
      onClick={() => onSelect?.(issue)}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 pr-2">
              {issue.title}
            </h3>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              #{issue.number}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5">
            <span className={getStatusColor()}>
              {issue.state.charAt(0).toUpperCase() + issue.state.slice(1)}
            </span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{issue.user?.login || 'Unknown user'}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(issue.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{issue.comments || 0}</span>
              </div>
              {issue.assignees && issue.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{issue.assignees.length} assigned</span>
                </div>
              )}
            </div>
            
            {issue.labels && issue.labels.length > 0 && (
              <div className="flex gap-1">
                {issue.labels.slice(0, 2).map((label) => (
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
                {issue.labels.length > 2 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{issue.labels.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {classification && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md border">
              <div className="flex items-center gap-2 mb-1.5">
                <Brain className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-900">AI Classification</span>
              </div>
              
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  {getTypeIcon(classification.type)}
                  <span className="text-gray-600">Type:</span>
                  <span className={`px-2 py-1 rounded-full ${getTypeColor(classification.type)}`}>
                    {classification.type}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-gray-600">Effort:</span>
                  <span className={`px-2 py-1 rounded-full ${getEffortColor(classification.estimated_effort)}`}>
                    {classification.estimated_effort}
                  </span>
                </div>
                
                {classification.priority === 'high' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>High Priority</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!classification && issue.body && (
            <p className="text-xs text-gray-700 mt-1.5 line-clamp-2">
              {issue.body.substring(0, 100)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}