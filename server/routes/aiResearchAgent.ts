/**
 * AI Research Agent API Routes
 * Simple chat interface with intelligent background processing
 * Handles task analysis, tool selection, and agent routing
 */

import { Router } from 'express';
import axios from 'axios';
import pool from "../../database/config.js";
import { getUserApiKey, getUserDefaultProvider, getApiKeyWithFallback, getPlatformGeminiKey } from './aiProviderKeys.js';
import { getApiForTask } from './apiTaskAssignments.js';
import { AIProviderFactory } from '../services/AIProviderFactory.js';
import { ChatMessage } from '../services/AIProvider.js';
import { UserContextRetriever } from '../services/UserContextRetriever.js';
import { EnhancedRAGSystem } from '../services/EnhancedRAGSystem.js';
import { ContinuousLearningEngine } from '../services/ContinuousLearningEngine.js';
import { SmartToolSelector, TaskRequirements } from '../services/SmartToolSelector.js';
import { TaskAnalysisEngine, TaskAnalysis } from '../services/TaskAnalysisEngine.js';
import { AgentFactory } from '../services/AgentFactory.js';

const router: Router = Router();

// ==============================================
// GET ENDPOINT - Health/Status check
// ==============================================

router.get('/', async (req: any, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    res.json({
      status: 'active',
      message: 'AI Research Agent is ready',
      capabilities: [
        'chat',
        'task_analysis',
        'context_retrieval',
        'tool_selection',
        'agent_routing'
      ]
    });
  } catch (error: any) {
    console.error('Error in AI Research Agent GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// CHAT ENDPOINT - Main entry point
// ==============================================

router.post('/chat', async (req: any, res) => {
  try {
    const { message, conversation_history = [], stream = false } = req.body;
    const userId = req.user?.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`🤖 AI Research Agent - User ${userId}: ${message.substring(0, 50)}...`);

    // Check if streaming is requested
    if (stream) {
      // Set up Server-Sent Events for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      try {
        await processMessageWithStreaming(message, userId, conversation_history, res);
      } catch (streamError: any) {
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
      return;
    }

    // Standard non-streaming response
    const { response: responseText, apiUsed } = await processMessage(message, userId, conversation_history);

    res.json({
      content: responseText,
      apiUsed: apiUsed || null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in AI Research Agent chat:', error);
    res.status(500).json({ 
      error: 'Failed to process message', 
      details: error.message 
    });
  }
});

// ==============================================
// STREAMING SUPPORT
// ==============================================

/**
 * Process message with streaming response
 * Sends chunks of text as they're generated for real-time UX
 */
async function processMessageWithStreaming(
  message: string,
  userId: string,
  conversationHistory: any[],
  res: any
): Promise<void> {
  // Step 1: Task analysis
  const taskAnalysis = TaskAnalysisEngine.analyzeTask(message);
  res.write(`data: ${JSON.stringify({ type: 'analysis', taskType: taskAnalysis.taskType })}\n\n`);
  
  // Step 2: Get API assignment
  let apiAssignment = await getApiForTask(userId, taskAnalysis.taskType);
  
  if (!apiAssignment) {
    const availableProviders = await SmartToolSelector.getAvailableProviders(userId);
    if (availableProviders.length > 0) {
      const requirements: TaskRequirements = {
        taskType: taskAnalysis.taskType,
        complexity: taskAnalysis.estimatedComplexity,
        requiresContext: taskAnalysis.requiresContext,
        contextLength: taskAnalysis.contextRequirements?.minContextLength,
        qualityRequirement: taskAnalysis.qualityRequirement,
        speedRequirement: taskAnalysis.speedRequirement,
        costSensitivity: taskAnalysis.costSensitivity,
        requiresEmbeddings: taskAnalysis.contextRequirements?.requiresEmbeddings,
        requiresImageGeneration: taskAnalysis.taskType === 'image_creation'
      };
      
      const recommendation = await SmartToolSelector.selectBestProvider(
        requirements,
        availableProviders,
        userId
      );
      
      if (recommendation) {
        // Use fallback: user key → platform Gemini key
        const recommendedKey = await getApiKeyWithFallback(userId, recommendation.provider, true);
        if (recommendedKey) {
          const keyResult = await pool.query(
            `SELECT id FROM ai_provider_keys WHERE user_id = $1 AND provider = $2 AND is_active = true LIMIT 1`,
            [userId, recommendation.provider]
          );
          
          apiAssignment = {
            apiKeyId: keyResult.rows[0]?.id || '',
            provider: recommendation.provider,
            providerName: recommendation.providerName,
            apiKey: recommendedKey
          };
        }
      }
    }
  }
  
  // If still no assignment, try platform Gemini key as fallback
  if (!apiAssignment) {
    const platformKey = getPlatformGeminiKey();
    if (platformKey) {
      apiAssignment = {
        apiKeyId: '',
        provider: 'google_gemini',
        providerName: 'Google Gemini (Platform)',
        apiKey: platformKey
      };
    } else {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        content: 'No API keys configured. Please configure GEMINI_API_KEY or add API keys in Settings.' 
      })}\n\n`);
      res.end();
      return;
    }
  }
  
  res.write(`data: ${JSON.stringify({ type: 'provider', provider: apiAssignment.providerName })}\n\n`);
  
  // Step 3: Retrieve context if needed
  const userContext = taskAnalysis.requiresContext 
    ? await EnhancedRAGSystem.retrieveEnhancedContext(userId, message)
    : { user: null, weightedResults: [], totalRelevance: 0, sourcesUsed: [] };
  
  res.write(`data: ${JSON.stringify({ 
    type: 'context', 
    sources: userContext.sourcesUsed.length 
  })}\n\n`);
  
  // Step 4: Generate response with streaming
  const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
  const systemPrompt = buildSystemPrompt(taskAnalysis, userContext);
  const contextString = buildContextString(userContext, taskAnalysis.parameters);
  const userPrompt = contextString 
    ? `${message}\n\n--- Context ---\n${contextString}`
    : message;
  
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map((msg: any) => ({
      role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user', content: userPrompt }
  ];
  
  const generationConfig = getGenerationConfig(taskAnalysis.taskType);
  
  // Note: Streaming support depends on provider implementation
  // For now, send response in chunks after generation
  try {
    const response = await aiProvider.chat(messages, {
      apiKey: apiAssignment.apiKey,
      temperature: generationConfig.temperature,
      maxTokens: generationConfig.maxTokens,
      topP: generationConfig.topP,
      frequencyPenalty: generationConfig.frequencyPenalty,
      presencePenalty: generationConfig.presencePenalty
    });
    
    // Simulate streaming by sending in chunks
    const content = enhanceResponseWithCitations(response.content, userContext, taskAnalysis.taskType);
    const chunkSize = 50; // Characters per chunk
    
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.substring(i, i + chunkSize);
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      // Small delay for realistic streaming effect
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    res.write(`data: ${JSON.stringify({ 
      type: 'done', 
      apiUsed: apiAssignment.providerName 
    })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      content: error.message 
    })}\n\n`);
    res.end();
  }
}

// ==============================================
// BACKGROUND INTELLIGENCE FUNCTIONS
// ==============================================

/**
 * Process user message with background intelligence
 * This is where all the magic happens behind the scenes
 */
async function processMessage(
  message: string, 
  userId: string, 
  conversationHistory: any[]
): Promise<{ response: string; apiUsed: string | null }> {
  // Step 1: Enhanced task analysis using TaskAnalysisEngine
  const taskAnalysis = TaskAnalysisEngine.analyzeTask(message);
  console.log(`📊 Task Analysis: ${taskAnalysis.taskType} (confidence: ${taskAnalysis.confidence})`);
  
  // Step 2: Get user's API assignment for this task (user preference)
  let apiAssignment = await getApiForTask(userId, taskAnalysis.taskType);
  
  // Step 3: If no user assignment, use Smart Tool Selector to recommend best provider
  if (!apiAssignment) {
    console.log(`🔍 No user assignment found, using Smart Tool Selector...`);
    
    const availableProviders = await SmartToolSelector.getAvailableProviders(userId);
    
    if (availableProviders.length > 0) {
      const requirements: TaskRequirements = {
        taskType: taskAnalysis.taskType,
        complexity: taskAnalysis.estimatedComplexity,
        requiresContext: taskAnalysis.requiresContext,
        contextLength: taskAnalysis.contextRequirements?.minContextLength,
        qualityRequirement: taskAnalysis.qualityRequirement,
        speedRequirement: taskAnalysis.speedRequirement,
        costSensitivity: taskAnalysis.costSensitivity,
        requiresEmbeddings: taskAnalysis.contextRequirements?.requiresEmbeddings,
        requiresImageGeneration: taskAnalysis.taskType === 'image_creation'
      };
      
      const recommendation = await SmartToolSelector.selectBestProvider(
        requirements,
        availableProviders,
        userId
      );
      
      if (recommendation) {
        // Get API key for recommended provider with fallback to platform Gemini
        const recommendedKey = await getApiKeyWithFallback(userId, recommendation.provider, true);
        if (recommendedKey) {
          // Get API key ID from database (if user has their own key)
          const keyResult = await pool.query(
            `SELECT id FROM ai_provider_keys WHERE user_id = $1 AND provider = $2 AND is_active = true LIMIT 1`,
            [userId, recommendation.provider]
          );
          
          apiAssignment = {
            apiKeyId: keyResult.rows[0]?.id || '',
            provider: recommendation.provider,
            providerName: recommendation.providerName,
            apiKey: recommendedKey
          };
          console.log(`✨ Smart selection: ${recommendation.providerName} (score: ${recommendation.score.toFixed(1)})`);
          console.log(`   Reasons: ${recommendation.reasons.join(', ')}`);
        }
      }
    }
  }
  
  // If still no assignment, try platform Gemini key as fallback
  if (!apiAssignment) {
    const platformKey = getPlatformGeminiKey();
    if (platformKey) {
      apiAssignment = {
        apiKeyId: '',
        provider: 'google_gemini',
        providerName: 'Google Gemini (Platform)',
        apiKey: platformKey
      };
      console.log('✨ Using platform Gemini API key for basic features');
    } else {
      // No API available - return helpful message
      return {
        response: `I understand you want me to help with "${taskAnalysis.taskType}", but you haven't configured any API keys yet.\n\n` +
                 `Please go to Settings → API Management and add your API keys (e.g., OpenAI, Google Gemini, Anthropic Claude) to get started.\n\n` +
                 `Once configured, I'll automatically select the best API for each task!`,
        apiUsed: null
      };
    }
  }
  
  console.log(`🔧 Using API: ${apiAssignment.providerName} (${apiAssignment.provider})`);
  
  // Step 4: Check if we should use a specialized agent
  const useAgent = AgentFactory.isAgentSupported(taskAnalysis.taskType);
  
  if (useAgent) {
    console.log(`🤖 Using specialized agent: ${taskAnalysis.taskType}`);
    try {
      const agent = AgentFactory.createAgent(taskAnalysis.taskType);
      
      // Retrieve enhanced user context with weighted scoring if needed
      const userContext = taskAnalysis.requiresContext 
        ? await EnhancedRAGSystem.retrieveEnhancedContext(userId, message)
        : { user: null, weightedResults: [], totalRelevance: 0, sourcesUsed: [] };
      
      // Prepare agent input based on task type
      // Convert EnhancedRAGSystem format to agent-compatible format
      const agentCompatibleContext = convertEnhancedContextToAgentFormat(userContext);
      const agentInput = {
        query: message,
        ...taskAnalysis.parameters,
        context: agentCompatibleContext
      };
      
      // Execute agent
      const agentResult = await agent.execute(agentInput, {
        userContext: agentCompatibleContext,
        conversationHistory,
        additionalData: { userId }
      }, {
        provider: apiAssignment.provider,
        apiKey: apiAssignment.apiKey
      });
      
      if (agentResult.success) {
        // Format agent result for chat response
        let formattedResponse: string;
        if (typeof agentResult.content === 'string') {
          formattedResponse = agentResult.content;
        } else if (agentResult.content) {
          formattedResponse = JSON.stringify(agentResult.content, null, 2);
        } else {
          formattedResponse = 'Agent execution completed successfully.';
        }
        
        return {
          response: formattedResponse,
          apiUsed: apiAssignment.providerName
        };
      } else {
        // Agent failed, fall back to direct API call
        console.log(`⚠️ Agent execution failed, falling back to direct API call`);
      }
    } catch (error: any) {
      console.error(`Error executing agent: ${error.message}`);
      // Fall through to direct API call
    }
  }
  
  // Step 5: Retrieve enhanced user context with weighted scoring - only if needed
  const userContext = taskAnalysis.requiresContext 
    ? await EnhancedRAGSystem.retrieveEnhancedContext(userId, message)
    : { user: null, weightedResults: [], totalRelevance: 0, sourcesUsed: [] };
  
  // Step 6: Call user's assigned API using new provider abstraction (fallback or non-agent tasks)
    const response = await callUserApiWithProvider(
      apiAssignment,
      taskAnalysis,
      message,
      userContext,
      conversationHistory,
      userId
    );
  
  return {
    response,
    apiUsed: apiAssignment.providerName
  };
}

