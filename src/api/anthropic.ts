/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Anthropic API. You may update this service, but you should not need to.

Valid model names:
claude-sonnet-4-20250514
claude-3-7-sonnet-latest
claude-3-5-haiku-latest
*/
import Anthropic from "@anthropic-ai/sdk";
import { AI_CONFIG } from "../config/env";

export const getAnthropicClient = () => {
  if (!AI_CONFIG.anthropic.isConfigured) {
    console.warn("Anthropic API key not configured - AI features may not work");
  }
  return new Anthropic({
    apiKey: AI_CONFIG.anthropic.apiKey,
  });
};
