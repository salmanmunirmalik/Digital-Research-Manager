/**
 * Shared pre/post safety checks for agent execution paths.
 */

import {
  aiSafetyFramework,
  SafetyCheckResult,
} from '../safety/AISafetyFramework.js';
import { actionValidationSystem } from '../safety/ActionValidationSystem.js';

const WRITE_AGENTS = new Set([
  'proposal_writing',
  'protocol_optimization',
  'paper_writing',
  'abstract_writing',
  'draft_compilation',
  'presentation_slide',
  'figure_generation',
  'output_formatting',
]);

export type AgentSafetyGateResult = {
  allowed: boolean;
  requiresApproval: boolean;
  blockedReason?: string;
  precheck?: SafetyCheckResult;
  warnings: string[];
};

export async function gateAgentExecution(opts: {
  userId: string;
  agentType: string;
  input: unknown;
  userRole?: string;
}): Promise<AgentSafetyGateResult> {
  const warnings: string[] = [];
  const content = typeof opts.input === 'string'
    ? opts.input
    : JSON.stringify(opts.input ?? {}).slice(0, 10_000);

  const actionType = WRITE_AGENTS.has(opts.agentType) ? 'write' : 'read';

  const validation = await actionValidationSystem.validateAction({
    action: actionType,
    target: opts.agentType,
    parameters: { content },
    context: {
      userId: opts.userId,
      agentType: opts.agentType,
      taskType: opts.agentType,
      userRole: opts.userRole,
    },
    metadata: {
      description: `Execute ${opts.agentType}`,
      reason: `User-initiated ${opts.agentType}`,
    },
  });

  const precheck = await aiSafetyFramework.checkSafety(
    {
      content,
      contentType: 'text',
      context: {
        userIntent: `Run ${opts.agentType}`,
        taskType: opts.agentType,
      },
    },
    { strictMode: false }
  );

  const critical = precheck.issues.some((i) => i.severity === 'critical');
  const hardFail =
    precheck.safetyLevel === 'unsafe' ||
    (critical && !precheck.passed) ||
    validation.issues.some((i) => i.severity === 'critical');

  if (!validation.allowed && hardFail) {
    return {
      allowed: false,
      requiresApproval: validation.requiresApproval,
      blockedReason:
        validation.issues[0]?.description ||
        precheck.issues[0]?.description ||
        'Blocked by safety policy',
      precheck,
      warnings,
    };
  }

  if (!precheck.passed || validation.requiresApproval) {
    warnings.push(
      ...(precheck.warnings || []),
      ...validation.warnings,
      ...(precheck.issues || []).map((i) => i.description)
    );
  }

  // Soft-allow scientific content; only hard-block true unsafe/critical
  if (hardFail) {
    return {
      allowed: false,
      requiresApproval: true,
      blockedReason:
        precheck.issues.find((i) => i.severity === 'critical')?.description ||
        'Content failed critical safety checks',
      precheck,
      warnings,
    };
  }

  return {
    allowed: true,
    requiresApproval: validation.requiresApproval,
    precheck,
    warnings: [...new Set(warnings)].slice(0, 8),
  };
}

export async function reviewAgentOutput(
  agentType: string,
  output: unknown,
  userIntent?: string
): Promise<SafetyCheckResult | null> {
  try {
    const content =
      typeof output === 'string'
        ? output
        : JSON.stringify(output ?? {}).slice(0, 12_000);
    return await aiSafetyFramework.checkSafety(
      {
        content,
        contentType: 'text',
        context: { userIntent, taskType: agentType },
      },
      { strictMode: false, checkAlignment: Boolean(userIntent) }
    );
  } catch {
    return null;
  }
}
