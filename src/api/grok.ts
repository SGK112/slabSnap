/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Grok API. You may update this service, but you should not need to.
The Grok API can be communicated with the "openai" package, so you can use the same functions as the openai package. It may not support all the same features, so please be careful.


grok-3-latest
grok-3-fast-latest
grok-3-mini-latest
*/
import OpenAI from "openai";
import { AI_CONFIG } from "../config/env";

export const getGrokClient = () => {
  if (!AI_CONFIG.grok.isConfigured) {
    console.warn("Grok API key not configured - Grok features may not work");
  }
  return new OpenAI({
    apiKey: AI_CONFIG.grok.apiKey,
    baseURL: "https://api.x.ai/v1",
  });
};