// Task Analysis now handled by TaskAnalysisEngine service (see imports)

/**
 * User Context Retriever - Enhanced with Semantic Search
 * Retrieves relevant user profile content for AI context using embeddings
 */
async function retrieveUserContext(userId: string, query: string): Promise<any> {
  try {
    // Get basic user info
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, current_institution, research_interests FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0] || null;
    
    // Generate embedding for query
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(query, userId);
    } catch (error) {
      console.log('Could not generate query embedding, using keyword search');
    }
    
    // Retrieve relevant content using semantic search
    const relevantContent: any[] = [];
    
    if (queryEmbedding) {
      // Search in ai_training_data using cosine similarity (calculated in JS)
      const trainingDataResult = await pool.query(
        `SELECT 
          source_type,
          source_id,
          title,
          content,
          embedding
        FROM ai_training_data
        WHERE user_id = $1 
          AND processed = true
          AND embedding IS NOT NULL
        LIMIT 50`,
        [userId]
      );
      
      // Calculate cosine similarity for each result
      const similarities = trainingDataResult.rows.map(row => {
        try {
          const storedEmbedding = typeof row.embedding === 'string' 
            ? JSON.parse(row.embedding) 
            : row.embedding;
          
          const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);
          
          return {
            type: row.source_type,
            id: row.source_id,
            title: row.title,
            content: row.content?.substring(0, 500), // Truncate for context
            similarity
          };
        } catch (error) {
          return null;
        }
      }).filter((item): item is any => item !== null && item.similarity > 0.3);
      
      // Sort by similarity and take top 5
      relevantContent.push(...similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5));
    }
    
    // Get user's recent papers
    const papersResult = await pool.query(
      `SELECT id, title, abstract, journal, year 
       FROM papers 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    // Get user's recent Personal NoteBook entries
    const notebooksResult = await pool.query(
      `SELECT id, title, content, methodology, results, conclusions
       FROM lab_notebook_entries 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    // Get user's protocols
    const protocolsResult = await pool.query(
      `SELECT id, title, description, content
       FROM protocols 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    return {
      user,
      papers: papersResult.rows,
      notebooks: notebooksResult.rows,
      protocols: protocolsResult.rows,
      data: [],
      relevantContent: relevantContent.filter(c => c.similarity > 0.3) // Only highly relevant
    };
  } catch (error) {
    console.error('Error retrieving user context:', error);
    return { 
      user: null, 
      papers: [], 
      notebooks: [], 
      protocols: [], 
      data: [],
      relevantContent: []
    };
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Generate embedding for text (reusing existing functionality)
 */
async function generateEmbedding(text: string, userId?: string): Promise<number[]> {
  try {
    // Default to Gemini for basic features
    let defaultProvider = 'google_gemini';
    let apiKey: string | null = null;
    let endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent';
    let model = 'embedding-001';
    
    if (userId) {
      try {
        defaultProvider = await getUserDefaultProvider(userId, 'embedding') || 'google_gemini';
        // Use fallback: user key → platform Gemini key
        apiKey = await getApiKeyWithFallback(userId, defaultProvider, true);
        
        if (apiKey && defaultProvider === 'google_gemini') {
          endpoint = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`;
          model = 'embedding-001';
        } else if (apiKey && defaultProvider === 'openai') {
          endpoint = 'https://api.openai.com/v1/embeddings';
          model = 'text-embedding-3-small';
        }
      } catch (error) {
        console.log('Using platform default embedding provider (Gemini)');
        // Fallback to platform Gemini key
        apiKey = getPlatformGeminiKey();
      }
    } else {
      // No user ID, use platform Gemini key
      apiKey = getPlatformGeminiKey();
    }
    
    if (!apiKey) {
      throw new Error('No API key available. Please configure GEMINI_API_KEY or add your own API key.');
    }
    
    // For Google Gemini (default for basic features)
    if (defaultProvider === 'google_gemini' || !defaultProvider) {
      const response = await axios.post(
        endpoint,
        {
          model: model,
          content: { parts: [{ text: text }] }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.embedding.values;
    }
    
    // For OpenAI (if user has their own key)
    if (defaultProvider === 'openai') {
      const response = await axios.post(
        endpoint,
        {
          input: text,
          model: model
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data[0].embedding;
    }
    
    throw new Error('Unsupported provider');
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Call User's Assigned API using Provider Abstraction
 * Uses the new AIProvider interface for standardized API calls
 */
async function callUserApiWithProvider(
  apiAssignment: { provider: string; providerName: string; apiKey: string },
  taskAnalysis: TaskAnalysis,
  message: string,
  userContext: any,
  conversationHistory: any[],
  userId?: string
): Promise<string> {
  try {
    const { provider, apiKey } = apiAssignment;
    
    // Create provider instance using factory
    const aiProvider = AIProviderFactory.createProvider(provider, apiKey);
    
    // Build context string
    const contextString = buildContextString(userContext, taskAnalysis.parameters);
    
    // Build prompt based on task type
    const systemPrompt = buildSystemPrompt(taskAnalysis, userContext);
    const userPrompt = contextString 
      ? `${message}\n\n--- Context ---\n${contextString}`
      : message;
    
    // Prepare messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg: any) => ({
        role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userPrompt }
    ];
    
    // Enhanced generation parameters based on task type
    const generationConfig = getGenerationConfig(taskAnalysis.taskType);
    
    // Call provider using abstraction with enhanced config
    const response = await aiProvider.chat(messages, {
      apiKey: apiKey,
      temperature: generationConfig.temperature,
      maxTokens: generationConfig.maxTokens,
      topP: generationConfig.topP,
      frequencyPenalty: generationConfig.frequencyPenalty,
      presencePenalty: generationConfig.presencePenalty
    });
    
    // Post-process response to add citations and formatting
    const enhancedResponse = enhanceResponseWithCitations(
      response.content,
      userContext,
      taskAnalysis.taskType
    );
    
    return enhancedResponse;
  } catch (error: any) {
    console.error('Error calling user API:', error);
    return `Error: ${error.message || 'Failed to process request with your assigned API. Please check your API key and try again.'}`;
  }
}

/**
 * Build enhanced system prompt with generative AI capabilities
 * Includes context awareness, citation requirements, and response formatting
 */
function buildSystemPrompt(taskAnalysis: TaskAnalysis, userContext: any): string {
  const taskDescriptions: Record<string, string> = {
    'paper_finding': `You are an expert research librarian and academic search specialist. Your role is to:
- Find and analyze academic papers with precision
- Provide comprehensive search results with detailed summaries
- Rank results by relevance and impact
- Include key information: authors, journal, year, citations, DOI
- Suggest related papers and research directions
- Format results clearly with markdown (use ## for sections, ** for emphasis, - for lists)`,
    
    'abstract_writing': `You are a scientific writing expert specializing in abstract composition. Your role is to:
- Generate well-structured abstracts following IMRAD format (Introduction, Methods, Results, And Discussion)
- Ensure proper word count (typically 150-300 words)
- Use precise scientific language
- Highlight key findings and significance
- Maintain academic tone and style
- Format with clear sections using markdown`,
    
    'content_writing': `You are a professional research content writer. Your role is to:
- Create high-quality, well-structured content
- Use clear, engaging language appropriate for the audience
- Organize content with proper headings and sections
- Include relevant examples and explanations
- Format with markdown for readability`,
    
    'idea_generation': `You are a research ideation expert and innovation consultant. Your role is to:
- Generate creative, feasible, and impactful research ideas
- Identify knowledge gaps and research opportunities
- Consider feasibility, novelty, and potential impact
- Provide detailed descriptions with methodology suggestions
- Rank ideas by priority and potential
- Format ideas clearly with markdown`,
    
    'proposal_writing': `You are a grant writing specialist and research proposal expert. Your role is to:
- Create comprehensive research proposals
- Structure proposals with all required sections
- Include clear objectives, methodology, timeline, and budget
- Write compelling impact statements
- Address evaluation criteria
- Format professionally with markdown`,
    
    'data_analysis': `You are a data analysis expert and statistical consultant. Your role is to:
- Analyze experimental data with appropriate statistical methods
- Provide clear interpretations and insights
- Suggest visualizations and data representations
- Identify patterns, trends, and anomalies
- Recommend next steps for analysis
- Format results with markdown, code blocks for code, and clear sections`,
    
    'image_creation': `You are an image generation assistant specialized in scientific and research visuals. Your role is to:
- Create visual content based on detailed descriptions
- Generate scientific diagrams, charts, and illustrations
- Ensure accuracy and clarity in visual representations`,
    
    'paper_generation': `You are a scientific paper writing assistant. Your role is to:
- Generate complete research papers with all sections
- Follow academic writing standards and formatting
- Include proper citations and references
- Structure content logically (Abstract, Introduction, Methods, Results, Discussion, Conclusion)
- Use markdown formatting with proper headings`,
    
    'presentation_generation': `You are a presentation creator specialized in research presentations. Your role is to:
- Generate professional presentation content
- Create slide-by-slide content with clear structure
- Include speaker notes and talking points
- Suggest visualizations and graphics
- Format with markdown (use ## for slide titles, - for bullet points)`,
    
    'code_generation': `You are a code generation assistant specialized in research and data analysis code. Your role is to:
- Write clean, well-documented code
- Include comments and docstrings
- Follow best practices and conventions
- Provide usage examples
- Format code in markdown code blocks with language specification`,
    
    'translation': `You are a translation expert specializing in academic and scientific content. Your role is to:
- Provide accurate translations maintaining technical terminology
- Preserve meaning and context
- Note any ambiguities or cultural considerations`,
    
    'summarization': `You are a summarization expert. Your role is to:
- Create concise, informative summaries
- Capture key points and main ideas
- Maintain accuracy and completeness
- Format clearly with markdown`
  };
  
  const basePrompt = taskDescriptions[taskAnalysis.taskType] || 'You are a helpful research assistant.';
  
  // Build personalized context section
  let contextSection = '';
  if (userContext.user) {
    contextSection += `\n\n## User Context:\n`;
    if (userContext.user.first_name) {
      contextSection += `- Name: ${userContext.user.first_name} ${userContext.user.last_name || ''}\n`;
    }
    if (userContext.user.current_institution) {
      contextSection += `- Institution: ${userContext.user.current_institution}\n`;
    }
    if (userContext.user.research_interests) {
      contextSection += `- Research Interests: ${userContext.user.research_interests}\n`;
    }
  }
  
  // Add relevant research context if available
  if (userContext.weightedResults && userContext.weightedResults.length > 0) {
    contextSection += `\n## Relevant Research Context:\n`;
    userContext.weightedResults.slice(0, 5).forEach((item: any, idx: number) => {
      contextSection += `${idx + 1}. [${item.source}] ${item.metadata?.title || 'Untitled'} (Relevance: ${(item.relevanceScore * 100).toFixed(0)}%)\n`;
      contextSection += `   ${item.content?.substring(0, 200)}...\n\n`;
    });
  }
  
  // Add response formatting guidelines
  const formattingGuidelines = `\n## Response Guidelines:
- Use markdown formatting for clarity (headings, lists, emphasis, code blocks)
- When citing sources from context, use format: [Source: Title] or [1], [2], etc.
- Structure responses with clear sections using ## for main headings
- Use bullet points (-) or numbered lists for multiple items
- Include code in \`\`\`language code blocks when applicable
- Be concise but comprehensive
- End with 2-3 relevant follow-up questions the user might want to explore`;
  
  return `${basePrompt}${contextSection}${formattingGuidelines}\n\nProvide accurate, helpful responses based on the user's research context. Always format your response using markdown for better readability.`;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string, conversationHistory: any[]): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10), // Last 10 messages for context
    { role: 'user', content: userPrompt }
  ];
  
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

