/**
 * Google Gemini Provider Implementation
 * Task 4: Refactor GeminiProvider to implement interface
 */

import axios from 'axios';
import { AIProvider, AIProviderConfig, ChatMessage, ChatResponse, EmbeddingResponse } from '../AIProvider.js';

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
    return 'gemini-pro';
  }
  
  getDefaultEmbeddingModel(): string {
    return 'embedding-001';
  }
  
  async chat(
    messages: ChatMessage[],
    config?: AIProviderConfig
  ): Promise<ChatResponse> {
    const model = config?.model || this.getDefaultChatModel();
    
    // Convert messages to Gemini format
    const contents = messages
      .filter(msg => msg.role !== 'system') // Gemini doesn't have system messages
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    
    // Add system instruction if present
    const systemInstruction = messages.find(msg => msg.role === 'system')?.content;
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: config?.temperature ?? 0.7,
            maxOutputTokens: config?.maxTokens ?? 2000
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
        content: data.candidates[0].content.parts[0].text,
        model: model,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
          totalTokens: data.usageMetadata?.totalTokenCount
        },
        metadata: {
          finishReason: data.candidates[0].finishReason
        }
      };
    } catch (error: any) {
      throw new Error(`Google Gemini API error: ${error.response?.data?.error?.message || error.message}`);
    }
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
      throw new Error(`Google Gemini Embedding API error: ${error.response?.data?.error?.message || error.message}`);
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

