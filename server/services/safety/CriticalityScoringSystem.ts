/**
 * Criticality Scoring System
 * Task 31: Add criticality scoring system
 * 
 * Scores actions and outputs based on their criticality:
 * - Impact assessment
 * - Risk evaluation
 * - Reversibility
 * - Data sensitivity
 * - User impact
 */

import { ActionType, ActionCriticality } from './ActionValidationSystem.js';
import { EventEmitter } from 'events';

export interface CriticalityFactors {
  impact: {
    scope: 'user' | 'project' | 'institution' | 'public' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUsers?: number;
  };
  risk: {
    probability: 'low' | 'medium' | 'high';
    consequence: 'low' | 'medium' | 'high' | 'critical';
    reversibility: 'reversible' | 'partially_reversible' | 'irreversible';
  };
  data: {
    sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
    dataType?: 'personal' | 'financial' | 'research' | 'administrative';
    volume?: number; // Amount of data affected
  };
  context: {
    actionType: ActionType;
    targetType: string;
    timeSensitivity?: 'low' | 'medium' | 'high';
    dependencies?: string[]; // Other actions/systems this depends on
  };
}

export interface CriticalityScore {
  overallScore: number; // 0-100, higher = more critical
  criticality: ActionCriticality;
  factors: {
    impactScore: number;
    riskScore: number;
    dataScore: number;
    contextScore: number;
  };
  breakdown: {
    impact: string;
    risk: string;
    data: string;
    context: string;
  };
  recommendations: string[];
}

export class CriticalityScoringSystem extends EventEmitter {
  /**
   * Calculate criticality score
   */
  calculateCriticality(factors: CriticalityFactors): CriticalityScore {
    // Calculate individual factor scores
    const impactScore = this.calculateImpactScore(factors.impact);
    const riskScore = this.calculateRiskScore(factors.risk);
    const dataScore = this.calculateDataScore(factors.data);
    const contextScore = this.calculateContextScore(factors.context);
    
    // Weighted overall score
    const overallScore = (
      impactScore * 0.35 +
      riskScore * 0.30 +
      dataScore * 0.20 +
      contextScore * 0.15
    );
    
    // Determine criticality level
    const criticality = this.determineCriticalityLevel(overallScore, factors);
    
    // Generate breakdown
    const breakdown = {
      impact: this.explainImpactScore(factors.impact, impactScore),
      risk: this.explainRiskScore(factors.risk, riskScore),
      data: this.explainDataScore(factors.data, dataScore),
      context: this.explainContextScore(factors.context, contextScore)
    };
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(overallScore, criticality, factors);
    
    const score: CriticalityScore = {
      overallScore: Math.round(overallScore),
      criticality,
      factors: {
        impactScore,
        riskScore,
        dataScore,
        contextScore
      },
      breakdown,
      recommendations
    };
    
    this.emit('criticality:calculated', { factors, score });
    
    return score;
  }
  
