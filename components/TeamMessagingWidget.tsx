import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  userName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface TeamMessagingWidgetProps {
  className?: string;
}

const TeamMessagingWidget: React.FC<TeamMessagingWidgetProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages] = useState<Message[]>([
    {
      id: '1',
      userName: 'Dr. Sarah Johnson',
      content: 'Can someone help me with the PCR protocol?',
      timestamp: new Date(Date.now() - 300000),
      isRead: false,
    },
    {
      id: '2',
      userName: 'John Doe',
      content: 'The lab meeting is starting in 10 minutes',
      timestamp: new Date(Date.now() - 600000),
      isRead: false,
    },
    {
      id: '3',
      userName: 'Jane Smith',
      content: 'Data analysis results are ready for review',
      timestamp: new Date(Date.now() - 1800000),
      isRead: true,
    },
  ]);

  const unreadCount = messages.filter(m => !m.isRead).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Floating Message Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-40 ${className}`}
      >
        <div className="relative">
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Message Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-2xl z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5" />
              <h3 className="font-semibold">Team Messages</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages List */}
          <div className="max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start a conversation with your team</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !message.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {message.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {message.userName}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Reply */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Quick reply..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View All Link */}
          <div className="px-4 py-2 bg-gray-100 rounded-b-lg">
            <Link
              to="/team-messaging"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center justify-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              View all messages
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamMessagingWidget;

