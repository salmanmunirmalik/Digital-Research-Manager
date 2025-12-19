/**
 * Agent Communication Protocol
 * Task 24: Add agent communication protocols
 * 
 * Defines standardized protocols for agent-to-agent communication:
 * - Message formats
 * - Communication patterns (request-response, pub-sub, etc.)
 * - Protocol handlers
 * - Message routing
 */

import { AgentMessage } from './MultiAgentSystem.js';
import { EventEmitter } from 'events';

export type CommunicationPattern = 
  | 'request-response'
  | 'publish-subscribe'
  | 'broadcast'
  | 'direct'
  | 'routed';

export interface ProtocolMessage extends AgentMessage {
  protocol: CommunicationPattern;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  ttl?: number; // Time to live in milliseconds
  retryCount?: number;
  maxRetries?: number;
}

export interface RequestResponseMessage extends ProtocolMessage {
  protocol: 'request-response';
  requestId: string;
  expectsResponse: boolean;
  timeout?: number;
}

export interface PublishSubscribeMessage extends ProtocolMessage {
  protocol: 'publish-subscribe';
  topic: string;
  subscribers?: string[];
}

export interface BroadcastMessage extends ProtocolMessage {
  protocol: 'broadcast';
  scope?: 'all' | 'capability' | 'expertise';
  filter?: {
    capabilities?: string[];
    expertise?: string[];
    availability?: string[];
  };
}

export interface RoutedMessage extends ProtocolMessage {
  protocol: 'routed';
  route: string[]; // Path of agents to route through
  currentHop: number;
}

export class AgentCommunicationProtocol extends EventEmitter {
  private pendingRequests: Map<string, {
    request: RequestResponseMessage;
    timestamp: number;
    timeout: NodeJS.Timeout;
    resolve: (response: ProtocolMessage) => void;
    reject: (error: Error) => void;
  }> = new Map();
  
  private subscribers: Map<string, Set<string>> = new Map(); // topic -> agent types
  private messageHandlers: Map<CommunicationPattern, (message: ProtocolMessage) => Promise<ProtocolMessage | void>> = new Map();
  
  constructor() {
    super();
    this.initializeHandlers();
  }
  
  /**
   * Initialize protocol handlers
   */
  private initializeHandlers(): void {
    this.messageHandlers.set('request-response', async (msg: ProtocolMessage) => {
      await this.handleRequestResponse(msg as RequestResponseMessage);
    });
    this.messageHandlers.set('publish-subscribe', async (msg: ProtocolMessage) => {
      await this.handlePublishSubscribe(msg as PublishSubscribeMessage);
    });
    this.messageHandlers.set('broadcast', async (msg: ProtocolMessage) => {
      await this.handleBroadcast(msg as BroadcastMessage);
    });
    this.messageHandlers.set('direct', async (msg: ProtocolMessage) => {
      await this.handleDirect(msg);
    });
    this.messageHandlers.set('routed', async (msg: ProtocolMessage) => {
      await this.handleRouted(msg as RoutedMessage);
    });
  }
  
  /**
   * Send message using specified protocol
   */
  async sendMessage(message: ProtocolMessage): Promise<ProtocolMessage | void> {
    const handler = this.messageHandlers.get(message.protocol);
    if (!handler) {
      throw new Error(`Unknown protocol: ${message.protocol}`);
    }
    
    // Validate message
    this.validateMessage(message);
    
    // Handle message based on protocol
    return await handler(message);
  }
  
  /**
   * Handle request-response pattern
   */
  private async handleRequestResponse(message: RequestResponseMessage): Promise<ProtocolMessage> {
    if (message.type === 'request' && message.expectsResponse) {
      // Store pending request
      return new Promise((resolve, reject) => {
        const timeout = message.timeout || 30000; // Default 30 seconds
        const timeoutId = setTimeout(() => {
          this.pendingRequests.delete(message.requestId);
          reject(new Error(`Request ${message.requestId} timed out`));
        }, timeout);
        
        this.pendingRequests.set(message.requestId, {
          request: message,
          timestamp: Date.now(),
          timeout: timeoutId,
          resolve: (response: ProtocolMessage) => {
            clearTimeout(timeoutId);
            resolve(response);
          },
          reject: (error: Error) => {
            clearTimeout(timeoutId);
            reject(error);
          }
        });
        
        // Emit request event
        this.emit('request:sent', message);
      });
    } else if (message.type === 'response') {
      // Handle response
      const pending = this.pendingRequests.get(message.correlationId || '');
      if (pending) {
        this.pendingRequests.delete(message.correlationId || '');
        pending.resolve(message);
        this.emit('response:received', message);
        return message;
      } else {
        throw new Error(`No pending request found for correlation ID: ${message.correlationId}`);
      }
    }
    
    return message;
  }
  
  /**
   * Handle publish-subscribe pattern
   */
  private async handlePublishSubscribe(message: PublishSubscribeMessage): Promise<void> {
    if (message.type === 'notification') {
      // Publish to all subscribers
      const subscribers = this.subscribers.get(message.topic) || new Set();
      
      subscribers.forEach(subscriber => {
        this.emit('message:published', {
          ...message,
          to: subscriber
        });
      });
      
      this.emit('publish:completed', { topic: message.topic, subscribers: Array.from(subscribers) });
    }
  }
  
