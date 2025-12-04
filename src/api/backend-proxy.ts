/**
 * REMODELY.AI - Backend Proxy Service
 * Routes AI requests through VoiceNow-CRM backend for secure API key management
 */

import { API_CONFIG } from '../config/env';

const BASE_URL = API_CONFIG.baseUrl;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: string;
  model?: string;
}

interface ImageGenerationResponse {
  imageUrl: string;
}

interface TranscriptionResponse {
  text: string;
}

/**
 * Send a chat message through the backend proxy
 */
export async function proxyChat(
  messages: ChatMessage[],
  options?: {
    model?: 'openai' | 'anthropic' | 'grok';
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/api/remodely/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: options?.model || 'openai',
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Generate an image through the backend proxy
 */
export async function proxyImageGeneration(
  prompt: string,
  options?: {
    size?: '1024x1024' | '1536x1024' | '1024x1536';
    quality?: 'low' | 'medium' | 'high';
  }
): Promise<ImageGenerationResponse> {
  const response = await fetch(`${BASE_URL}/api/remodely/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image generation error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Transcribe audio through the backend proxy
 */
export async function proxyTranscription(
  audioUri: string
): Promise<TranscriptionResponse> {
  // Create FormData for the audio file
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);

  const response = await fetch(`${BASE_URL}/api/remodely/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transcription error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Analyze a material image through the backend proxy
 */
export async function proxyMaterialAnalysis(
  imageUri: string
): Promise<{
  material: string;
  type: string;
  color: string;
  estimatedValue: string;
  suggestions: string[];
}> {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'material.jpg',
  } as any);

  const response = await fetch(`${BASE_URL}/api/remodely/analyze-material`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Material analysis error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get price estimate for a material
 */
export async function proxyPriceEstimate(
  material: string,
  dimensions: { length: number; width: number; thickness?: number },
  condition: 'new' | 'like-new' | 'good' | 'fair'
): Promise<{
  estimatedPrice: { low: number; high: number };
  marketComparison: string;
  demandLevel: 'high' | 'medium' | 'low';
}> {
  const response = await fetch(`${BASE_URL}/api/remodely/price-estimate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      material,
      dimensions,
      condition,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Price estimate error: ${response.status} - ${error}`);
  }

  return response.json();
}

export default {
  chat: proxyChat,
  generateImage: proxyImageGeneration,
  transcribe: proxyTranscription,
  analyzeMaterial: proxyMaterialAnalysis,
  estimatePrice: proxyPriceEstimate,
};
