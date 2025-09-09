"use client";

import { useState } from "react";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";

export default function Home() {
  const mcpServers = useMcpServers();


  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <TamboMcpProvider mcpServers={mcpServers}>
        <main className="h-screen bg-gray-50">
          <div className="flex-1 p-6 h-full">
            <div className="h-full max-w-6xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  GitHub Explorer
                </h1>
                <p className="text-gray-600">
                  Analyze repositories, manage issues, and track pull requests with AI assistance.
                </p>
              </div>
              <div className="h-[calc(100vh-200px)]">
                <MessageThreadFull
                  className="h-full w-full"
                  contextKey="github-explorer"
                />
              </div>
            </div>
          </div>
        </main>
      </TamboMcpProvider>
    </TamboProvider>
  );
}
