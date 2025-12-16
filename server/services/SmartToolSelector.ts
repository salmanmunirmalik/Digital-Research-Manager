/**
 * Smart Tool Selection Engine
 * Task 58: Analyzes tasks and selects best AI provider/model
 * 
 * Uses ProviderCapabilityRegistry and cost/quality optimization
 * to intelligently select the best AI provider for each task.
 */

import { ProviderCapabilityRegistry, ProviderCapabilities } from './AIProvider.js';
import { AIProviderFactory } from './AIProviderFactory.js';
import pool from '../../database/config.js';

export interface TaskRequirements {
  taskType: string;
  complexity: 'simple' | 'moderate' | 'complex';
  requiresContext: boolean;
  contextLength?: number;
  qualityRequirement: 'high' | 'medium' | 'low';
  speedRequirement: 'fast' | 'medium' | 'slow';
  costSensitivity: 'low' | 'medium' | 'high';
  requiresEmbeddings?: boolean;
  requiresImageGeneration?: boolean;
}

export interface ProviderRecommendation {
  provider: string;
  providerName: string;
  score: number;
  reasons: string[];
  estimatedCost?: number;
  estimatedSpeed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
}

export class SmartToolSelector {
  /**
   * Select best provider for a task
   * @param requirements Task requirements
   * @param availableProviders List of available provider identifiers
   * @param userId Optional user ID for personalized selection
   * @returns Best provider recommendation
   */
  static async selectBestProvider(
    requirements: TaskRequirements,
    availableProviders: string[] = [],
    userId?: string
  ): Promise<ProviderRecommendation | null> {
    try {
      // Load capabilities from database (more up-to-date than static registry)
      const dbCapabilities = await this.loadCapabilitiesFromDatabase();
      
      // Merge with static registry
      const allCapabilities = this.mergeCapabilities(dbCapabilities);
      
      // Filter to available providers
      const candidates = availableProviders.length > 0
        ? availableProviders.filter(p => allCapabilities.has(p))
        : Array.from(allCapabilities.keys());
      
      if (candidates.length === 0) {
        return null;
      }
      
      // Score each provider
      const recommendations: ProviderRecommendation[] = [];
      
      for (const provider of candidates) {
        const capabilities = allCapabilities.get(provider)!;
        const score = this.calculateProviderScore(capabilities, requirements);
        
        if (score > 0) {
          recommendations.push({
            provider,
            providerName: capabilities.providerName,
            score,
            reasons: this.generateReasons(capabilities, requirements),
            estimatedCost: this.estimateCost(capabilities, requirements),
            estimatedSpeed: capabilities.speed,
            quality: capabilities.quality
          });
        }
      }
      
      // Sort by score (highest first)
      recommendations.sort((a, b) => b.score - a.score);
      
      return recommendations.length > 0 ? recommendations[0] : null;
    } catch (error) {
      console.error('Error in SmartToolSelector:', error);
      // Fallback to registry recommendation
      const fallbackProvider = ProviderCapabilityRegistry.getBestProviderForTask(requirements.taskType);
      if (fallbackProvider) {
        const capabilities = ProviderCapabilityRegistry.getCapabilities(fallbackProvider);
        if (capabilities) {
          return {
            provider: fallbackProvider,
            providerName: capabilities.providerName,
            score: 50, // Default score
            reasons: ['Fallback to registry recommendation'],
            estimatedSpeed: capabilities.speed,
            quality: capabilities.quality
          };
        }
      }
      return null;
    }
  }
  
