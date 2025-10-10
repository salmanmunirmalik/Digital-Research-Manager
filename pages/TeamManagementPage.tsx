import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  XMarkIcon
} from '../components/icons';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  type: 'group' | 'direct';
  participants: number;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  avatar?: string;
}

const TeamManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'group' | 'direct'>('group');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [activeTab]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockConversations: Conversation[] = [
        {
          id: '1',
          name: 'Lab Team Discussion',
          type: 'group',
          participants: 12,
          last_message: 'Great progress on the experiment!',
          last_message_time: '2024-01-15T14:30:00Z',
          unread_count: 3
        },
        {
          id: '2',
          name: 'Research Project Alpha',
          type: 'group',
          participants: 8,
          last_message: 'Meeting scheduled for tomorrow at 3 PM',
          last_message_time: '2024-01-15T13:15:00Z',
          unread_count: 0
        },
        {
          id: '3',
          name: 'Dr. Sarah Johnson',
          type: 'direct',
          participants: 2,
          last_message: 'Thanks for the feedback on my paper',
          last_message_time: '2024-01-15T12:00:00Z',
          unread_count: 1
        },
        {
          id: '4',
          name: 'Dr. Michael Chen',
          type: 'direct',
          participants: 2,
          last_message: 'Can you review this protocol?',
          last_message_time: '2024-01-15T10:45:00Z',
          unread_count: 0
        }
      ];

      const filtered = mockConversations.filter(c => c.type === activeTab);
      setConversations(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Mock data - replace with actual API call
      const mockMessages: Message[] = [
        {
          id: '1',
          sender_id: '1',
          sender_name: 'Dr. Sarah Johnson',
          content: 'Hello everyone! I wanted to share some exciting results from our latest experiment.',
          timestamp: '2024-01-15T10:00:00Z',
          is_read: true
        },
        {
          id: '2',
          sender_id: user?.id || '2',
          sender_name: user?.username || 'You',
          content: 'That sounds great! Can you share more details?',
          timestamp: '2024-01-15T10:05:00Z',
          is_read: true
        },
        {
          id: '3',
          sender_id: '3',
          sender_name: 'Dr. Michael Chen',
          content: 'I agree, this could be a breakthrough!',
          timestamp: '2024-01-15T10:10:00Z',
          is_read: true
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const message: Message = {
        id: Date.now().toString(),
        sender_id: user?.id || '',
        sender_name: user?.username || 'You',
        content: newMessage,
        timestamp: new Date().toISOString(),
        is_read: false
      };

      setMessages([...messages, message]);
      setNewMessage('');

      // TODO: Send to API
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UsersIcon className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Team Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Communicate and collaborate with your team
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => {
                setActiveTab('group');
                setSelectedConversation(null);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'group'
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5" />
                <span>Group Messages</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('direct');
                setSelectedConversation(null);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'direct'
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Direct Messages</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700" style={{ height: 'calc(100vh - 300px)' }}>
            {/* Conversations List */}
            <div className="lg:col-span-1 flex flex-col">
              {/* Search and New Conversation */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New {activeTab === 'group' ? 'Group' : 'Message'}</span>
                </button>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No {activeTab === 'group' ? 'groups' : 'conversations'} yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {conv.name}
                              </h3>
                              {conv.unread_count > 0 && (
                                <span className="ml-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {activeTab === 'group' && `${conv.participants} members`}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {conv.last_message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatTime(conv.last_message_time)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="lg:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedConversation.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activeTab === 'group' 
                            ? `${selectedConversation.participants} members` 
                            : 'Direct message'}
                        </p>
                      </div>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                            {!isOwnMessage && (
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ml-1">
                                {message.sender_name}
                              </p>
                            )}
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwnMessage
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-1">
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-end space-x-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type your message..."
                        rows={3}
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PaperAirplaneIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Choose a {activeTab === 'group' ? 'group' : 'contact'} to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                New {activeTab === 'group' ? 'Group' : 'Message'}
              </h3>
              <button
                onClick={() => setShowNewConversation(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {activeTab === 'group' ? 'Group Name' : 'Select User'}
                </label>
                <input
                  type="text"
                  placeholder={activeTab === 'group' ? 'Enter group name...' : 'Search users...'}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagementPage;
