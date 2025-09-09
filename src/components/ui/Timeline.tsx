"use client";

import { GitHubCommit, GitHubIssue, GitHubPR } from "@/lib/types";
import { GitCommit, AlertCircle, GitPullRequest, Calendar, User } from "lucide-react";

type TimelineItem = {
  id: string;
  type: 'commit' | 'issue' | 'pr';
  title: string;
  author: string;
  date: string;
  url?: string;
  data: GitHubCommit | GitHubIssue | GitHubPR;
};

interface TimelineProps {
  commits?: GitHubCommit[];
  issues?: GitHubIssue[];
  prs?: GitHubPR[];
  maxItems?: number;
}

export function Timeline({ commits = [], issues = [], prs = [], maxItems = 20 }: TimelineProps) {
  const createTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add commits
    commits.forEach(commit => {
      items.push({
        id: commit.sha,
        type: 'commit',
        title: commit.commit.message.split('\n')[0],
        author: commit.commit.author?.name || 'Unknown author',
        date: commit.commit.author?.date || commit.commit.committer?.date || new Date().toISOString(),
        url: commit.html_url,
        data: commit
      });
    });

    // Add issues
    issues.forEach(issue => {
      items.push({
        id: `issue-${issue.id}`,
        type: 'issue',
        title: issue.title,
        author: issue.user?.login || 'Unknown user',
        date: issue.created_at,
        url: issue.html_url,
        data: issue
      });
    });

    // Add PRs
    prs.forEach(pr => {
      items.push({
        id: `pr-${pr.id}`,
        type: 'pr',
        title: pr.title,
        author: pr.user?.login || 'Unknown user',
        date: pr.created_at,
        url: pr.html_url,
        data: pr
      });
    });

    // Sort by date (newest first) and limit
    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxItems);
  };

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="w-4 h-4 text-blue-600" />;
      case 'issue':
        return <AlertCircle className="w-4 h-4 text-green-600" />;
      case 'pr':
        return <GitPullRequest className="w-4 h-4 text-purple-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'commit':
        return 'bg-blue-100';
      case 'issue':
        return 'bg-green-100';
      case 'pr':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'commit':
        return 'Commit';
      case 'issue':
        return 'Issue';
      case 'pr':
        return 'Pull Request';
      default:
        return 'Activity';
    }
  };

  const timelineItems = createTimelineItems();

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {timelineItems.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`p-2 rounded-full ${getBgColor(item.type)}`}>
                {getIcon(item.type)}
              </div>
              {index < timelineItems.length - 1 && (
                <div className="w-px h-6 bg-gray-200 mt-2" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">
                    {item.title}
                  </h4>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <User className="w-3 h-3" />
                    <span>{item.author}</span>
                  </div>
                </div>
                
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap ml-2"
                  >
                    View →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {timelineItems.length === maxItems && (
        <div className="text-center pt-4">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Load more activity
          </button>
        </div>
      )}
    </div>
  );
}