  /**
   * Subscribe to a topic
   */
  subscribe(agentType: string, topic: string): void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    
    this.subscribers.get(topic)!.add(agentType);
    this.emit('subscription:created', { agentType, topic });
  }
  
  /**
   * Unsubscribe from a topic
   */
  unsubscribe(agentType: string, topic: string): void {
    const subscribers = this.subscribers.get(topic);
    if (subscribers) {
      subscribers.delete(agentType);
      if (subscribers.size === 0) {
        this.subscribers.delete(topic);
      }
      this.emit('subscription:removed', { agentType, topic });
    }
  }
  
  /**
   * Handle broadcast pattern
   */
  private async handleBroadcast(message: BroadcastMessage): Promise<void> {
    // Broadcast message based on scope and filters
    this.emit('broadcast:sent', message);
    
    // Filter logic would be applied here
    if (message.scope === 'all') {
      this.emit('broadcast:all', message);
    } else if (message.scope === 'capability' && message.filter?.capabilities) {
      this.emit('broadcast:capability', { message, capabilities: message.filter.capabilities });
    } else if (message.scope === 'expertise' && message.filter?.expertise) {
      this.emit('broadcast:expertise', { message, expertise: message.filter.expertise });
    }
  }
  
  /**
   * Handle direct pattern
   */
  private async handleDirect(message: ProtocolMessage): Promise<void> {
    // Direct message to specific agent
    if (message.to && message.to !== 'broadcast') {
      this.emit('message:direct', message);
    } else {
      throw new Error('Direct message must have a specific target');
    }
  }
  
  /**
   * Handle routed pattern
   */
  private async handleRouted(message: RoutedMessage): Promise<void> {
    if (message.route.length === 0) {
      throw new Error('Routed message must have a route');
    }
    
    const currentHop = message.currentHop || 0;
    if (currentHop >= message.route.length) {
      // Reached destination
      this.emit('routed:arrived', message);
      return;
    }
    
    // Route to next hop
    const nextHop = message.route[currentHop];
    const updatedMessage: RoutedMessage = {
      ...message,
      to: nextHop,
      currentHop: currentHop + 1
    };
    
    this.emit('routed:forward', updatedMessage);
  }
  
  /**
   * Create request message
   */
  createRequest(
    from: string,
    to: string,
    content: any,
    options?: {
      timeout?: number;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      ttl?: number;
    }
  ): RequestResponseMessage {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      from,
      to,
      type: 'request',
      content,
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol: 'request-response',
      requestId,
      expectsResponse: true,
      timeout: options?.timeout || 30000,
      priority: options?.priority || 'medium',
      ttl: options?.ttl
    };
  }
  
  /**
   * Create response message
   */
  createResponse(
    from: string,
    to: string,
    requestId: string,
    content: any,
    success: boolean = true
  ): RequestResponseMessage {
    return {
      from,
      to,
      type: 'response',
      content: { success, result: content },
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      correlationId: requestId,
      protocol: 'request-response',
      requestId,
      expectsResponse: false
    };
  }
  
  /**
   * Create publish message
   */
  createPublish(
    from: string,
    topic: string,
    content: any,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      ttl?: number;
    }
  ): PublishSubscribeMessage {
    return {
      from,
      to: 'broadcast',
      type: 'notification',
      content,
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol: 'publish-subscribe',
      topic,
      priority: options?.priority || 'medium',
      ttl: options?.ttl
    };
  }
  
  /**
   * Create broadcast message
   */
  createBroadcast(
    from: string,
    content: any,
    options?: {
      scope?: 'all' | 'capability' | 'expertise';
      filter?: {
        capabilities?: string[];
        expertise?: string[];
        availability?: string[];
      };
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      ttl?: number;
    }
  ): BroadcastMessage {
    return {
      from,
      to: 'broadcast',
      type: 'notification',
      content,
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol: 'broadcast',
      scope: options?.scope || 'all',
      filter: options?.filter,
      priority: options?.priority || 'medium',
      ttl: options?.ttl
    };
  }
  
  /**
   * Create routed message
   */
  createRouted(
    from: string,
    route: string[],
    content: any,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      ttl?: number;
    }
  ): RoutedMessage {
    if (route.length === 0) {
      throw new Error('Route must contain at least one agent');
    }
    
    return {
      from,
      to: route[0],
      type: 'request',
      content,
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol: 'routed',
      route,
      currentHop: 0,
      priority: options?.priority || 'medium',
      ttl: options?.ttl
    };
  }
  
  /**
   * Validate message format
   */
  private validateMessage(message: ProtocolMessage): void {
    if (!message.from) {
      throw new Error('Message must have a sender (from)');
    }
    
    if (!message.to && message.protocol !== 'broadcast' && message.protocol !== 'publish-subscribe') {
      throw new Error('Message must have a recipient (to)');
    }
    
    if (!message.content) {
      throw new Error('Message must have content');
    }
    
    // Protocol-specific validation
    switch (message.protocol) {
      case 'request-response':
        if (message.type === 'request' && !(message as RequestResponseMessage).requestId) {
          throw new Error('Request message must have requestId');
        }
        break;
      
      case 'publish-subscribe':
        if (!(message as PublishSubscribeMessage).topic) {
          throw new Error('Publish-subscribe message must have topic');
        }
        break;
      
      case 'routed':
        const routed = message as RoutedMessage;
        if (!routed.route || routed.route.length === 0) {
          throw new Error('Routed message must have a route');
        }
        break;
    }
  }
  
  /**
   * Get pending requests
   */
  getPendingRequests(): string[] {
    return Array.from(this.pendingRequests.keys());
  }
  
  /**
   * Cancel pending request
   */
  cancelRequest(requestId: string): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(requestId);
      pending.reject(new Error(`Request ${requestId} was cancelled`));
      return true;
    }
    return false;
  }
  
  /**
   * Get subscribers for a topic
   */
  getSubscribers(topic: string): string[] {
    return Array.from(this.subscribers.get(topic) || []);
  }
  
  /**
   * Get all topics
   */
  getAllTopics(): string[] {
    return Array.from(this.subscribers.keys());
  }
}

// Singleton instance
export const agentCommunicationProtocol = new AgentCommunicationProtocol();

