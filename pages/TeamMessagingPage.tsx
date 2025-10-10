import React, { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  PlusIcon, 
  HashtagIcon, 
  LockClosedIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChevronDownIcon,
  FaceSmileIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  StarIcon,
  BellIcon,
  BellSlashIcon,
  XMarkIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct';
  isStarred: boolean;
  isMuted: boolean;
  unreadCount: number;
  lastMessageAt: Date;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  isEdited: boolean;
  reactions: { [emoji: string]: string[] };
  attachments?: Array<{ name: string; url: string; type: string }>;
  threadCount?: number;
}

interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  statusMessage?: string;
}

const TeamMessagingPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([
    { id: '1', name: 'general', description: 'General lab discussion', type: 'public', isStarred: true, isMuted: false, unreadCount: 3, lastMessageAt: new Date() },
    { id: '2', name: 'announcements', description: 'Important announcements', type: 'public', isStarred: false, isMuted: false, unreadCount: 0, lastMessageAt: new Date() },
    { id: '3', name: 'research-updates', description: 'Share research progress', type: 'public', isStarred: true, isMuted: false, unreadCount: 1, lastMessageAt: new Date() },
    { id: '4', name: 'lab-equipment', description: 'Equipment issues and bookings', type: 'private', isStarred: false, isMuted: false, unreadCount: 0, lastMessageAt: new Date() },
  ]);

  const [directMessages, setDirectMessages] = useState<UserPresence[]>([
    { id: '1', name: 'Dr. Sarah Johnson', status: 'online', statusMessage: 'In the lab' },
    { id: '2', name: 'John Doe', status: 'away', statusMessage: 'At lunch' },
    { id: '3', name: 'Jane Smith', status: 'offline' },
  ]);

  const [selectedChannel, setSelectedChannel] = useState<Channel>(channels[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: '1',
      userName: 'Dr. Sarah Johnson',
      content: 'Welcome to the team! 👋 Feel free to ask questions and share your ideas here.',
      timestamp: new Date(Date.now() - 3600000),
      isEdited: false,
      reactions: { '👍': ['2', '3'], '🎉': ['1'] },
    },
    {
      id: '2',
      userId: '2',
      userName: 'John Doe',
      content: 'Thanks! Excited to be here. Quick question - where can I find the lab protocols?',
      timestamp: new Date(Date.now() - 1800000),
      isEdited: false,
      reactions: {},
      threadCount: 2,
    },
    {
      id: '3',
      userId: '1',
      userName: 'Dr. Sarah Johnson',
      content: 'You can find all protocols in the Protocols section. I\'ll share the link with you.',
      timestamp: new Date(Date.now() - 900000),
      isEdited: false,
      reactions: { '✅': ['2'] },
    },
  ]);

  const [messageInput, setMessageInput] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'You',
      content: messageInput,
      timestamp: new Date(),
      isEdited: false,
      reactions: {},
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChannelStar = (channelId: string) => {
    setChannels(channels.map(ch => 
      ch.id === channelId ? { ...ch, isStarred: !ch.isStarred } : ch
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (hours < 1) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        {/* Team Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Research Lab</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">5 members online</span>
              </div>
            </div>
            <button className="text-slate-300 hover:text-white">
              <ChevronDownIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-700 border-0 rounded text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          {/* Starred Channels */}
          {channels.filter(ch => ch.isStarred).length > 0 && (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Starred</span>
              </div>
              {channels.filter(ch => ch.isStarred).map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded mb-0.5 ${
                    selectedChannel.id === channel.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {channel.type === 'private' ? (
                      <LockClosedIcon className="w-4 h-4" />
                    ) : (
                      <HashtagIcon className="w-4 h-4" />
                    )}
                    <span className="text-sm">{channel.name}</span>
                  </div>
                  {channel.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {channel.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* All Channels */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Channels</span>
              <button 
                onClick={() => setShowChannelModal(true)}
                className="text-slate-400 hover:text-white"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded mb-0.5 ${
                  selectedChannel.id === channel.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {channel.type === 'private' ? (
                    <LockClosedIcon className="w-4 h-4" />
                  ) : (
                    <HashtagIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm">{channel.name}</span>
                </div>
                {channel.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Direct Messages */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Direct Messages</span>
              <button className="text-slate-400 hover:text-white">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            {directMessages.map(user => (
              <button
                key={user.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded mb-0.5 text-slate-300 hover:bg-slate-700"
              >
                <div className="relative">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-xs font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(user.status)} rounded-full border-2 border-slate-800`}></div>
                </div>
                <span className="text-sm flex-1 text-left truncate">{user.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-semibold">
                Y
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">You</div>
              <div className="text-xs text-slate-400">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {selectedChannel.type === 'private' ? (
                <LockClosedIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <HashtagIcon className="w-5 h-5 text-gray-600" />
              )}
              <h2 className="text-lg font-bold text-gray-900">{selectedChannel.name}</h2>
            </div>
            <button
              onClick={() => toggleChannelStar(selectedChannel.id)}
              className="text-gray-400 hover:text-yellow-500"
            >
              {selectedChannel.isStarred ? (
                <StarIconSolid className="w-5 h-5 text-yellow-500" />
              ) : (
                <StarIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowUserList(!showUserList)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
            >
              <UserGroupIcon className="w-4 h-4" />
              <span className="text-sm">5 members</span>
            </button>
            <button className="text-gray-600 hover:text-gray-900">
              {selectedChannel.isMuted ? (
                <BellSlashIcon className="w-5 h-5" />
              ) : (
                <BellIcon className="w-5 h-5" />
              )}
            </button>
            <button className="text-gray-600 hover:text-gray-900">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            <button className="text-gray-600 hover:text-gray-900">
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Description */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Channel description:</span> {selectedChannel.description}
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
            const showTimestamp = showAvatar;

            return (
              <div key={message.id} className={`flex gap-3 group ${showAvatar ? 'mt-4' : ''}`}>
                {showAvatar ? (
                  <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {message.userName.charAt(0)}
                  </div>
                ) : (
                  <div className="w-10 flex-shrink-0"></div>
                )}

                <div className="flex-1">
                  {showTimestamp && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{message.userName}</span>
                      <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className="text-gray-800 text-sm leading-relaxed">
                    {message.content}
                    {message.isEdited && (
                      <span className="text-xs text-gray-500 ml-1">(edited)</span>
                    )}
                  </div>

                  {/* Reactions */}
                  {Object.keys(message.reactions).length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {Object.entries(message.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-xs"
                        >
                          <span>{emoji}</span>
                          <span className="text-blue-600 font-semibold">{users.length}</span>
                        </button>
                      ))}
                      <button className="px-2 py-1 text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-300 rounded-full text-xs">
                        <FaceSmileIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Thread indicator */}
                  {message.threadCount && message.threadCount > 0 && (
                    <button className="flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 text-sm font-semibold">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      {message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </div>

                {/* Message Actions (show on hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded shadow-sm">
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <FaceSmileIcon className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <ChatBubbleLeftIcon className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${selectedChannel.name}`}
              className="w-full px-4 py-3 border-0 focus:ring-0 resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="text-gray-600 hover:text-gray-900">
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <button className="text-gray-600 hover:text-gray-900">
                  <FaceSmileIcon className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Members List */}
      {showUserList && (
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Members</h3>
            <button onClick={() => setShowUserList(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {directMessages.map(user => (
            <div key={user.id} className="flex items-center gap-3 mb-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <div className="relative">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm font-semibold">
                  {user.name.charAt(0)}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white`}></div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                {user.statusMessage && (
                  <div className="text-xs text-gray-500 truncate">{user.statusMessage}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create a channel</h3>
              <button onClick={() => setShowChannelModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel name</label>
                <input
                  type="text"
                  placeholder="e.g. project-planning"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  placeholder="What's this channel about?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Make private</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Only invited members can view this channel
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowChannelModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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

export default TeamMessagingPage;

