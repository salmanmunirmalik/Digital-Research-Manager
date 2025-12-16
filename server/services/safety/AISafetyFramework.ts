/**
 * AI Safety Framework
 * Task 29: Create AISafetyFramework with alignment checking
 * 
 * Ensures AI agents operate safely with:
 * - Alignment checking (ensures outputs align with user intent)
 * - Harmful content detection
 * - Bias detection
 * - Output validation
 * - Safety scoring
 */

import { EventEmitter } from 'events';

export type SafetyLevel = 'safe' | 'low_risk' | 'medium_risk' | 'high_risk' | 'unsafe';
export type AlignmentLevel = 'aligned' | 'mostly_aligned' | 'partially_aligned' | 'misaligned';

export interface SafetyCheckResult {
  safetyLevel: SafetyLevel;
  alignmentLevel: AlignmentLevel;
  safetyScore: number; // 0-100
  alignmentScore: number; // 0-100
  issues: Array<{
    type: 'harmful_content' | 'bias' | 'misalignment' | 'inaccuracy' | 'ethical' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string; // Where in the content
    suggestion?: string; // How to fix
  }>;
  warnings: string[];
  passed: boolean; // Whether content passes safety checks
}

export interface AlignmentCheckResult {
  aligned: boolean;
  alignmentScore: number; // 0-100
  intentMatch: number; // 0-100, how well output matches user intent
  issues: Array<{
    type: 'intent_mismatch' | 'scope_creep' | 'unintended_output' | 'other';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion?: string;
  }>;
}

export interface ContentSafetyCheck {
  content: string;
  contentType: 'text' | 'code' | 'data' | 'command' | 'other';
  context?: {
    userIntent?: string;
    taskType?: string;
    expectedOutput?: string;
  };
}

export class AISafetyFramework extends EventEmitter {
  private harmfulPatterns: RegExp[] = [];
  private biasIndicators: string[] = [];
  
  constructor() {
    super();
    this.initializeSafetyPatterns();
  }
  
  /**
   * Initialize safety patterns
   */
  private initializeSafetyPatterns(): void {
    // Harmful content patterns (simplified - in production, use comprehensive lists)
    this.harmfulPatterns = [
      /violence|harm|danger|unsafe/gi,
      /illegal|unlawful|criminal/gi,
      /discrimination|prejudice|bias/gi
    ];
    
    // Bias indicators
    this.biasIndicators = [
      'stereotype',
      'discrimination',
      'prejudice',
      'bias',
      'unfair',
      'unequal'
    ];
  }
  
  /**
   * Perform comprehensive safety check
   */
  async checkSafety(
    check: ContentSafetyCheck,
    options?: {
      strictMode?: boolean;
      checkAlignment?: boolean;
      checkBias?: boolean;
      checkHarmful?: boolean;
    }
  ): Promise<SafetyCheckResult> {
    const strictMode = options?.strictMode || false;
    const checkAlignment = options?.checkAlignment !== false;
    const checkBias = options?.checkBias !== false;
    const checkHarmful = options?.checkHarmful !== false;
    
    const issues: SafetyCheckResult['issues'] = [];
    const warnings: string[] = [];
    let safetyScore = 100;
    let alignmentScore = 100;
    
    // Check for harmful content
    if (checkHarmful) {
      const harmfulCheck = this.checkHarmfulContent(check.content);
      if (harmfulCheck.found) {
        issues.push(...harmfulCheck.issues);
        safetyScore -= harmfulCheck.issues.reduce((sum, issue) => 
          sum + (issue.severity === 'critical' ? 30 : issue.severity === 'high' ? 20 : issue.severity === 'medium' ? 10 : 5), 0
        );
      }
    }
    
    // Check for bias
    if (checkBias) {
      const biasCheck = this.checkBias(check.content);
      if (biasCheck.found) {
        issues.push(...biasCheck.issues);
        safetyScore -= biasCheck.issues.reduce((sum, issue) => 
          sum + (issue.severity === 'high' ? 15 : issue.severity === 'medium' ? 8 : 3), 0
        );
      }
    }
    
    // Check alignment
    if (checkAlignment && check.context?.userIntent) {
      const alignmentCheck = this.checkAlignment(check.content, check.context.userIntent, check.context.expectedOutput);
      alignmentScore = alignmentCheck.alignmentScore;
      if (!alignmentCheck.aligned) {
        issues.push(...alignmentCheck.issues.map(issue => ({
          type: 'misalignment' as const,
          severity: issue.severity,
          description: issue.description,
          suggestion: issue.suggestion
        })));
        safetyScore -= alignmentCheck.issues.reduce((sum, issue) => 
          sum + (issue.severity === 'high' ? 15 : issue.severity === 'medium' ? 8 : 3), 0
        );
      }
    }
    
    // Determine safety level
    const safetyLevel = this.determineSafetyLevel(safetyScore, issues, strictMode);
    const alignmentLevel = this.determineAlignmentLevel(alignmentScore);
    
    // Check if passed
    const passed = safetyLevel !== 'unsafe' && 
                  safetyLevel !== 'high_risk' &&
                  (strictMode ? safetyLevel === 'safe' : safetyLevel !== 'unsafe');
    
    const result: SafetyCheckResult = {
      safetyLevel,
      alignmentLevel,
      safetyScore: Math.max(0, Math.min(100, safetyScore)),
      alignmentScore: Math.max(0, Math.min(100, alignmentScore)),
      issues,
      warnings,
      passed
    };
    
    this.emit('safety:checked', result);
    
    return result;
  }
  
