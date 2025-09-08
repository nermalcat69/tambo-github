"use client";

import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { GitHubSidebar } from "@/components/ui/GitHubSidebar";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { useState } from "react";
import { GitHubRepo, GitHubIssue, GitHubPR } from "@/lib/types";

export default function Home() {
  const mcpServers = useMcpServers();
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [prs, setPrs] = useState<GitHubPR[]>([]);

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    // In a real app, you would fetch issues and PRs for the selected repo
    // For now, we'll use mock data or empty arrays
  };

  const handleStarRepo = async (repo: GitHubRepo) => {
    // Implement star functionality
    // TODO: Add star repository implementation
  };

  const handleForkRepo = async (repo: GitHubRepo) => {
    // Implement fork functionality
    // TODO: Add fork repository implementation
  };

  const handleWatchRepo = async (repo: GitHubRepo) => {
    // Implement watch functionality
    // TODO: Add watch repository implementation
  };

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <TamboMcpProvider mcpServers={mcpServers}>
        <main className="flex h-screen bg-white">
          {/* Main Chat Area - 60% */}
          <div className="flex-1 flex flex-col" style={{ width: '60%' }}>
            <div className="flex-1 p-6">
              <div className="h-full max-w-4xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    GitHub Explorer
                  </h1>
                  <p className="text-gray-600">
                    Analyze repositories, manage issues, and track pull requests with AI assistance.
                  </p>
                </div>
                <MessageThreadFull
                  className="right w-full max-w-none ml-0"
                  contextKey="github-explorer"
                />
              </div>
            </div>
          </div>
          
          {/* GitHub Sidebar - 40% */}
          <div className="flex-shrink-0" style={{ width: '40%' }}>
            <GitHubSidebar
              selectedRepo={selectedRepo}
              repositories={repositories}
              issues={issues}
              prs={prs}
              onRepoSelect={handleRepoSelect}
              onStarRepo={handleStarRepo}
              onForkRepo={handleForkRepo}
              onWatchRepo={handleWatchRepo}
            />
          </div>
        </main>
      </TamboMcpProvider>
    </TamboProvider>
  );
}
