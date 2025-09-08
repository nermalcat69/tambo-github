"use client";

import { FileText, GitCommit, GitPullRequest, Bug, Lightbulb, TrendingUp, BarChart3 } from "lucide-react";

interface ReleaseStats {
  total_commits: number;
  total_prs: number;
  features_count: number;
  bugfixes_count: number;
  improvements_count: number;
}

interface ReleaseNotesProps {
  releaseNotes: string;
  stats: ReleaseStats;
  version?: string;
  date?: string;
}

export function ReleaseNotes({ releaseNotes, stats, version, date }: ReleaseNotesProps) {
  const formatReleaseNotes = (notes: string) => {
    const sections = notes.split('###').filter(Boolean);
    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).filter(line => line.trim());
      
      return { title, content, index };
    });
  };

  const getSectionIcon = (title: string) => {
    if (title.includes('Features')) return <Lightbulb className="w-5 h-5 text-blue-600" />;
    if (title.includes('Bug Fixes')) return <Bug className="w-5 h-5 text-red-600" />;
    if (title.includes('Improvements')) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (title.includes('Statistics')) return <BarChart3 className="w-5 h-5 text-purple-600" />;
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const sections = formatReleaseNotes(releaseNotes);

  return (
    <div className="bg-white border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Release Notes {version && `- ${version}`}
          </h2>
        </div>
        {date && (
          <p className="text-sm text-gray-600">
            Generated on {new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <GitCommit className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-semibold text-blue-900">{stats.total_commits}</div>
          <div className="text-xs text-blue-700">Commits</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <GitPullRequest className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <div className="text-lg font-semibold text-purple-900">{stats.total_prs}</div>
          <div className="text-xs text-purple-700">Pull Requests</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <Lightbulb className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-semibold text-green-900">{stats.features_count}</div>
          <div className="text-xs text-green-700">Features</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <Bug className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <div className="text-lg font-semibold text-red-900">{stats.bugfixes_count}</div>
          <div className="text-xs text-red-700">Bug Fixes</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <TrendingUp className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
          <div className="text-lg font-semibold text-yellow-900">{stats.improvements_count}</div>
          <div className="text-xs text-yellow-700">Improvements</div>
        </div>
      </div>

      {/* Release Notes Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.index} className="space-y-3">
            <div className="flex items-center gap-2">
              {getSectionIcon(section.title)}
              <h3 className="text-lg font-medium text-gray-900">
                {section.title.replace(/[🚀🐛💫📊]/g, '').trim()}
              </h3>
            </div>
            
            <div className="pl-7 space-y-1">
              {section.content.map((line, lineIndex) => {
                if (line.trim().startsWith('-')) {
                  // Parse PR links
                  const prMatch = line.match(/\(#(\d+)\)/);
                  const prNumber = prMatch ? prMatch[1] : null;
                  const cleanLine = line.replace(/^-\s*/, '').replace(/\(#\d+\)/, '');
                  
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">
                        {cleanLine}
                        {prNumber && (
                          <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            #{prNumber}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <p key={lineIndex} className="text-sm text-gray-700 pl-4">
                      {line}
                    </p>
                  );
                }
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center">
        <p className="text-xs text-gray-500">
          Generated automatically from repository activity
        </p>
      </div>
    </div>
  );
}

export default ReleaseNotes;