/**
 * Call Google Gemini API
 */
async function callGoogleGemini(apiKey: string, systemPrompt: string, userPrompt: string, conversationHistory: any[]): Promise<string> {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
      }]
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.candidates[0].content.parts[0].text;
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropicClaude(apiKey: string, systemPrompt: string, userPrompt: string, conversationHistory: any[]): Promise<string> {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        ...conversationHistory.slice(-10),
        { role: 'user', content: userPrompt }
      ]
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.content[0].text;
}

/**
 * Call Perplexity API
 */
async function callPerplexity(apiKey: string, systemPrompt: string, userPrompt: string, conversationHistory: any[]): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: 'user', content: userPrompt }
  ];
  
  const response = await axios.post(
    'https://api.perplexity.ai/chat/completions',
    {
      model: 'llama-3.1-sonar-large-128k-online',
      messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

/**
 * Get generation configuration based on task type
 * Optimizes temperature, tokens, and other parameters for best results
 */
function getGenerationConfig(taskType: string): {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
} {
  const configs: Record<string, any> = {
    'paper_finding': {
      temperature: 0.3, // Lower for factual accuracy
      maxTokens: 2500,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    'abstract_writing': {
      temperature: 0.5, // Balanced for creativity and accuracy
      maxTokens: 500,
      topP: 0.95,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1
    },
    'content_writing': {
      temperature: 0.7, // Higher for creativity
      maxTokens: 3000,
      topP: 0.95,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    'idea_generation': {
      temperature: 0.8, // Higher for creativity
      maxTokens: 2000,
      topP: 0.95,
      frequencyPenalty: 0.3,
      presencePenalty: 0.2
    },
    'proposal_writing': {
      temperature: 0.6,
      maxTokens: 4000,
      topP: 0.95,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    'data_analysis': {
      temperature: 0.4, // Lower for analytical accuracy
      maxTokens: 3000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    'paper_generation': {
      temperature: 0.6,
      maxTokens: 8000,
      topP: 0.95,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    'presentation_generation': {
      temperature: 0.6,
      maxTokens: 4000,
      topP: 0.95,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    'code_generation': {
      temperature: 0.3, // Lower for code accuracy
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    }
  };
  
  return configs[taskType] || {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  };
}

/**
 * Enhance response with citations and intelligent follow-up questions
 */
function enhanceResponseWithCitations(
  response: string,
  userContext: any,
  taskType: string
): string {
  let enhanced = response;
  
  // Add citations if context was used
  if (userContext.weightedResults && userContext.weightedResults.length > 0) {
    const citations: string[] = [];
    userContext.weightedResults.slice(0, 5).forEach((item: any, idx: number) => {
      // Check if response mentions this source (basic keyword matching)
      const titleWords = (item.metadata?.title || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      const contentWords = response.toLowerCase();
      const isMentioned = titleWords.some((word: string) => contentWords.includes(word));
      
      if (isMentioned || item.relevanceScore > 0.7) {
        const sourceLabel = item.source === 'paper' ? '📄 Paper' : 
                           item.source === 'lab_notebook_entry' ? '📓 Lab Notebook' :
                           item.source === 'protocol' ? '🔬 Protocol' :
                           item.source === 'experiment' ? '🧪 Experiment' : '📑 Document';
        citations.push(`[${idx + 1}] ${sourceLabel}: **${item.metadata?.title || 'Untitled'}** (Relevance: ${(item.relevanceScore * 100).toFixed(0)}%)`);
        if (item.metadata?.journal) {
          citations[citations.length - 1] += ` - ${item.metadata.journal}${item.metadata.year ? ` (${item.metadata.year})` : ''}`;
        }
      }
    });
    
    if (citations.length > 0) {
      enhanced += `\n\n---\n## 📚 References\n${citations.join('\n')}`;
    }
  }
  
  // Generate intelligent follow-up questions based on task type and response content
  const followUpQuestions = generateFollowUpQuestions(taskType, response, userContext);
  if (followUpQuestions.length > 0 && !enhanced.includes('follow-up') && !enhanced.includes('follow up')) {
    enhanced += `\n\n---\n## 💡 Suggested Follow-up Questions\n`;
    followUpQuestions.forEach((q, idx) => {
      enhanced += `${idx + 1}. ${q}\n`;
    });
  }
  
  return enhanced;
}

/**
 * Generate intelligent follow-up questions based on task type and response
 */
function generateFollowUpQuestions(
  taskType: string,
  response: string,
  userContext: any
): string[] {
  const questions: string[] = [];
  
  switch (taskType) {
    case 'paper_finding':
      questions.push('Would you like me to find more recent papers on this topic?');
      questions.push('Should I search for papers from specific journals or conferences?');
      questions.push('Would you like detailed summaries of any of these papers?');
      break;
      
    case 'idea_generation':
      questions.push('Would you like me to develop a detailed research plan for any of these ideas?');
      questions.push('Should I help you identify the resources needed for these projects?');
      questions.push('Would you like me to find related papers or existing research for these ideas?');
      break;
      
    case 'abstract_writing':
      questions.push('Would you like me to help you write the full paper based on this abstract?');
      questions.push('Should I suggest improvements or alternative phrasings?');
      questions.push('Would you like me to check the abstract against journal requirements?');
      break;
      
    case 'data_analysis':
      questions.push('Would you like me to suggest additional statistical analyses?');
      questions.push('Should I help you create visualizations for these results?');
      questions.push('Would you like me to help interpret these findings in the context of your research?');
      break;
      
    case 'proposal_writing':
      questions.push('Would you like me to help refine any specific sections of the proposal?');
      questions.push('Should I help you create a detailed budget breakdown?');
      questions.push('Would you like me to review the proposal for completeness and clarity?');
      break;
      
    case 'paper_generation':
      questions.push('Would you like me to help refine any specific sections?');
      questions.push('Should I help you add more citations or references?');
      questions.push('Would you like me to format this for a specific journal?');
      break;
      
    case 'presentation_generation':
      questions.push('Would you like me to create additional slides on specific topics?');
      questions.push('Should I help you design visualizations for the presentation?');
      questions.push('Would you like me to generate speaker notes for each slide?');
      break;
      
    default:
      // Generic follow-ups
      questions.push('Would you like me to explore any of these topics in more detail?');
      questions.push('Do you need help with the next steps in your research?');
      questions.push('Would you like me to find related papers or resources?');
  }
  
  // Add context-aware questions if user has active projects
  if (userContext.activeProjects && userContext.activeProjects.length > 0) {
    questions.push(`Would you like me to connect this to your project: "${userContext.activeProjects[0].title}"?`);
  }
  
  return questions.slice(0, 3); // Return top 3 questions
}

// Removed routeToAgent - now handled by callUserApi

/**
 * Convert EnhancedRAGSystem context to agent-compatible format
 */
function convertEnhancedContextToAgentFormat(enhancedContext: any): any {
  // If already in legacy format, return as-is
  if (enhancedContext.papers || enhancedContext.notebooks) {
    return enhancedContext;
  }
  
  // Convert EnhancedRAGSystem format to legacy format for agent compatibility
  const converted: any = {
    user: enhancedContext.user,
    papers: [],
    notebooks: [],
    protocols: [],
    experiments: [],
    relevantContent: []
  };
  
  // Convert weighted results to legacy format
  enhancedContext.weightedResults?.forEach((result: any) => {
    const item = {
      type: result.source,
      id: result.metadata?.id,
      title: result.metadata?.title || 'Untitled',
      content: result.content,
      similarity: result.relevanceScore
    };
    
    switch (result.source) {
      case 'paper':
        converted.papers.push({ id: item.id, title: item.title, abstract: item.content });
        break;
      case 'lab_notebook_entry':
        converted.notebooks.push({ id: item.id, title: item.title, content: item.content });
        break;
      case 'protocol':
        converted.protocols.push({ id: item.id, title: item.title, description: item.content });
        break;
      case 'experiment':
        converted.experiments.push({ id: item.id, title: item.title, description: item.content });
        break;
      default:
        converted.relevantContent.push(item);
    }
  });
  
  return converted;
}

/**
 * Build enhanced context string with citations and structured formatting
 * Includes weighted results from EnhancedRAGSystem with relevance scores
 */
function buildContextString(userContext: any, parameters: any): string {
  const parts: string[] = [];
  
  // User profile information
  if (userContext.user) {
    parts.push(`## User Profile`);
    parts.push(`Name: ${userContext.user.first_name || ''} ${userContext.user.last_name || ''}`);
    if (userContext.user.current_institution) {
      parts.push(`Institution: ${userContext.user.current_institution}`);
    }
    if (userContext.user.research_interests) {
      parts.push(`Research Interests: ${userContext.user.research_interests}`);
    }
    parts.push(''); // Empty line for spacing
  }

  // Enhanced personalization data
  if (userContext.researchInterests && userContext.researchInterests.length > 0) {
    parts.push(`## Research Focus Areas`);
    userContext.researchInterests.forEach((interest: string) => {
      parts.push(`- ${interest}`);
    });
    parts.push('');
  }

  // Active projects
  if (userContext.activeProjects && userContext.activeProjects.length > 0) {
    parts.push(`## Active Research Projects`);
    userContext.activeProjects.slice(0, 3).forEach((project: any) => {
      parts.push(`- **${project.title}**: ${project.description || 'No description'}`);
    });
    parts.push('');
  }

  // Recent protocols
  if (userContext.recentProtocols && userContext.recentProtocols.length > 0) {
    parts.push(`## Recent Protocols`);
    userContext.recentProtocols.slice(0, 3).forEach((protocol: any) => {
      parts.push(`- ${protocol.title} (${protocol.category || 'General'})`);
    });
    parts.push('');
  }

  // Interaction patterns
  if (userContext.interactionPatterns) {
    const patterns = userContext.interactionPatterns;
    if (patterns.commonTopics && patterns.commonTopics.length > 0) {
      parts.push(`## Common Research Topics`);
      parts.push(patterns.commonTopics.slice(0, 5).join(', '));
      parts.push('');
    }
  }
  
  // Task-specific parameters
  if (parameters.topic) {
    parts.push(`## Query Topic: ${parameters.topic}`);
    parts.push('');
  }
  
  // Enhanced RAG results with citations
  if (userContext.weightedResults && userContext.weightedResults.length > 0) {
    parts.push(`## Relevant Research Context (Ranked by Relevance)`);
    userContext.weightedResults.slice(0, 5).forEach((item: any, idx: number) => {
      const relevancePercent = (item.relevanceScore * 100).toFixed(0);
      const sourceType = item.source === 'paper' ? '📄 Paper' : 
                        item.source === 'lab_notebook_entry' ? '📓 Lab Notebook' :
                        item.source === 'protocol' ? '🔬 Protocol' :
                        item.source === 'experiment' ? '🧪 Experiment' : '📑 Document';
      
      parts.push(`\n[${idx + 1}] ${sourceType}: **${item.metadata?.title || 'Untitled'}**`);
      parts.push(`   Relevance: ${relevancePercent}% | Source: ${item.source}`);
      parts.push(`   ${item.content?.substring(0, 300)}${item.content?.length > 300 ? '...' : ''}`);
      
      // Add metadata if available
      if (item.metadata?.journal) {
        parts.push(`   Journal: ${item.metadata.journal}${item.metadata.year ? ` (${item.metadata.year})` : ''}`);
      }
      if (item.metadata?.id) {
        parts.push(`   ID: ${item.metadata.id}`);
      }
    });
    parts.push('');
  } else if (userContext.relevantContent && userContext.relevantContent.length > 0) {
    parts.push(`## Relevant Research Context`);
    userContext.relevantContent.slice(0, 5).forEach((item: any, idx: number) => {
      parts.push(`\n[${idx + 1}] **${item.title || 'Untitled'}**`);
      parts.push(`   ${item.content?.substring(0, 300)}${item.content?.length > 300 ? '...' : ''}`);
      if (item.similarity) {
        parts.push(`   Similarity: ${(item.similarity * 100).toFixed(0)}%`);
      }
    });
    parts.push('');
  }
  
  // Add instruction for using context
  if (parts.length > 0) {
    parts.push(`\n---\n**Instructions:** Use the above context to provide personalized, relevant responses. When referencing specific items, cite them using [1], [2], etc.`);
  }
  
  return parts.join('\n');
}

// ==============================================
// INDIVIDUAL TASK HANDLERS - Enhanced with Context
// ==============================================

async function handlePaperFinding(
  message: string, 
  context: any, 
  parameters: any,
  contextString: string
): Promise<string> {
  const topic = parameters.topic || message.replace(/find|papers?|on|about/gi, '').trim();
  
  // TODO: Phase 2.4 - Implement full PaperFindingAgent with multi-database search
  // For now, return intelligent response with context awareness
  
  let response = `I'll help you find papers on "${topic}".\n\n`;
  
  if (context.relevantContent && context.relevantContent.length > 0) {
    response += `Based on your research history, I found ${context.relevantContent.length} relevant items. `;
  }
  
  response += `I'm searching multiple databases (PubMed, arXiv, CrossRef) and will return curated results with summaries.\n\n`;
  response += `**This feature is being enhanced** - Soon I'll:\n`;
  response += `• Search across multiple databases\n`;
  response += `• Rank by relevance to your research\n`;
  response += `• Provide AI-generated summaries\n`;
  response += `• Filter by date, citations, and impact`;
  
  return response;
}

async function handleAbstractWriting(
  message: string, 
  context: any, 
  parameters: any,
  contextString: string
): Promise<string> {
  // TODO: Phase 2.5 - Implement AbstractWritingAgent
  let response = `I'll help you write an abstract.\n\n`;
  
  if (context.notebooks && context.notebooks.length > 0) {
    response += `I found ${context.notebooks.length} Personal NoteBook entries that I can use as context. `;
  }
  
  if (context.relevantContent && context.relevantContent.length > 0) {
    response += `I also have ${context.relevantContent.length} relevant research items.\n\n`;
  }
  
  response += `**This feature is being enhanced** - Soon I'll:\n`;
  response += `• Analyze your experimental data\n`;
  response += `• Extract key findings\n`;
  response += `• Generate structured abstract (Objective, Methods, Results, Conclusions)\n`;
  response += `• Ensure proper formatting and length`;
  
  return response;
}

async function handleIdeaGeneration(
  message: string, 
  context: any, 
  parameters: any,
  contextString: string
): Promise<string> {
  const field = parameters.topic || context.user?.research_interests || 'your field';
  
  let response = `I'll generate research ideas for ${field}.\n\n`;
  
  if (context.papers && context.papers.length > 0) {
    response += `I've reviewed your ${context.papers.length} papers and `;
  }
  
  if (context.notebooks && context.notebooks.length > 0) {
    response += `${context.notebooks.length} Personal NoteBook entries to identify research gaps.\n\n`;
  }
  
  response += `**This feature is being enhanced** - Soon I'll:\n`;
  response += `• Analyze your research history\n`;
  response += `• Identify knowledge gaps\n`;
  response += `• Generate novel hypotheses\n`;
  response += `• Prioritize by feasibility and impact`;
  
  return response;
}

async function handleProposalWriting(
  message: string, 
  context: any, 
  parameters: any,
  contextString: string
): Promise<string> {
  let response = `I'll help you write a research proposal.\n\n`;
  
  if (contextString) {
    response += `I have your research context ready to incorporate.\n\n`;
  }
  
  response += `**This feature is being enhanced** - Soon I'll:\n`;
  response += `• Generate comprehensive proposal structure\n`;
  response += `• Write sections based on your research\n`;
  response += `• Include budget planning\n`;
  response += `• Format according to grant requirements`;
  
  return response;
}

async function handleDataAnalysis(
  message: string, 
  context: any, 
  parameters: any,
  contextString: string
): Promise<string> {
  let response = `I'll analyze your experimental data.\n\n`;
  
  if (context.notebooks && context.notebooks.length > 0) {
    response += `I found ${context.notebooks.length} Personal NoteBook entries with experimental data.\n\n`;
  }
  
  response += `**This feature is being enhanced** - Soon I'll:\n`;
  response += `• Load and parse your experimental data\n`;
  response += `• Perform statistical analysis\n`;
  response += `• Generate visualizations\n`;
  response += `• Provide insights and interpretations`;
  
  return response;
}

// ==============================================
// COMPLEX WORKFLOW HANDLERS - Enhanced
// ==============================================

async function handlePaperGenerationWorkflow(
  message: string, 
  context: any,
  parameters: any,
  contextString: string
): Promise<string> {
  // TODO: Phase 3 - Implement PaperGenerationPipeline
  let response = `I'll generate a complete research paper from your data.\n\n`;
  
  if (context.notebooks && context.notebooks.length > 0) {
    response += `I found ${context.notebooks.length} Personal NoteBook entries to work with.\n\n`;
  }
  
  response += `**This complex workflow will:**\n`;
  response += `1. 📊 Read and analyze your experimental data\n`;
  response += `2. 📝 Write Introduction section\n`;
  response += `3. 🔬 Write Methods section\n`;
  response += `4. 📈 Write Results section with figures\n`;
  response += `5. 💭 Write Discussion section\n`;
  response += `6. 📚 Add references and citations\n`;
  response += `7. ✨ Format for publication\n\n`;
  response += `**Status:** This feature is being developed. You'll be able to generate complete papers automatically!`;
  
  return response;
}

async function handlePresentationGenerationWorkflow(
  message: string, 
  context: any,
  parameters: any,
  contextString: string
): Promise<string> {
  // TODO: Phase 3 - Implement PresentationGenerationPipeline
  let response = `I'll create a presentation from your research.\n\n`;
  
  if (context.papers && context.papers.length > 0) {
    response += `I'll use your ${context.papers.length} papers and research data.\n\n`;
  }
  
  response += `**This complex workflow will:**\n`;
  response += `1. 🔍 Extract key findings from your research\n`;
  response += `2. 📄 Generate slide content\n`;
  response += `3. 📊 Create visualizations and figures\n`;
  response += `4. 🎨 Format slides professionally\n`;
  response += `5. 📝 Add speaker notes\n\n`;
  response += `**Status:** This feature is being developed. You'll be able to generate complete presentations automatically!`;
  
  return response;
}

async function handleGeneralResearch(
  message: string, 
  context: any,
  parameters: any,
  contextString: string
): Promise<string> {
  const userName = context.user?.first_name || 'there';
  let response = `Hello ${userName}! 👋\n\n`;
  
  if (context.relevantContent && context.relevantContent.length > 0) {
    response += `I've reviewed your research and found ${context.relevantContent.length} relevant items.\n\n`;
  }
  
  response += `I'm your AI Research Agent. I can help you with:\n\n`;
  response += `• 🔍 Finding and analyzing papers\n`;
  response += `• ✍️ Writing abstracts, proposals, and papers\n`;
  response += `• 💡 Generating research ideas\n`;
  response += `• 📊 Analyzing experimental data\n`;
  response += `• 📽️ Creating presentations\n\n`;
  response += `Just ask me anything about your research!`;
  
  return response;
}

export default router;