  /**
   * Calculate provider score based on requirements
   */
  private static calculateProviderScore(
    capabilities: ProviderCapabilities,
    requirements: TaskRequirements
  ): number {
    let score = 0;
    
    // Base score: Is this provider good for this task type?
    if (capabilities.bestFor.includes(requirements.taskType)) {
      score += 30;
    }
    
    // Quality match
    const qualityMatch = this.matchQuality(capabilities.quality, requirements.qualityRequirement);
    score += qualityMatch * 20;
    
    // Speed match
    const speedMatch = this.matchSpeed(capabilities.speed, requirements.speedRequirement);
    score += speedMatch * 15;
    
    // Cost sensitivity (lower cost is better for cost-sensitive tasks)
    if (requirements.costSensitivity === 'high') {
      if (capabilities.cost === 'low') score += 20;
      else if (capabilities.cost === 'medium') score += 10;
      else score -= 10;
    } else if (requirements.costSensitivity === 'medium') {
      if (capabilities.cost === 'low') score += 10;
      else if (capabilities.cost === 'medium') score += 5;
    }
    
    // Context length match
    if (requirements.contextLength && capabilities.contextLength) {
      if (capabilities.contextLength >= requirements.contextLength) {
        score += 15;
      } else {
        // Penalize if context is too short
        const ratio = capabilities.contextLength / requirements.contextLength;
        score += Math.max(0, ratio * 10);
      }
    }
    
    // Feature requirements
    if (requirements.requiresEmbeddings && capabilities.supportsEmbeddings) {
      score += 10;
    } else if (requirements.requiresEmbeddings && !capabilities.supportsEmbeddings) {
      score -= 20; // Can't fulfill requirement
    }
    
    if (requirements.requiresImageGeneration && capabilities.supportsImageGeneration) {
      score += 10;
    } else if (requirements.requiresImageGeneration && !capabilities.supportsImageGeneration) {
      score -= 20;
    }
    
    // Strength alignment
    const strengthBonus = this.calculateStrengthBonus(capabilities.strengths, requirements.taskType);
    score += strengthBonus;
    
    return Math.max(0, score); // Ensure non-negative
  }
  
  /**
   * Match quality levels
   */
  private static matchQuality(
    providerQuality: 'high' | 'medium' | 'low',
    requiredQuality: 'high' | 'medium' | 'low'
  ): number {
    const qualityMap = { high: 3, medium: 2, low: 1 };
    const provider = qualityMap[providerQuality];
    const required = qualityMap[requiredQuality];
    
    if (provider >= required) return 1.0; // Meets or exceeds
    if (provider === required - 1) return 0.5; // Close but not quite
    return 0.1; // Too low
  }
  
  /**
   * Match speed requirements
   */
  private static matchSpeed(
    providerSpeed: 'fast' | 'medium' | 'slow',
    requiredSpeed: 'fast' | 'medium' | 'slow'
  ): number {
    const speedMap = { fast: 3, medium: 2, slow: 1 };
    const provider = speedMap[providerSpeed];
    const required = speedMap[requiredSpeed];
    
    if (provider >= required) return 1.0; // Meets or exceeds
    if (provider === required - 1) return 0.5;
    return 0.1;
  }
  
  /**
   * Calculate strength bonus based on task type
   */
  private static calculateStrengthBonus(
    strengths: string[],
    taskType: string
  ): number {
    // Map task types to relevant strengths
    const taskStrengthMap: Record<string, string[]> = {
      'paper_finding': ['search', 'research', 'reasoning'],
      'abstract_writing': ['writing', 'analysis'],
      'content_writing': ['writing'],
      'idea_generation': ['reasoning', 'research'],
      'proposal_writing': ['writing', 'analysis', 'reasoning'],
      'data_analysis': ['analysis', 'reasoning'],
      'code_generation': ['code'],
      'image_creation': ['multimodal'],
      'paper_generation': ['writing', 'analysis', 'reasoning'],
      'presentation_generation': ['writing', 'multimodal'],
      'translation': ['writing'],
      'summarization': ['writing', 'analysis']
    };
    
    const relevantStrengths = taskStrengthMap[taskType] || [];
    const matches = relevantStrengths.filter(s => strengths.includes(s));
    
    return matches.length * 5; // 5 points per matching strength
  }
  
