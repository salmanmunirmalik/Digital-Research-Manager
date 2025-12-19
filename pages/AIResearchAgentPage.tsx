/**
 * AI Research Agent Page
 * Simple chat interface that routes to user-configured APIs
 * Users control which APIs handle which tasks
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  SparklesIcon,
  ArrowUpIcon,
  PaperclipIcon,
  StopIcon,
  SettingsIcon,
  DocumentTextIcon,
  MicroscopeIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon
} from '../components/icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  apiUsed?: string; // Which API was used for this response
}

interface ApiKey {
  id: string;
  provider: string;
  provider_name: string;
  is_active: boolean;
}

interface TaskAssignment {
  id: string;
  task_type: string;
  task_name: string;
  provider: string;
  provider_name: string;
  priority: number;
  is_active: boolean;
}

const AIResearchAgentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Example prompts for quick start
  const examplePrompts = [
    "Find papers on CRISPR gene editing in cancer",
    "Write an abstract for my experiment on protein folding",
    "Generate research ideas for my field",
    "Create a paper from my experimental data",
    "Analyze my experimental results",
    "Write a research proposal for grant funding"
  ];

  // Check API setup on mount
  useEffect(() => {
    checkApiSetup();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // No welcome message - start with empty chat

  // Check API setup
  const checkApiSetup = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch API keys
      const keysResponse = await axios.get('/api/api-task-assignments/api-keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(keysResponse.data.apiKeys || []);
      
      // Fetch task assignments
      const assignmentsResponse = await axios.get('/api/api-task-assignments/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTaskAssignments(assignmentsResponse.data.assignments || []);
    } catch (error) {
      console.error('Error checking API setup:', error);
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    // Create assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please log in to use the AI Research Agent');
      }

      // Use non-streaming for now (can add streaming later with EventSource)
      const response = await axios.post(
        '/api/ai-research-agent/chat',
        {
          message: userMessage.content,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: false // Use non-streaming for now
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortControllerRef.current.signal
        }
      );

      // Handle response
      if (response.data) {
        const content = response.data.content || response.data.message || 'I received your message. Processing...';
        
        // Extract API info from response if available
        const apiUsed = response.data.apiUsed || response.data.provider || null;
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content, isStreaming: false, apiUsed }
            : msg
        ));
        
        // Refresh setup check to update status
        checkApiSetup();
      }
    } catch (error: any) {
      if (axios.isCancel(error)) {
        // Request was cancelled
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        return;
      }

      const errorMessage = error.response?.data?.error || 'Sorry, I encountered an error. Please try again.';
      
      // Check if error is about missing API assignment
      const isMissingAssignment = errorMessage.toLowerCase().includes('assigned') || 
                                   errorMessage.toLowerCase().includes('assignment');
      
      let errorContent = `❌ ${errorMessage}`;
      
      if (isMissingAssignment) {
        errorContent += `\n\n💡 **Quick Fix:**\n`;
        errorContent += `Go to Settings → API Task Assignments to configure your APIs for this task.`;
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: errorContent, isStreaming: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
  };

  // Handle quick action buttons - sends message directly to chat endpoint
  const handleQuickAction = async (message: string) => {
    if (isLoading || isExecutingWorkflow) return;
    
    if (apiKeys.length === 0) {
      navigate('/settings?tab=api-management');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    // Create assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please log in to use the AI Research Agent');
      }

      const response = await axios.post(
        '/api/ai-research-agent/chat',
        {
          message: message,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: false
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortControllerRef.current.signal
        }
      );

      // Handle response
      if (response.data) {
        const content = typeof response.data === 'string' 
          ? response.data 
          : response.data.content || response.data.message || 'I received your message. Processing...';
        
        // Extract API info from response if available
        const apiUsed = response.data.apiUsed || response.data.provider || null;
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content, isStreaming: false, apiUsed }
            : msg
        ));
      }
    } catch (error: any) {
      if (axios.isCancel(error)) {
        // Request was cancelled
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        return;
      }

      const errorMessage = error.response?.data?.error || 'Sorry, I encountered an error. Please try again.';
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `❌ ${errorMessage}`, isStreaming: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Handle workflow execution
  const handleWorkflowClick = async (workflowType: string, input?: any) => {
    if (isLoading || isExecutingWorkflow) return;
    
    if (apiKeys.length === 0) {
      navigate('/settings?tab=api-management');
      return;
    }

    setIsExecutingWorkflow(true);
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Execute ${workflowType} workflow`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const token = localStorage.getItem('token');
      
      let response;
      if (workflowType === 'paper-generation' || workflowType === 'experiment') {
        // Predefined workflow
        response = await axios.post(
          `/api/orchestrator/execute/${workflowType}`,
          { input: input || {} },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Individual agent
        response = await axios.post(
          `/api/agents/${workflowType}/execute`,
          { input: input || {}, config: {} },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        const result = response.data.result || response.data;
        let content = `✅ ${workflowType} completed successfully!\n\n`;
        
        if (result.content) {
          content += formatAgentResult(result.content, workflowType);
        } else if (result.synthesizedResult) {
          content += formatWorkflowResult(result.synthesizedResult);
        } else {
          content += JSON.stringify(result, null, 2);
        }

        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content, isStreaming: false }
            : msg
        ));
      } else {
        throw new Error(response.data.error || 'Workflow execution failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to execute workflow';
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: `❌ Error: ${errorMessage}`, isStreaming: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setIsExecutingWorkflow(false);
    }
  };

  // Format agent result for display
  const formatAgentResult = (content: any, agentType: string): string => {
    if (typeof content === 'string') return content;
    
    switch (agentType) {
      case 'paper_finding':
        if (content.papers) {
          return `Found ${content.papers.length} papers:\n\n${content.papers.map((p: any, i: number) => 
            `${i + 1}. ${p.title}\n   ${p.authors?.join(', ')}\n   Relevance: ${(p.relevanceScore * 100).toFixed(0)}%`
          ).join('\n\n')}`;
        }
        break;
      case 'abstract_writing':
        if (content.abstract) {
          return `Abstract:\n\n${content.abstract}\n\nWord count: ${content.wordCount || 'N/A'}`;
        }
        break;
      case 'idea_generation':
        if (content.ideas) {
          return `Generated ${content.ideas.length} research ideas:\n\n${content.ideas.map((idea: any, i: number) =>
            `${i + 1}. ${idea.title}\n   ${idea.description}\n   Feasibility: ${idea.feasibility} | Impact: ${idea.potentialImpact}`
          ).join('\n\n')}`;
        }
        break;
    }
    
    return JSON.stringify(content, null, 2);
  };

  // Format workflow result for display
  const formatWorkflowResult = (result: any): string => {
    if (result.tasks) {
      return `Workflow completed with ${result.tasks.length} tasks:\n\n${result.tasks.map((task: any, i: number) =>
        `${i + 1}. ${task.task}: ${task.success ? '✅' : '❌'}`
      ).join('\n')}`;
    }
    return JSON.stringify(result, null, 2);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header - Minimal, like Gemini */}
        {messages.length <= 1 && (
          <div className="px-6 pt-8 pb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">AI Research Agent</h1>
                  <p className="text-sm text-gray-500">Your intelligent research assistant</p>
                </div>
              </div>
              {/* API Status Indicator */}
              {!isCheckingSetup && (
                <div className="flex items-center space-x-2">
                  {apiKeys.length > 0 ? (
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium text-green-700">
                        {apiKeys.length} API{apiKeys.length > 1 ? 's' : ''} configured
                      </span>
                    </div>
                  ) : (
                      <button
                        onClick={() => navigate('/settings?tab=api-management')}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">Setup Required</span>
                      </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Area - Clean, spacious */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: `fadeIn 0.3s ease-in ${index * 0.1}s both` }}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-3xl px-5 py-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white shadow-sm hover:shadow-md transition-shadow'
                    : 'bg-gray-50 text-gray-900 border border-gray-100 hover:border-gray-200 transition-all'
                }`}
              >
                <div className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                  {message.content || (message.isStreaming && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  ))}
                </div>
                {message.isStreaming && message.content && (
                  <div className="mt-3 flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
                {/* Show which API was used */}
                {message.role === 'assistant' && message.apiUsed && !message.isStreaming && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Powered by <span className="font-medium">{message.apiUsed}</span>
                    </span>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600">
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
          ))}
          

          {/* Example prompts - Modern card design */}
          {messages.length <= 1 && apiKeys.length > 0 && !isCheckingSetup && (
            <div className="mt-12 space-y-4">
              <p className="text-sm font-medium text-gray-700 ml-11">Try asking:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                {examplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(prompt)}
                    className="group text-left px-5 py-4 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-sm text-gray-700 hover:text-gray-900"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
                        <SparklesIcon className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="flex-1">{prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Modern, like Gemini */}
        <div className="border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-4">
            <div className="relative">
              <div className={`flex items-end gap-3 bg-gray-50 rounded-3xl border-2 transition-all ${
                isLoading ? 'border-gray-200' : 'border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:shadow-lg'
              }`}>
                <div className="flex-1 px-5 py-4">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Ask me anything about your research..."
                    rows={1}
                    className="w-full bg-transparent border-0 focus:ring-0 resize-none text-gray-900 placeholder-gray-400 text-[15px] leading-relaxed"
                    style={{ 
                      minHeight: '24px', 
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center gap-2 px-4 pb-3">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="p-2.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Stop generation"
                    >
                      <StopIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="p-2.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                        title="Attach file"
                      >
                        <PaperclipIcon className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className={`p-2.5 rounded-full transition-all ${
                          input.trim() && !isLoading
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Send message"
                      >
                        <ArrowUpIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isLoading && (
                <div className="mt-2 ml-5 flex items-center space-x-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Processing your request...</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-center text-xs text-gray-400">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </form>
        </div>

        {/* Workflow Buttons - After input area */}
        {!isCheckingSetup && (
          <div className="border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto px-6 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick Actions</p>
                <button
                  onClick={() => navigate('/ai-agents-capabilities')}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <InformationCircleIcon className="w-4 h-4" />
                  <span>Learn about AI Agents</span>
                </button>
              </div>
              {apiKeys.length === 0 && (
                <p className="text-xs text-orange-600 mb-2">⚠️ Add API keys in Settings to use these features</p>
              )}
              <div className="flex flex-wrap gap-2">
                {/* Individual Agents - Use chat endpoint instead of workflow endpoints */}
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleQuickAction('Find papers on my research topic');
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                  <span>Find Papers</span>
                </button>
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleQuickAction('Write an abstract for my experiment');
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                  <span>Write Abstract</span>
                </button>
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleQuickAction('Generate research ideas for my field');
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LightBulbIcon className="w-4 h-4 text-yellow-600" />
                  <span>Generate Ideas</span>
                </button>
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleQuickAction('Write a research proposal for grant funding');
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 text-purple-600" />
                  <span>Write Proposal</span>
                </button>
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleQuickAction('Create a literature review on my research topic');
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentTextIcon className="w-4 h-4 text-green-600" />
                  <span>Literature Review</span>
                </button>
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleQuickAction('Design an experiment for my research question');
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MicroscopeIcon className="w-4 h-4 text-indigo-600" />
                  <span>Design Experiment</span>
                </button>
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleQuickAction('Analyze my experimental data and provide insights');
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MicroscopeIcon className="w-4 h-4 text-teal-600" />
                  <span>Analyze Data</span>
                </button>
                
                {/* Workflows */}
                <div className="w-full border-t border-gray-200 my-2"></div>
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleWorkflowClick('paper-generation', { researchQuestion: 'Research question', data: {} });
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>Paper Generation Workflow</span>
                </button>
                <button
                  onClick={() => {
                    if (apiKeys.length === 0) {
                      navigate('/settings?tab=api-management');
                    } else {
                      handleWorkflowClick('experiment', { researchQuestion: 'Research question', constraints: {} });
                    }
                  }}
                  disabled={isLoading || isExecutingWorkflow}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg hover:from-indigo-600 hover:to-blue-700 transition-all text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MicroscopeIcon className="w-4 h-4" />
                  <span>Experiment Workflow</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AIResearchAgentPage;