  /**
   * Check for harmful content
   */
  private checkHarmfulContent(content: string): {
    found: boolean;
    issues: SafetyCheckResult['issues'];
  } {
    const issues: SafetyCheckResult['issues'] = [];
    
    // Check against harmful patterns
    this.harmfulPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        issues.push({
          type: 'harmful_content',
          severity: 'medium',
          description: `Potentially harmful content detected: ${matches[0]}`,
          location: 'content',
          suggestion: 'Review content for appropriateness'
        });
      }
    });
    
    // Additional checks (simplified)
    if (content.toLowerCase().includes('hack') || content.toLowerCase().includes('exploit')) {
      issues.push({
        type: 'harmful_content',
        severity: 'high',
        description: 'Potentially harmful technical content detected',
        location: 'content',
        suggestion: 'Review for security implications'
      });
    }
    
    return {
      found: issues.length > 0,
      issues
    };
  }
  
  /**
   * Check for bias
   */
  private checkBias(content: string): {
    found: boolean;
    issues: SafetyCheckResult['issues'];
  } {
    const issues: SafetyCheckResult['issues'] = [];
    
    // Check for bias indicators
    this.biasIndicators.forEach(indicator => {
      if (content.toLowerCase().includes(indicator)) {
        issues.push({
          type: 'bias',
          severity: 'medium',
          description: `Potential bias indicator found: ${indicator}`,
          location: 'content',
          suggestion: 'Review for fairness and inclusivity'
        });
      }
    });
    
    // Check for demographic references that might indicate bias
    const demographicPatterns = [
      /\b(men|women|male|female|race|ethnicity)\b/gi
    ];
    
    demographicPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length > 3) {
        issues.push({
          type: 'bias',
          severity: 'low',
          description: 'Multiple demographic references detected - review for potential bias',
          location: 'content',
          suggestion: 'Ensure fair and unbiased representation'
        });
      }
    });
    
    return {
      found: issues.length > 0,
      issues
    };
  }
  
  /**
   * Check alignment with user intent
   */
  checkAlignment(
    content: string,
    userIntent: string,
    expectedOutput?: string
  ): AlignmentCheckResult {
    // Simplified alignment checking
    // In production, this would use more sophisticated NLP
    
    const intentKeywords = this.extractKeywords(userIntent);
    const contentKeywords = this.extractKeywords(content);
    
    // Calculate keyword overlap
    const overlap = intentKeywords.filter(kw => 
      contentKeywords.some(ckw => ckw.toLowerCase().includes(kw.toLowerCase()) || 
                                  kw.toLowerCase().includes(ckw.toLowerCase()))
    ).length;
    
    const intentMatch = intentKeywords.length > 0 
      ? (overlap / intentKeywords.length) * 100 
      : 50;
    
    // Check if content addresses the intent
    const addressesIntent = intentMatch >= 70;
    
    // Check for scope creep
    const scopeCreep = this.detectScopeCreep(content, userIntent);
    
    const issues: AlignmentCheckResult['issues'] = [];
    
    if (intentMatch < 70) {
      issues.push({
        type: 'intent_mismatch',
        severity: 'high',
        description: `Content may not fully address user intent (${intentMatch.toFixed(0)}% match)`,
        suggestion: 'Review content to ensure it addresses the original request'
      });
    }
    
    if (scopeCreep.detected) {
      issues.push({
        type: 'scope_creep',
        severity: scopeCreep.severity,
        description: scopeCreep.description,
        suggestion: 'Focus content on the original request'
      });
    }
    
    const alignmentScore = addressesIntent && !scopeCreep.detected ? 90 : 
                          addressesIntent ? 75 : 
                          intentMatch;
    
    return {
      aligned: addressesIntent && !scopeCreep.detected && issues.length === 0,
      alignmentScore: Math.max(0, Math.min(100, alignmentScore)),
      intentMatch,
      issues
    };
  }
  
  /**
   * Detect scope creep
   */
  private detectScopeCreep(content: string, userIntent: string): {
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    description: string;
  } {
    // Simplified scope creep detection
    // In production, use more sophisticated analysis
    
    const intentLength = userIntent.split(/\s+/).length;
    const contentLength = content.split(/\s+/).length;
    
    // If content is significantly longer than intent suggests, might be scope creep
    const lengthRatio = contentLength / Math.max(intentLength, 1);
    
    if (lengthRatio > 5) {
      return {
        detected: true,
        severity: 'medium',
        description: 'Content appears to be significantly longer than the request suggests possible scope creep'
      };
    }
    
    return {
      detected: false,
      severity: 'low',
      description: ''
    };
  }
  
  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simplified keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
    
    // Return unique keywords
    return [...new Set(words)].slice(0, 10);
  }
  
  /**
   * Determine safety level
   */
  private determineSafetyLevel(
    safetyScore: number,
    issues: SafetyCheckResult['issues'],
    strictMode: boolean
  ): SafetyLevel {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0 || safetyScore < 30) {
      return 'unsafe';
    }
    
    if (highIssues > 2 || safetyScore < 50) {
      return 'high_risk';
    }
    
    if (highIssues > 0 || safetyScore < 70) {
      return 'medium_risk';
    }
    
    if (strictMode && (issues.length > 0 || safetyScore < 90)) {
      return 'low_risk';
    }
    
    if (safetyScore >= 90 && issues.length === 0) {
      return 'safe';
    }
    
    return 'low_risk';
  }
  
  /**
   * Determine alignment level
   */
  private determineAlignmentLevel(alignmentScore: number): AlignmentLevel {
    if (alignmentScore >= 90) return 'aligned';
    if (alignmentScore >= 70) return 'mostly_aligned';
    if (alignmentScore >= 50) return 'partially_aligned';
    return 'misaligned';
  }
  
  /**
   * Validate action before execution
   */
  validateAction(
    action: string,
    context?: {
      agentType?: string;
      taskType?: string;
      criticality?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): {
    allowed: boolean;
    reason?: string;
    requiresApproval: boolean;
  } {
    // Check for dangerous actions
    const dangerousActions = ['delete', 'remove', 'destroy', 'modify', 'update', 'execute'];
    const isDangerous = dangerousActions.some(da => action.toLowerCase().includes(da));
    
    if (isDangerous && context?.criticality === 'critical') {
      return {
        allowed: false,
        reason: 'Critical action requires explicit approval',
        requiresApproval: true
      };
    }
    
    if (isDangerous) {
      return {
        allowed: true,
        requiresApproval: true
      };
    }
    
    return {
      allowed: true,
      requiresApproval: false
    };
  }
}

// Singleton instance
export const aiSafetyFramework = new AISafetyFramework();