  /**
   * Generate human-readable reasons for recommendation
   */
  private static generateReasons(
    capabilities: ProviderCapabilities,
    requirements: TaskRequirements
  ): string[] {
    const reasons: string[] = [];
    
    if (capabilities.bestFor.includes(requirements.taskType)) {
      reasons.push(`Optimized for ${requirements.taskType} tasks`);
    }
    
    if (capabilities.quality === requirements.qualityRequirement) {
      reasons.push(`Matches quality requirement (${requirements.qualityRequirement})`);
    }
    
    if (capabilities.speed === requirements.speedRequirement) {
      reasons.push(`Meets speed requirement (${requirements.speedRequirement})`);
    }
    
    if (requirements.costSensitivity === 'high' && capabilities.cost === 'low') {
      reasons.push('Cost-effective option');
    }
    
    if (requirements.contextLength && capabilities.contextLength && 
        capabilities.contextLength >= requirements.contextLength) {
      reasons.push(`Supports required context length (${capabilities.contextLength.toLocaleString()} tokens)`);
    }
    
    if (capabilities.strengths.length > 0) {
      reasons.push(`Strengths: ${capabilities.strengths.join(', ')}`);
    }
    
    return reasons;
  }
  
  /**
   * Estimate cost for task (rough estimate)
   */
  private static estimateCost(
    capabilities: ProviderCapabilities,
    requirements: TaskRequirements
  ): number | undefined {
    // Rough estimate based on complexity and context
    const baseTokens = requirements.complexity === 'complex' ? 10000 : 
                      requirements.complexity === 'moderate' ? 5000 : 2000;
    
    const contextTokens = requirements.contextLength || 0;
    const totalTokens = baseTokens + contextTokens;
    
    if (capabilities.chat_price_per_million) {
      return (totalTokens / 1_000_000) * capabilities.chat_price_per_million;
    }
    
    return undefined;
  }
  
  /**
   * Load capabilities from database
   */
  private static async loadCapabilitiesFromDatabase(): Promise<Map<string, ProviderCapabilities>> {
    const capabilities = new Map<string, ProviderCapabilities>();
    
    try {
      const result = await pool.query(`
        SELECT 
          provider,
          provider_name,
          supports_chat,
          supports_embeddings,
          supports_image_generation,
          strengths,
          best_for_tasks,
          max_context_length,
          speed,
          cost_tier,
          quality_tier,
          chat_price_per_million,
          embedding_price_per_million
        FROM provider_capabilities
      `);
      
      for (const row of result.rows) {
        capabilities.set(row.provider, {
          provider: row.provider,
          strengths: row.strengths || [],
          bestFor: row.best_for_tasks || [],
          contextLength: row.max_context_length || 0,
          speed: row.speed || 'medium',
          cost: row.cost_tier || 'medium',
          quality: row.quality_tier || 'medium'
        });
      }
    } catch (error) {
      console.error('Error loading capabilities from database:', error);
    }
    
    return capabilities;
  }
  
  /**
   * Merge database capabilities with static registry
   */
  private static mergeCapabilities(
    dbCapabilities: Map<string, ProviderCapabilities>
  ): Map<string, ProviderCapabilities> {
    const merged = new Map<string, ProviderCapabilities>();
    
    // Start with static registry
    const staticProviders = ProviderCapabilityRegistry.getAllProviders();
    for (const provider of staticProviders) {
      const staticCap = ProviderCapabilityRegistry.getCapabilities(provider);
      if (staticCap) {
        merged.set(provider, staticCap);
      }
    }
    
    // Override with database values (more up-to-date)
    for (const [provider, dbCap] of dbCapabilities.entries()) {
      merged.set(provider, dbCap);
    }
    
    return merged;
  }
  
  /**
   * Get all available providers for a user
   */
  static async getAvailableProviders(userId: string): Promise<string[]> {
    try {
      const result = await pool.query(`
        SELECT DISTINCT provider
        FROM ai_provider_keys
        WHERE user_id = $1 AND is_active = true
      `, [userId]);
      
      return result.rows.map(row => row.provider);
    } catch (error) {
      console.error('Error getting available providers:', error);
      return [];
    }
  }
}

