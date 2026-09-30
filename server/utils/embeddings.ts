/**
 * Shared embedding + cosine helpers for MySQL (JSON-stored vectors).
 */

import { AIProviderFactory } from '../services/AIProviderFactory.js';
import {
  getUserDefaultProvider,
  getApiKeyWithFallback,
  getPlatformGeminiKey,
} from '../routes/aiProviderKeys.js';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function parseEmbedding(raw: unknown): number[] | null {
  if (!raw) return null;
  try {
    if (Array.isArray(raw)) return raw.map(Number);
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function simpleHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

/**
 * Generate an embedding via the user's preferred provider, falling back to platform Gemini.
 */
export async function generateEmbedding(
  text: string,
  userId?: string
): Promise<{ embedding: number[]; provider: string; model: string } | null> {
  const clipped = text.replace(/\s+/g, ' ').trim().slice(0, 8000);
  if (!clipped) return null;

  try {
    let provider = 'google_gemini';
    let apiKey: string | null = null;

    if (userId) {
      try {
        provider = (await getUserDefaultProvider(userId, 'embedding')) || 'google_gemini';
        apiKey = await getApiKeyWithFallback(userId, provider, true);
      } catch {
        apiKey = getPlatformGeminiKey();
        provider = 'google_gemini';
      }
    } else {
      apiKey = getPlatformGeminiKey();
    }

    if (!apiKey) return null;

    const ai = AIProviderFactory.createProvider(provider, apiKey);
    if (!ai.supportsEmbeddings()) {
      // Fall back to Gemini platform key if current provider cannot embed
      const geminiKey = getPlatformGeminiKey();
      if (!geminiKey || provider === 'google_gemini') return null;
      const gemini = AIProviderFactory.createProvider('google_gemini', geminiKey);
      if (!gemini.supportsEmbeddings()) return null;
      const res = await gemini.embed(clipped);
      return {
        embedding: res.embedding,
        provider: 'google_gemini',
        model: gemini.getDefaultEmbeddingModel?.() || 'embedding-001',
      };
    }

    const res = await ai.embed(clipped);
    return {
      embedding: res.embedding,
      provider,
      model: ai.getDefaultEmbeddingModel?.() || 'embedding-001',
    };
  } catch (error) {
    console.error('generateEmbedding failed:', error);
    return null;
  }
}
