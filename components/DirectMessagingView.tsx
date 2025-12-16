/**
 * Direct Messaging View - ClickUp-inspired
 * Integrated into Teams section of Lab Workspace
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  PhoneIcon,
  EllipsisVerticalIcon,
  StarIcon,
  ClockIcon
} from './icons';

interface TeamMember {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  last_seen?: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  is_edited?: boolean;
  edited_at?: string;
}

interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_participant?: TeamMember;
}

interface DirectMessagingViewProps {
  teamMembers: TeamMember[];
  onBack?: () => void;
}

const DirectMessagingView: React.FC<DirectMessagingViewProps> = ({
  teamMembers,
  onBack
}) => {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'calendar' | 'tasks'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Fetch user's direct message conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id);
    }
  }, [conversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/conversations?type=direct', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Enrich conversations with participant info
      const enrichedConversations = await Promise.all(
        response.data.map(async (conv: any) => {
          // Get other participant
          const participantsResponse = await axios.get(`/api/conversations/${conv.id}/participants`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: [] }));

          const otherParticipant = participantsResponse.data.find((p: any) => p.user_id !== user?.id);
          if (otherParticipant) {
            const member = teamMembers.find(m => (m.user_id || m.id) === otherParticipant.user_id);
            return {
              ...conv,
              other_participant: member || {
                id: otherParticipant.user_id,
                name: otherParticipant.name || 'Unknown',
                email: otherParticipant.email || ''
              }
            };
          }
          return conv;
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Enrich messages with sender info
      const enrichedMessages = response.data.map((msg: any) => ({
        ...msg,
        sender_name: msg.sender_name || 'Unknown',
        sender_avatar: teamMembers.find(m => (m.user_id || m.id) === msg.sender_id)?.avatar_url
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const findOrCreateConversation = async (member: TeamMember) => {
    try {
      const token = localStorage.getItem('token');
      const memberUserId = member.user_id || member.id;

      // Check if conversation already exists
      const existingConvs = await axios.get('/api/conversations?type=direct', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Find existing direct conversation with this member
      let existingConv = null;
      for (const conv of existingConvs.data) {
        const participantsResponse = await axios.get(`/api/conversations/${conv.id}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }));

        const hasMember = participantsResponse.data.some((p: any) => p.user_id === memberUserId);
        const hasCurrentUser = participantsResponse.data.some((p: any) => p.user_id === user?.id);
        
        if (hasMember && hasCurrentUser && participantsResponse.data.length === 2) {
          existingConv = conv;
          break;
        }
      }

      if (existingConv) {
        setConversation({
          ...existingConv,
          other_participant: member
        });
        return existingConv.id;
      }

      // Create new direct conversation
      const createResponse = await axios.post('/api/conversations', {
        type: 'direct',
        participant_ids: [memberUserId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newConv = createResponse.data;
      setConversation({
        ...newConv,
        other_participant: member
      });
      return newConv.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      // If endpoint doesn't exist, create conversation manually
      return null;
    }
  };

  const handleSelectMember = async (member: TeamMember) => {
    setSelectedMember(member);
    await findOrCreateConversation(member);
    setActiveTab('chat');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversation?.id) return;

    const messageContent = messageInput.trim();
    setMessageInput('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/conversations/${conversation.id}/messages`, {
        content: messageContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add message to local state
      const newMessage: Message = {
        ...response.data,
        sender_name: user?.username || 'You',
        sender_avatar: user?.avatar_url
      };
      setMessages(prev => [...prev, newMessage]);

      // Update conversation list
      await fetchConversations();
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setMessageInput(messageContent); // Restore message on error
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.role?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
      'bg-teal-500', 'bg-orange-500', 'bg-red-500', 'bg-green-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Team Members List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Direct Messages</h2>
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600"
                title="Back to Teams"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Team Members List */}
        <div className="flex-1 overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No team members found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                const conv = conversations.find(c => c.other_participant?.id === member.id);
                
                return (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white text-sm font-medium`}>
                            {getInitials(member.name)}
                          </div>
                        )}
                        {member.status === 'online' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.name}
                          </p>
                          {conv?.unread_count && conv.unread_count > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv?.last_message && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {conv.last_message}
                          </p>
                        )}
                        {member.role && !conv?.last_message && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {member.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedMember ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {selectedMember.avatar_url ? (
                    <img
                      src={selectedMember.avatar_url}
                      alt={selectedMember.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedMember.name)} flex items-center justify-center text-white font-medium`}>
                      {getInitials(selectedMember.name)}
                    </div>
                  )}

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedMember.name}</h2>
                    {selectedMember.status && (
                      <p className="text-xs text-gray-500 capitalize">{selectedMember.status}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <StarIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 mt-4 border-b border-gray-200 -mb-4">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'chat'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'calendar'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'tasks'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  {selectedMember.name}'s Assigned Tasks
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {activeTab === 'chat' && (
              <>
                {/* Conversation Start Info */}
                {messages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md px-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Chat with {selectedMember.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        This conversation started on {new Date().toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}.
                      </p>

                      {/* Suggested Actions */}
                      <div className="space-y-3">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">View Profile</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                          <CalendarIcon className="w-5 h-5 text-red-400" />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 block">View Calendar</span>
                            <span className="text-xs text-gray-500">Find time to meet or just grab some coffee</span>
                          </div>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                          <VideoCameraIcon className="w-5 h-5 text-green-400" />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 block">Start SyncUp</span>
                            <span className="text-xs text-gray-500">Jump on a voice call or video call</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.length > 0 && (
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                      <div key={date}>
                        {/* Date Separator */}
                        <div className="flex items-center justify-center my-4">
                          <div className="flex items-center gap-2">
                            <div className="h-px bg-gray-200 flex-1 w-20"></div>
                            <span className="text-xs text-gray-500 px-2">
                              {new Date(date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                            <div className="h-px bg-gray-200 flex-1 w-20"></div>
                          </div>
                        </div>

                        {/* Messages for this date */}
                        {dateMessages.map((message, index) => {
                          const isCurrentUser = message.sender_id === user?.id;
                          const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                          const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
                          const timeDiff = prevMessage 
                            ? new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()
                            : Infinity;
                          const showTime = !prevMessage || timeDiff > 300000; // 5 minutes

                          return (
                            <div
                              key={message.id}
                              className={`flex gap-3 mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              {!isCurrentUser && showAvatar && (
                                <div className="flex-shrink-0">
                                  {message.sender_avatar ? (
                                    <img
                                      src={message.sender_avatar}
                                      alt={message.sender_name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(message.sender_name)} flex items-center justify-center text-white text-xs font-medium`}>
                                      {getInitials(message.sender_name)}
                                    </div>
                                  )}
                                </div>
                              )}
                              {!isCurrentUser && !showAvatar && <div className="w-8"></div>}

                              <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                {showTime && (
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-700">
                                      {isCurrentUser ? 'You' : message.sender_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatMessageTime(message.created_at)}
                                    </span>
                                  </div>
                                )}
                                <div
                                  className={`rounded-lg px-4 py-2 ${
                                    isCurrentUser
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white border border-gray-200 text-gray-900'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                  {message.is_edited && (
                                    <p className="text-xs mt-1 opacity-75">(edited)</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Input */}
                <div className="bg-white border-t border-gray-200 px-6 py-4">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder={`Write to ${selectedMember.name}, press 'space' for AI, '/' for commands`}
                        rows={1}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32"
                        style={{ minHeight: '44px' }}
                      />
                      <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                          title="Attach file"
                        >
                          <PaperClipIcon className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                          title="Add emoji"
                        >
                          <FaceSmileIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send message"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar</h3>
                  <p className="text-sm text-gray-500">Calendar integration coming soon</p>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Assigned Tasks</h3>
                  <p className="text-sm text-gray-500">Task assignments for {selectedMember.name} coming soon</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a team member</h3>
              <p className="text-sm text-gray-500">Choose someone from the list to start a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessagingView;


