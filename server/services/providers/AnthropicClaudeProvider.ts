/**
 * Anthropic Claude Provider Implementation
 * Task 3: Implement AnthropicProvider class
 */

import axios from 'axios';
import { AIProvider, AIProviderConfig, ChatMessage, ChatResponse, EmbeddingResponse } from '../AIProvider.js';

export class AnthropicClaudeProvider implements AIProvider {
  readonly provider = 'anthropic_claude';
  readonly providerName = 'Anthropic Claude';
  
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  supportsChat(): boolean {
    return true;
  }
  
  supportsEmbeddings(): boolean {
    return false; // Claude doesn't have native embeddings
  }
  
  supportsImageGeneration(): boolean {
    return false;
  }
  
  getDefaultChatModel(): string {
    return 'claude-3-opus-20240229';
  }
  
  getDefaultEmbeddingModel(): string {
    throw new Error('Claude does not support embeddings');
  }
  
  async chat(
    messages: ChatMessage[],
    config?: AIProviderConfig
  ): Promise<ChatResponse> {
    const model = config?.model || this.getDefaultChatModel();
    const maxTokens = config?.maxTokens ?? 2000;
    
    // Separate system message from other messages
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model,
          max_tokens: maxTokens,
          system: systemMessage?.content,
          messages: conversationMessages
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = response.data;
      
      return {
        content: data.content[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage?.input_tokens,
          completionTokens: data.usage?.output_tokens,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        metadata: {
          stopReason: data.stop_reason
        }
      };
    } catch (error: any) {
      throw new Error(`Anthropic Claude API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async embed(
    text: string,
    config?: AIProviderConfig
  ): Promise<EmbeddingResponse> {
    throw new Error('Claude does not support embeddings. Use OpenAI or Google Gemini for embeddings.');
  }
  
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // Test with a simple request
      await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );
      return true;
    } catch (error: any) {
      // 401 means invalid key, but other errors might mean valid key
      return error.response?.status !== 401;
    }
  }
}

