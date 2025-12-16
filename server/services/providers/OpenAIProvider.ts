/**
 * OpenAI Provider Implementation
 * Task 2: Implement OpenAIProvider class
 */

import axios from 'axios';
import { AIProvider, AIProviderConfig, ChatMessage, ChatResponse, EmbeddingResponse } from '../AIProvider.js';

export class OpenAIProvider implements AIProvider {
  readonly provider = 'openai';
  readonly providerName = 'OpenAI';
  
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';
  
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
    return true;
  }
  
  getDefaultChatModel(): string {
    return 'gpt-4';
  }
  
  getDefaultEmbeddingModel(): string {
    return 'text-embedding-3-small';
  }
  
  async chat(
    messages: ChatMessage[],
    config?: AIProviderConfig
  ): Promise<ChatResponse> {
    const model = config?.model || this.getDefaultChatModel();
    const temperature = config?.temperature ?? 0.7;
    const maxTokens = config?.maxTokens ?? 2000;
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = response.data;
      
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        },
        metadata: {
          finishReason: data.choices[0].finish_reason
        }
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async embed(
    text: string,
    config?: AIProviderConfig
  ): Promise<EmbeddingResponse> {
    const model = config?.model || this.getDefaultEmbeddingModel();
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/embeddings`,
        {
          model,
          input: text
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = response.data;
      
      return {
        embedding: data.data[0].embedding,
        model: data.model,
        usage: {
          tokens: data.usage?.total_tokens
        }
      };
    } catch (error: any) {
      throw new Error(`OpenAI Embedding API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async generateImage(
    prompt: string,
    config?: AIProviderConfig
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/images/generations`,
        {
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: config?.size || '1024x1024',
          quality: config?.quality || 'standard'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data[0].url;
    } catch (error: any) {
      throw new Error(`OpenAI Image Generation API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // Test with a simple request
      await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

