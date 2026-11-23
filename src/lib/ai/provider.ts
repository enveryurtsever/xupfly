import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AIProvider = "gemini" | "claude" | "openai";

/**
 * Returns the configured AI model based on the AI_PROVIDER env var.
 * Defaults to Gemini 2.5 Flash.
 * Swap provider at runtime by changing AI_PROVIDER in .env.local — zero code changes needed.
 */
export function getAIModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? "gemini") as AIProvider;

  switch (provider) {
    case "claude":
      return anthropic("claude-3-5-sonnet-20241022") as unknown as LanguageModel;
    case "openai":
      return openai("gpt-4o") as unknown as LanguageModel;
    case "gemini":
    default:
      return google("gemini-2.5-flash-lite") as unknown as LanguageModel;
  }
}
