/**
 * Google Gemini Provider Implementation
 * Task 4: Refactor GeminiProvider to implement interface
 */

import axios from 'axios';
import { AIProvider, AIProviderConfig, ChatMessage, ChatResponse, EmbeddingResponse } from '../AIProvider.js';

const DEFAULT_CHAT_MODEL = 'gemini-3.6-flash';

/** Prefer env primary, then other flash models when capacity / availability fails. */
const CHAT_MODEL_FALLBACKS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
] as const;

function sanitizeGeminiError(raw: unknown): string {
  return String(raw || 'Unknown error')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, 'AIza***')
    .replace(/AQ\.[A-Za-z0-9_-]{10,}/g, 'AQ.***')
    .replace(/api_key:[^\s']+/gi, 'api_key:***');
}

function isRetryableGeminiError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('high demand') ||
    m.includes('try again later') ||
    m.includes('temporarily') ||
    m.includes('overloaded') ||
    m.includes('unavailable') ||
    m.includes('no longer available') ||
    m.includes('not found') ||
    m.includes('resource_exhausted') ||
    m.includes('429') ||
    m.includes('503') ||
    m.includes('500')
  );
}

export function resolveGeminiChatModels(preferred?: string): string[] {
  const primary = (preferred || process.env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL).trim();
  const ordered = [primary, ...CHAT_MODEL_FALLBACKS.filter((m) => m !== primary)];
  return [...new Set(ordered)];
}

export class GoogleGeminiProvider implements AIProvider {
  readonly provider = 'google_gemini';
  readonly providerName = 'Google Gemini';
  
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  supportsChat(): boolean {
    return true;
  }
  
  supportsEmbeddings(): boolean {
    return true;
  }
  
  supportsImageGeneration(): boolean {
    return false;
  }
  
  getDefaultChatModel(): string {
    return process.env.GEMINI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
  }
  
  getDefaultEmbeddingModel(): string {
    return 'embedding-001';
  }
  
  async chat(
    messages: ChatMessage[],
    config?: AIProviderConfig
  ): Promise<ChatResponse> {
    const models = resolveGeminiChatModels(config?.model || this.getDefaultChatModel());
    
    // Convert messages to Gemini format
    const contents = messages
      .filter(msg => msg.role !== 'system') // Gemini doesn't have system messages
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    
    // Add system instruction if present
    const systemInstruction = messages.find(msg => msg.role === 'system')?.content;
    const body = {
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxTokens ?? 2000
      }
    };

    let lastError = 'Unknown error';
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        const response = await axios.post(
          `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
          body,
          { headers: { 'Content-Type': 'application/json' } }
        );
      
        const data = response.data;
      
        return {
          content: data.candidates[0].content.parts[0].text,
          model,
          usage: {
            promptTokens: data.usageMetadata?.promptTokenCount,
            completionTokens: data.usageMetadata?.candidatesTokenCount,
            totalTokens: data.usageMetadata?.totalTokenCount
          },
          metadata: {
            finishReason: data.candidates[0].finishReason,
            ...(i > 0 ? { fallbackFrom: models[0] } : {})
          }
        };
      } catch (error: any) {
        lastError = sanitizeGeminiError(
          error.response?.data?.error?.message || error.message
        );
        const retry = isRetryableGeminiError(lastError) && i < models.length - 1;
        if (!retry) {
          throw new Error(`Google Gemini API error: ${lastError}`);
        }
        console.warn(`[Gemini] ${model} failed (${lastError.slice(0, 120)}); trying ${models[i + 1]}`);
      }
    }

    throw new Error(`Google Gemini API error: ${lastError}`);
  }
  
  async embed(
    text: string,
    config?: AIProviderConfig
  ): Promise<EmbeddingResponse> {
    const model = config?.model || this.getDefaultEmbeddingModel();
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/models/${model}:embedContent?key=${this.apiKey}`,
        {
          model: `models/${model}`,
          content: {
            parts: [{ text: text }]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = response.data;
      
      return {
        embedding: data.embedding.values,
        model: model,
        usage: {
          tokens: data.embedding.values.length // Approximate
        }
      };
    } catch (error: any) {
      const safe = sanitizeGeminiError(
        error.response?.data?.error?.message || error.message
      );
      throw new Error(`Google Gemini Embedding API error: ${safe}`);
    }
  }
  
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // Test with a simple request
      await axios.get(`${this.baseUrl}/models?key=${apiKey}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}
