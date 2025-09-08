"use client";

// Central configuration file for Tambo components and tools
// Read more about Tambo at https://tambo.co/docs

import { TamboComponent, TamboTool } from "@tambo-ai/react";

import { searchMusicSchema } from "@/lib/types";
import { searchMusic } from "@/services/music-search";
import { SongDisplay, songDisplaySchema } from "@/components/ui/SongDisplay";

// Tambo tools registered for AI use.
export const tools: TamboTool[] = [
  {
    name: "searchMusic",
    description:
      "Searches for music by song title, artist name, or any music-related query.",
    tool: searchMusic,
    toolSchema: searchMusicSchema,
  },
];

// Tambo components registered for AI use.
export const components: TamboComponent[] = [
  {
    name: "SongDisplay",
    description: "Display an array of songs without playing them. Shows title, artist, album, duration, cover art for each song. Optional title header. Size options: small/medium/large. Can hide duration or external link.",
    component: SongDisplay,
    propsSchema: songDisplaySchema,
  },
];
