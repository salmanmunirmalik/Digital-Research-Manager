/**
 * AI Provider Factory
 * Task 5: Create AIProviderFactory for dynamic selection
 * 
 * Creates and manages AI provider instances based on provider type
 */

import { AIProvider, AIProviderConfig } from './AIProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { GoogleGeminiProvider } from './providers/GoogleGeminiProvider.js';
import { AnthropicClaudeProvider } from './providers/AnthropicClaudeProvider.js';
import { PerplexityProvider } from './providers/PerplexityProvider.js';
import { ProviderCapabilityRegistry } from './AIProvider.js';

export class AIProviderFactory {
  /**
   * Create an AI provider instance
   * @param provider Provider identifier (e.g., 'openai', 'google_gemini')
   * @param apiKey API key for the provider
   * @returns AIProvider instance
   */
  static createProvider(provider: string, apiKey: string): AIProvider {
    switch (provider.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(apiKey);
      
      case 'google_gemini':
      case 'gemini':
        return new GoogleGeminiProvider(apiKey);
      
      case 'anthropic_claude':
      case 'claude':
        return new AnthropicClaudeProvider(apiKey);
      
      case 'perplexity':
        return new PerplexityProvider(apiKey);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  /**
   * Get best provider for a task type
   * Uses ProviderCapabilityRegistry to find optimal provider
   * @param taskType Task type (e.g., 'paper_finding', 'content_writing')
   * @param availableProviders List of available provider identifiers
   * @returns Best provider identifier or null
   */
  static getBestProviderForTask(
    taskType: string,
    availableProviders: string[] = []
  ): string | null {
    // If no providers specified, use registry recommendation
    if (availableProviders.length === 0) {
      return ProviderCapabilityRegistry.getBestProviderForTask(taskType);
    }
    
    // Find best provider from available ones
    let bestProvider: string | null = null;
    let bestScore = 0;
    
    for (const provider of availableProviders) {
      const capabilities = ProviderCapabilityRegistry.getCapabilities(provider);
      if (capabilities && capabilities.bestFor.includes(taskType)) {
        // Score based on quality and cost
        const score = (capabilities.quality === 'high' ? 3 : capabilities.quality === 'medium' ? 2 : 1) +
                      (capabilities.cost === 'low' ? 2 : capabilities.cost === 'medium' ? 1 : 0);
        
        if (score > bestScore) {
          bestScore = score;
          bestProvider = provider;
        }
      }
    }
    
    // If no perfect match, return first available or registry recommendation
    return bestProvider || availableProviders[0] || ProviderCapabilityRegistry.getBestProviderForTask(taskType);
  }
  
  /**
   * Validate provider API key
   * @param provider Provider identifier
   * @param apiKey API key to validate
   * @returns True if valid
   */
  static async validateProviderApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      const providerInstance = this.createProvider(provider, apiKey);
      return await providerInstance.validateApiKey(apiKey);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get all supported providers
   * @returns Array of provider identifiers
   */
  static getSupportedProviders(): string[] {
    return [
      'openai',
      'google_gemini',
      'anthropic_claude',
      'perplexity'
    ];
  }
  
  /**
   * Check if provider supports a feature
   * @param provider Provider identifier
   * @param feature Feature to check ('chat', 'embeddings', 'image')
   * @returns True if supported
   */
  static providerSupports(provider: string, feature: 'chat' | 'embeddings' | 'image'): boolean {
    try {
      const providerInstance = this.createProvider(provider, 'dummy-key');
      
      switch (feature) {
        case 'chat':
          return providerInstance.supportsChat();
        case 'embeddings':
          return providerInstance.supportsEmbeddings();
        case 'image':
          return providerInstance.supportsImageGeneration() || false;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}

