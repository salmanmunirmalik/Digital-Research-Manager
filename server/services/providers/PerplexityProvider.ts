/**
 * Perplexity AI Provider Implementation
 * Additional provider for research and search tasks
 */

import axios from 'axios';
import { AIProvider, AIProviderConfig, ChatMessage, ChatResponse, EmbeddingResponse } from '../AIProvider.js';

export class PerplexityProvider implements AIProvider {
  readonly provider = 'perplexity';
  readonly providerName = 'Perplexity AI';
  
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  supportsChat(): boolean {
    return true;
  }
  
  supportsEmbeddings(): boolean {
    return false;
  }
  
  supportsImageGeneration(): boolean {
    return false;
  }
  
  getDefaultChatModel(): string {
    return 'llama-3.1-sonar-large-128k-online';
  }
  
  getDefaultEmbeddingModel(): string {
    throw new Error('Perplexity does not support embeddings');
  }
  
  async chat(
    messages: ChatMessage[],
    config?: AIProviderConfig
  ): Promise<ChatResponse> {
    const model = config?.model || this.getDefaultChatModel();
    const temperature = config?.temperature ?? 0.7;
    const maxTokens = config?.maxTokens ?? 2000;
    
    // Convert messages to Perplexity format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages: formattedMessages,
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
          citations: data.citations || []
        }
      };
    } catch (error: any) {
      throw new Error(`Perplexity API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async embed(
    text: string,
    config?: AIProviderConfig
  ): Promise<EmbeddingResponse> {
    throw new Error('Perplexity does not support embeddings. Use OpenAI or Google Gemini for embeddings.');
  }
  
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // Test with a simple request
      await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return true;
    } catch (error: any) {
      return error.response?.status !== 401;
    }
  }
}

