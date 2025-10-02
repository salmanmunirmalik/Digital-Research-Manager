import { useState, useEffect, useCallback } from 'react';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'owner';
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface CollaborationSession {
  id: string;
  presentationId: string;
  collaborators: Collaborator[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLink {
  id: string;
  presentationId: string;
  token: string;
  permissions: 'view' | 'edit';
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  createdAt: string;
}

class CollaborationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async createCollaborationSession(presentationId: string): Promise<CollaborationSession> {
    try {
      const response = await fetch('/api/presentations/collaboration/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ presentationId })
      });

      if (!response.ok) {
        throw new Error('Failed to create collaboration session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating collaboration session:', error);
      throw error;
    }
  }

  async inviteCollaborator(sessionId: string, email: string, role: 'viewer' | 'editor'): Promise<void> {
    try {
      const response = await fetch('/api/presentations/collaboration/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ sessionId, email, role })
      });

      if (!response.ok) {
        throw new Error('Failed to invite collaborator');
      }
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      throw error;
    }
  }

  async createShareLink(presentationId: string, permissions: 'view' | 'edit', expiresAt?: string): Promise<ShareLink> {
    try {
      const response = await fetch('/api/presentations/collaboration/share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ presentationId, permissions, expiresAt })
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating share link:', error);
      throw error;
    }
  }

  async joinCollaborationSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`/api/presentations/collaboration/session/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to join collaboration session');
      }
    } catch (error) {
      console.error('Error joining collaboration session:', error);
      throw error;
    }
  }

  async leaveCollaborationSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`/api/presentations/collaboration/session/${sessionId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to leave collaboration session');
      }
    } catch (error) {
      console.error('Error leaving collaboration session:', error);
      throw error;
    }
  }

  connectWebSocket(sessionId: string, onMessage: (message: any) => void): void {
    try {
      const wsUrl = `ws://localhost:5002/ws/collaboration/${sessionId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect(sessionId, onMessage);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  }

  private attemptReconnect(sessionId: string, onMessage: (message: any) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connectWebSocket(sessionId, onMessage);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  sendMessage(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private getAuthToken(): string {
    return localStorage.getItem('token') || '';
  }

  async getCollaborationHistory(presentationId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/presentations/collaboration/history/${presentationId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get collaboration history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting collaboration history:', error);
      return [];
    }
  }

  async updateCollaboratorRole(sessionId: string, collaboratorId: string, role: 'viewer' | 'editor' | 'owner'): Promise<void> {
    try {
      const response = await fetch('/api/presentations/collaboration/update-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ sessionId, collaboratorId, role })
      });

      if (!response.ok) {
        throw new Error('Failed to update collaborator role');
      }
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      throw error;
    }
  }

  async removeCollaborator(sessionId: string, collaboratorId: string): Promise<void> {
    try {
      const response = await fetch('/api/presentations/collaboration/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ sessionId, collaboratorId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove collaborator');
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  async revokeShareLink(linkId: string): Promise<void> {
    try {
      const response = await fetch(`/api/presentations/collaboration/share-link/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to revoke share link');
      }
    } catch (error) {
      console.error('Error revoking share link:', error);
      throw error;
    }
  }
}

export const collaborationService = new CollaborationService();

// React Hook for Collaboration
export const useCollaboration = (sessionId?: string) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const connect = useCallback(() => {
    if (!sessionId) return;

    collaborationService.connectWebSocket(sessionId, (message) => {
      switch (message.type) {
        case 'collaborator_joined':
          setCollaborators(prev => [...prev, message.data.collaborator]);
          break;
        case 'collaborator_left':
          setCollaborators(prev => prev.filter(c => c.id !== message.data.collaboratorId));
          break;
        case 'collaborator_updated':
          setCollaborators(prev => 
            prev.map(c => c.id === message.data.collaboratorId 
              ? { ...c, ...message.data.updates }
              : c
            )
          );
          break;
        case 'slide_updated':
          // Handle slide updates
          break;
        case 'cursor_moved':
          // Handle cursor position updates
          break;
        case 'selection_changed':
          // Handle text selection updates
          break;
        case 'chat_message':
          setMessages(prev => [...prev, message.data]);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    });

    setIsConnected(true);
  }, [sessionId]);

  const disconnect = useCallback(() => {
    collaborationService.disconnect();
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    collaborationService.sendMessage(type, data);
  }, []);

  const inviteCollaborator = useCallback(async (email: string, role: 'viewer' | 'editor') => {
    if (!sessionId) return;
    await collaborationService.inviteCollaborator(sessionId, email, role);
  }, [sessionId]);

  const updateCollaboratorRole = useCallback(async (collaboratorId: string, role: 'viewer' | 'editor' | 'owner') => {
    if (!sessionId) return;
    await collaborationService.updateCollaboratorRole(sessionId, collaboratorId, role);
  }, [sessionId]);

  const removeCollaborator = useCallback(async (collaboratorId: string) => {
    if (!sessionId) return;
    await collaborationService.removeCollaborator(sessionId, collaboratorId);
  }, [sessionId]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    collaborators,
    isConnected,
    currentUser,
    messages,
    connect,
    disconnect,
    sendMessage,
    inviteCollaborator,
    updateCollaboratorRole,
    removeCollaborator
  };
};

export default CollaborationService;
