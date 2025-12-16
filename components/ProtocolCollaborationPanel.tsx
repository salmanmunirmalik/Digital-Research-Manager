/**
 * Protocol Collaboration Panel
 * Real-time collaboration, comments, and version control
 */

import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { CodeBranchIcon, ChatBubbleLeftRightIcon, XMarkIcon } from './icons';
import Button from './ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import axios from 'axios';

interface ProtocolCollaborationPanelProps {
  protocolId: string;
  onClose?: () => void;
}

interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  last_active_at: string;
}

interface Comment {
  id: string;
  content: string;
  step_id?: number;
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  replies?: Comment[];
}

interface Version {
  id: string;
  version_number: string;
  changelog: string;
  created_by: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

const ProtocolCollaborationPanel: React.FC<ProtocolCollaborationPanelProps> = ({
  protocolId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'comments' | 'versions'>('collaborators');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentStepId, setCommentStepId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCollaborators();
    fetchComments();
    fetchVersions();
  }, [protocolId]);

  const fetchCollaborators = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/protocol-collaboration/${protocolId}/collaborators`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCollaborators(response.data.collaborators || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/protocol-collaboration/${protocolId}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchVersions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/protocol-collaboration/${protocolId}/versions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVersions(response.data.versions || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/protocol-collaboration/${protocolId}/comments`,
        {
          content: newComment,
          stepId: commentStepId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      setCommentStepId(null);
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForkProtocol = async () => {
    if (!confirm('Create a copy of this protocol that you can modify?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/protocol-collaboration/${protocolId}/fork`,
        {
          title: undefined, // Will use default "Protocol (Forked)"
          modifications: 'User fork'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Protocol forked successfully! You can find it in your protocols.');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to fork protocol');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-6 h-6" />
              <CardTitle className="text-white">Collaboration & Version Control</CardTitle>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'collaborators' as const, label: 'Collaborators', icon: UserGroupIcon },
              { id: 'comments' as const, label: 'Comments', icon: ChatBubbleLeftRightIcon },
              { id: 'versions' as const, label: 'Versions', icon: CodeBranchIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Collaborators Tab */}
            {activeTab === 'collaborators' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
                  <Button
                    variant="outline"
                    onClick={handleForkProtocol}
                    className="border-purple-600 text-purple-600"
                  >
                    <CodeBranchIcon className="w-4 h-4 mr-2" />
                    Fork Protocol
                  </Button>
                </div>
                <div className="space-y-3">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {collab.first_name[0]}{collab.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {collab.first_name} {collab.last_name}
                          </p>
                          <p className="text-sm text-gray-600">@{collab.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {collab.role}
                        </span>
                        <span className="text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3 inline mr-1" />
                          {new Date(collab.last_active_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Comments & Discussion</h3>
                  <div className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <input
                        type="number"
                        placeholder="Step # (optional)"
                        value={commentStepId || ''}
                        onChange={(e) => setCommentStepId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={isLoading || !newComment.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {comment.first_name[0]}{comment.last_name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {comment.first_name} {comment.last_name}
                            </span>
                            {comment.step_id && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                Step {comment.step_id}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-300 pl-4">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="text-sm">
                                  <span className="font-medium text-gray-900">
                                    {reply.first_name} {reply.last_name}:
                                  </span>{' '}
                                  <span className="text-gray-700">{reply.content}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No comments yet. Start the discussion!</p>
                  )}
                </div>
              </div>
            )}

            {/* Versions Tab */}
            {activeTab === 'versions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Version History</h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const versionNumber = prompt('Enter version number (e.g., 2.0):');
                      const changelog = prompt('Enter changelog:');
                      if (versionNumber) {
                        // TODO: Create version via API
                        alert('Version creation feature coming soon!');
                      }
                    }}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Version
                  </Button>
                </div>
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div key={version.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                            v{version.version_number}
                          </span>
                          <span className="text-sm text-gray-600">
                            by {version.first_name} {version.last_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {version.changelog && (
                        <p className="text-sm text-gray-700 mt-2">{version.changelog}</p>
                      )}
                    </div>
                  ))}
                  {versions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No versions yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProtocolCollaborationPanel;