  /**
   * Calculate impact score
   */
  private calculateImpactScore(impact: CriticalityFactors['impact']): number {
    let score = 0;
    
    // Scope scoring
    const scopeScores: Record<string, number> = {
      'user': 10,
      'project': 25,
      'institution': 50,
      'public': 75,
      'system': 100
    };
    score += scopeScores[impact.scope] || 0;
    
    // Severity scoring
    const severityScores: Record<string, number> = {
      'low': 10,
      'medium': 30,
      'high': 60,
      'critical': 100
    };
    score += severityScores[impact.severity] || 0;
    
    // User count factor
    if (impact.affectedUsers) {
      if (impact.affectedUsers > 1000) score += 20;
      else if (impact.affectedUsers > 100) score += 10;
      else if (impact.affectedUsers > 10) score += 5;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate risk score
   */
  private calculateRiskScore(risk: CriticalityFactors['risk']): number {
    let score = 0;
    
    // Probability scoring
    const probabilityScores: Record<string, number> = {
      'low': 20,
      'medium': 50,
      'high': 80
    };
    score += probabilityScores[risk.probability] || 0;
    
    // Consequence scoring
    const consequenceScores: Record<string, number> = {
      'low': 10,
      'medium': 30,
      'high': 60,
      'critical': 100
    };
    score += consequenceScores[risk.consequence] || 0;
    
    // Reversibility penalty
    if (risk.reversibility === 'irreversible') {
      score += 30;
    } else if (risk.reversibility === 'partially_reversible') {
      score += 15;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate data score
   */
  private calculateDataScore(data: CriticalityFactors['data']): number {
    let score = 0;
    
    // Sensitivity scoring
    const sensitivityScores: Record<string, number> = {
      'public': 10,
      'internal': 30,
      'confidential': 70,
      'restricted': 100
    };
    score += sensitivityScores[data.sensitivity] || 0;
    
    // Data type scoring
    if (data.dataType === 'personal' || data.dataType === 'financial') {
      score += 20;
    } else if (data.dataType === 'research') {
      score += 10;
    }
    
    // Volume factor
    if (data.volume && data.volume > 10000) {
      score += 10;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate context score
   */
  private calculateContextScore(context: CriticalityFactors['context']): number {
    let score = 0;
    
    // Action type scoring
    const actionScores: Record<ActionType, number> = {
      'read': 10,
      'query': 15,
      'write': 30,
      'create': 40,
      'modify': 50,
      'update': 50,
      'share': 60,
      'execute': 70,
      'publish': 80,
      'delete': 100
    };
    score += actionScores[context.actionType] || 50;
    
    // Target type scoring
    const criticalTargets = ['user', 'data', 'system', 'database'];
    if (criticalTargets.includes(context.targetType.toLowerCase())) {
      score += 20;
    }
    
    // Time sensitivity
    if (context.timeSensitivity === 'high') {
      score += 15;
    } else if (context.timeSensitivity === 'medium') {
      score += 8;
    }
    
    // Dependencies
    if (context.dependencies && context.dependencies.length > 0) {
      score += Math.min(15, context.dependencies.length * 3);
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Determine criticality level
   */
  private determineCriticalityLevel(
    overallScore: number,
    factors: CriticalityFactors
  ): ActionCriticality {
    // Check for critical factors
    if (factors.impact.severity === 'critical' ||
        factors.risk.consequence === 'critical' ||
        factors.data.sensitivity === 'restricted' ||
        factors.risk.reversibility === 'irreversible') {
      return 'critical';
    }
    
    // Score-based determination
    if (overallScore >= 80) return 'critical';
    if (overallScore >= 60) return 'high';
    if (overallScore >= 40) return 'medium';
    return 'low';
  }
  
  /**
   * Explain impact score
   */
  private explainImpactScore(impact: CriticalityFactors['impact'], score: number): string {
    return `Impact: ${impact.severity} severity affecting ${impact.scope} scope${impact.affectedUsers ? ` (${impact.affectedUsers} users)` : ''}`;
  }
  
  /**
   * Explain risk score
   */
  private explainRiskScore(risk: CriticalityFactors['risk'], score: number): string {
    return `Risk: ${risk.probability} probability, ${risk.consequence} consequence, ${risk.reversibility}`;
  }
  
  /**
   * Explain data score
   */
  private explainDataScore(data: CriticalityFactors['data'], score: number): string {
    return `Data: ${data.sensitivity} sensitivity${data.dataType ? `, ${data.dataType} type` : ''}${data.volume ? `, ${data.volume} records` : ''}`;
  }
  
  /**
   * Explain context score
   */
  private explainContextScore(context: CriticalityFactors['context'], score: number): string {
    return `Context: ${context.actionType} on ${context.targetType}${context.timeSensitivity ? `, ${context.timeSensitivity} time sensitivity` : ''}`;
  }
  
  /**
   * Generate recommendations based on criticality
   */
  private generateRecommendations(
    overallScore: number,
    criticality: ActionCriticality,
    factors: CriticalityFactors
  ): string[] {
    const recommendations: string[] = [];
    
    if (criticality === 'critical') {
      recommendations.push('CRITICAL: Requires explicit approval before execution');
      recommendations.push('Implement additional safety checks');
      recommendations.push('Consider staged rollout');
    }
    
    if (criticality === 'high') {
      recommendations.push('HIGH RISK: Requires approval before execution');
      recommendations.push('Monitor execution closely');
    }
    
    if (factors.risk.reversibility === 'irreversible') {
      recommendations.push('IRREVERSIBLE: Create backup before proceeding');
      recommendations.push('Implement rollback plan');
    }
    
    if (factors.data.sensitivity === 'restricted' || factors.data.sensitivity === 'confidential') {
      recommendations.push('SENSITIVE DATA: Ensure proper access controls');
      recommendations.push('Log all access and modifications');
    }
    
    if (factors.impact.scope === 'public' || factors.impact.scope === 'system') {
      recommendations.push('WIDE SCOPE: Test in isolated environment first');
      recommendations.push('Implement gradual rollout');
    }
    
    if (overallScore >= 70) {
      recommendations.push('Consider additional validation steps');
    }
    
    return recommendations;
  }
  
  /**
   * Assess criticality for an action
   */
  assessActionCriticality(
    action: ActionType,
    target: string,
    context?: {
      dataSensitivity?: string;
      userCount?: number;
      reversibility?: 'reversible' | 'partially_reversible' | 'irreversible';
    }
  ): CriticalityScore {
    const factors: CriticalityFactors = {
      impact: {
        scope: this.inferScope(target, context),
        severity: this.inferSeverity(action, target),
        affectedUsers: context?.userCount
      },
      risk: {
        probability: this.inferProbability(action),
        consequence: this.inferConsequence(action, target),
        reversibility: context?.reversibility || this.inferReversibility(action)
      },
      data: {
        sensitivity: (context?.dataSensitivity as any) || this.inferDataSensitivity(target),
        dataType: this.inferDataType(target)
      },
      context: {
        actionType: action,
        targetType: target
      }
    };
    
    return this.calculateCriticality(factors);
  }
  
  /**
   * Infer scope from target
   */
  private inferScope(target: string, context?: any): CriticalityFactors['impact']['scope'] {
    if (target.includes('system') || target.includes('database')) return 'system';
    if (target.includes('public') || target.includes('publish')) return 'public';
    if (target.includes('institution') || target.includes('lab')) return 'institution';
    if (target.includes('project')) return 'project';
    return 'user';
  }
  
  /**
   * Infer severity from action and target
   */
  private inferSeverity(action: ActionType, target: string): CriticalityFactors['impact']['severity'] {
    if (action === 'delete' || action === 'execute') return 'high';
    if (action === 'publish' || action === 'share') return 'medium';
    if (target.includes('user') || target.includes('data')) return 'medium';
    return 'low';
  }
  
  /**
   * Infer probability
   */
  private inferProbability(action: ActionType): CriticalityFactors['risk']['probability'] {
    if (action === 'delete' || action === 'execute') return 'high';
    if (action === 'modify' || action === 'publish') return 'medium';
    return 'low';
  }
  
  /**
   * Infer consequence
   */
  private inferConsequence(action: ActionType, target: string): CriticalityFactors['risk']['consequence'] {
    if (action === 'delete' && (target.includes('data') || target.includes('user'))) return 'critical';
    if (action === 'delete' || action === 'execute') return 'high';
    if (action === 'publish' || action === 'modify') return 'medium';
    return 'low';
  }
  
  /**
   * Infer reversibility
   */
  private inferReversibility(action: ActionType): CriticalityFactors['risk']['reversibility'] {
    if (action === 'delete') return 'irreversible';
    if (action === 'modify' || action === 'update') return 'partially_reversible';
    return 'reversible';
  }
  
  /**
   * Infer data sensitivity
   */
  private inferDataSensitivity(target: string): CriticalityFactors['data']['sensitivity'] {
    if (target.includes('personal') || target.includes('private')) return 'restricted';
    if (target.includes('confidential') || target.includes('secret')) return 'confidential';
    if (target.includes('internal')) return 'internal';
    return 'public';
  }
  
  /**
   * Infer data type
   */
  private inferDataType(target: string): CriticalityFactors['data']['dataType'] | undefined {
    if (target.includes('user') || target.includes('personal')) return 'personal';
    if (target.includes('financial') || target.includes('payment')) return 'financial';
    if (target.includes('research') || target.includes('experiment')) return 'research';
    return undefined;
  }
}

// Singleton instance
export const criticalityScoringSystem = new CriticalityScoringSystem();

