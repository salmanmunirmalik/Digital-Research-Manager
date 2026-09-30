import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
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
  const [messages] = useState<Message[]>([]);

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
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <h3 className="font-semibold text-sm">Team messages</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="Close messages"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">No messages yet</p>
                <Link
                  to="/lab-workspace?section=messages"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Open team messaging
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.isRead ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{message.userName}</span>
                      <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3">
            <Link
              to="/lab-workspace?section=messages"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all messages
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        aria-label={isOpen ? 'Close team messages' : 'Open team messages'}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <PaperAirplaneIcon className="w-6 h-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default TeamMessagingWidget;
