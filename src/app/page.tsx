"use client";

import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { SimpleMusicPlayer } from "@/components/ui/SimpleMusicPlayer";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";

export default function Home() {
  const mcpServers = useMcpServers();

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <TamboProvider
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
        components={components}
        tools={tools}
        tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      >
        <TamboMcpProvider mcpServers={mcpServers}>
          {/* Header bar */}
          <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📻</span>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                MusicGPT
              </h1>
            </div>
            <a 
              href="https://github.com/michaelmagan/chat-with-music/tree/main" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              View Source
            </a>
          </div>
          
          <div className="flex-1 w-full flex overflow-hidden">
            <div className="w-[520px] min-w-[380px] max-w-lg h-full border-r flex flex-col">
              <div className="flex-1 min-h-0">
                <SimpleMusicPlayer 
                  tracks={[
                    {
                      title: "SoundHelix Song 1",
                      artist: "SoundHelix",
                      album: "Demo Album",
                      duration: 30,
                      preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                      link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                      albumCover: "https://picsum.photos/seed/1/256",
                    },
                    {
                      title: "SoundHelix Song 2",
                      artist: "SoundHelix",
                      album: "Demo Album", 
                      duration: 30,
                      preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                      link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                      albumCover: "https://picsum.photos/seed/2/256",
                    },
                    {
                      title: "SoundHelix Song 3",
                      artist: "SoundHelix", 
                      album: "Demo Album",
                      duration: 30,
                      preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                      link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                      albumCover: "https://picsum.photos/seed/3/256",
                    },
                  ]}
                  currentIndex={0}
                  isPlaying={false}
                />
              </div>
              
              {/* Bottom CTA centered in panel */}
              <div className="flex-shrink-0 p-4 flex justify-center border-t border-border">
                <p className="text-sm text-muted-foreground">
                  built with ♥️ & <a href="https://tambo.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors duration-200">tambo-ai</a>
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-0 h-full">
              <div className="h-full flex flex-col">
                <MessageThreadFull
                  className="right w-full max-w-none ml-0"
                  contextKey="tambo-template"
                />
              </div>
            </div>
          </div>
        </TamboMcpProvider>
      </TamboProvider>
    </div>
  );
}
