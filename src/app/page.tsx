"use client";

import Image from "next/image";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { ChatInputProvider } from "@/contexts/chat-input-context";
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
        <ChatInputProvider>
        <main className="bg-[#F3F8F5] h-screen flex flex-col">
          <div className="flex-1 flex flex-col pt-5 min-h-0">
            <div className="flex-1 flex flex-col w-4/5 mx-auto min-h-0">
              <a href="https://tambo.co" target="_blank" className="mx-auto pb-10" ><Image src="./Tambo-Lockup.svg" width={200} height={200} alt="tambo logo" /></a>
              <div className=" flex-shrink-0 p-4 bg-[#A1FCD1]/60 border rounded-t-xl border-b">
                <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                  GitHub Explorer
                </h1>
                <p className="text-neutral-700">
                  Analyze repositories, manage issues, and track pull requests with AI assistance.
                </p>
              </div>
              <div className="flex-1 w-full border-r border-l min-h-0">
                <MessageThreadFull
                  className="h-full w-full"
                  contextKey="github-explorer"
                />
              </div>
            </div>
          </div>
        </main>
        </ChatInputProvider>
      </TamboMcpProvider>
    </TamboProvider>
  );
}
