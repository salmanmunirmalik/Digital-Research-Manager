// Social Networking Components
// Profile sharing, connections, follows, and networking features

import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import {
  UserIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShareIcon,
  BellIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
  EyeIcon,
  ClockIcon,
  LockClosedIcon,
  GlobeAltIcon,
  UsersIcon,
  StarIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon
} from '../components/icons';

// ==============================================
// SOCIAL PROFILE COMPONENT
// ==============================================

interface SocialProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  bio?: string;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  orcidId?: string;
  googleScholarUrl?: string;
  location?: string;
  currentPosition?: string;
  currentInstitution?: string;
  researchInterests?: string[];
  expertiseAreas?: string[];
  languages?: string[];
  connectionsCount: number;
  followersCount: number;
  followingCount: number;
  profileViewsCount: number;
  lastActiveAt: string;
  isOnline: boolean;
}

interface SocialProfileProps {
  userId: string;
  currentUserId?: string;
  connectionStatus?: string;
  followStatus?: string;
  onConnectionRequest?: (userId: string) => void;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
}

const SocialProfile: React.FC<SocialProfileProps> = ({
  userId,
  currentUserId,
  connectionStatus,
  followStatus,
  onConnectionRequest,
  onFollow,
  onUnfollow
}) => {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/social/profile/${userId}`);
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionRequest = () => {
    if (onConnectionRequest) {
      onConnectionRequest(userId);
    }
  };

  const handleFollow = () => {
    if (onFollow) {
      onFollow(userId);
    }
  };

  const handleUnfollow = () => {
    if (onUnfollow) {
      onUnfollow(userId);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500">
          <UserIcon className="w-16 h-16 mx-auto mb-4" />
          <p>Profile not found</p>
        </div>
      </Card>
    );
  }

  const isOwnProfile = currentUserId === userId;
  const canConnect = !isOwnProfile && connectionStatus === 'none';
  const canFollow = !isOwnProfile && followStatus === 'none';

  return (
    <div className="space-y-6">
      {/* Cover Photo */}
      {profile.coverPhotoUrl && (
        <div className="relative h-64 rounded-lg overflow-hidden">
          <img
            src={profile.coverPhotoUrl}
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Picture */}
          <div className="relative">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            {profile.isOnline && (
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.currentPosition && (
                  <p className="text-lg text-gray-600">{profile.currentPosition}</p>
                )}
                {profile.currentInstitution && (
                  <p className="text-gray-500">{profile.currentInstitution}</p>
                )}
                {profile.location && (
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4 md:mt-0">
                {isOwnProfile ? (
                  <Button onClick={() => setShowShareModal(true)} variant="outline">
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Share Profile
                  </Button>
                ) : (
                  <>
                    {canConnect && (
                      <Button onClick={handleConnectionRequest} variant="primary">
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                    {canFollow && (
                      <Button onClick={handleFollow} variant="outline">
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Follow
                      </Button>
                    )}
                    {followStatus === 'active' && (
                      <Button onClick={handleUnfollow} variant="outline">
                        <UserMinusIcon className="w-4 h-4 mr-2" />
                        Unfollow
                      </Button>
                    )}
                    <Button onClick={() => setShowShareModal(true)} variant="outline">
                      <ShareIcon className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-6 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{profile.connectionsCount}</div>
                <div className="text-sm text-gray-500">Connections</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{profile.followersCount}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{profile.followingCount}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{profile.profileViewsCount}</div>
                <div className="text-sm text-gray-500">Profile Views</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bio */}
      {profile.bio && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">About</h3>
          <p className="text-gray-700">{profile.bio}</p>
        </Card>
      )}

      {/* Research Interests */}
      {profile.researchInterests && profile.researchInterests.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Research Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profile.researchInterests.map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Expertise Areas */}
      {profile.expertiseAreas && profile.expertiseAreas.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Expertise Areas</h3>
          <div className="flex flex-wrap gap-2">
            {profile.expertiseAreas.map((area, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
              >
                {area}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Links */}
      {(profile.websiteUrl || profile.linkedinUrl || profile.twitterUrl || profile.orcidId || profile.googleScholarUrl) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Links</h3>
          <div className="space-y-2">
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Website
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                LinkedIn
              </a>
            )}
            {profile.twitterUrl && (
              <a
                href={profile.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Twitter
              </a>
            )}
            {profile.orcidId && (
              <a
                href={`https://orcid.org/${profile.orcidId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                ORCID
              </a>
            )}
            {profile.googleScholarUrl && (
              <a
                href={profile.googleScholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Google Scholar
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ProfileShareModal
          userId={userId}
          userName={`${profile.firstName} ${profile.lastName}`}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

// ==============================================
// PROFILE SHARE MODAL
// ==============================================

interface ProfileShareModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const ProfileShareModal: React.FC<ProfileShareModalProps> = ({
  userId,
  userName,
  onClose
}) => {
  const [shareType, setShareType] = useState('public');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/social/profile/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareType,
          password: shareType === 'password_protected' ? password : undefined,
          expiresAt: shareType === 'time_limited' ? expiresAt : undefined,
          maxViews: shareType === 'view_limited' ? parseInt(maxViews) : undefined,
          customMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShareUrl(data.shareUrl);
      }
    } catch (error) {
      console.error('Error creating share:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Share Profile</h3>
        
        {!shareUrl ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Type
              </label>
              <select
                value={shareType}
                onChange={(e) => setShareType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public Link</option>
                <option value="password_protected">Password Protected</option>
                <option value="time_limited">Time Limited</option>
                <option value="view_limited">View Limited</option>
              </select>
            </div>

            {shareType === 'password_protected' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
            )}

            {shareType === 'time_limited' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {shareType === 'view_limited' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Views
                </label>
                <input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter maximum views"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add a personal message..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleCreateShare} variant="primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Share Link'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Share Link Created:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                />
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={onClose} variant="primary">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==============================================
// CONNECTIONS COMPONENT
// ==============================================

interface Connection {
  id: string;
  connectionName: string;
  connectionEmail: string;
  connectionPosition?: string;
  connectionInstitution?: string;
  connectionType: string;
  relationshipContext?: string;
  status: string;
  createdAt: string;
}

interface ConnectionsProps {
  userId: string;
}

const Connections: React.FC<ConnectionsProps> = ({ userId }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');

  useEffect(() => {
    fetchConnections();
  }, [userId, activeTab]);

  const fetchConnections = async () => {
    try {
      const status = activeTab === 'connections' ? 'accepted' : 'pending';
      const response = await fetch(`/api/social/connections?status=${status}`);
      const data = await response.json();
      setConnections(data.connections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionResponse = async (connectionId: string, status: string) => {
    try {
      const response = await fetch(`/api/social/connections/${connectionId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchConnections();
      }
    } catch (error) {
      console.error('Error responding to connection:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'connections'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Connections ({connections.filter(c => c.status === 'accepted').length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Requests ({connections.filter(c => c.status === 'pending').length})
        </button>
      </div>

      {/* Connections List */}
      <div className="space-y-4">
        {connections.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <UsersIcon className="w-16 h-16 mx-auto mb-4" />
              <p>No {activeTab} found</p>
            </div>
          </Card>
        ) : (
          connections.map((connection) => (
            <Card key={connection.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{connection.connectionName}</h3>
                    {connection.connectionPosition && (
                      <p className="text-sm text-gray-600">{connection.connectionPosition}</p>
                    )}
                    {connection.connectionInstitution && (
                      <p className="text-sm text-gray-500">{connection.connectionInstitution}</p>
                    )}
                    {connection.relationshipContext && (
                      <p className="text-sm text-gray-500">{connection.relationshipContext}</p>
                    )}
                  </div>
                </div>

                {activeTab === 'requests' && connection.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleConnectionResponse(connection.id, 'accepted')}
                      variant="primary"
                      size="sm"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleConnectionResponse(connection.id, 'declined')}
                      variant="outline"
                      size="sm"
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// ==============================================
// NOTIFICATIONS COMPONENT
// ==============================================

interface Notification {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  sourceUserName?: string;
  isRead: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/social/notifications');
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/social/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return <UserPlusIcon className="w-5 h-5" />;
      case 'connection_response':
        return <UserIcon className="w-5 h-5" />;
      case 'follow':
        return <HeartIcon className="w-5 h-5" />;
      case 'message':
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
      default:
        return <BellIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <BellIcon className="w-16 h-16 mx-auto mb-4" />
            <p>No notifications</p>
          </div>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-4 cursor-pointer transition-colors ${
              !notification.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${
                !notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {getNotificationIcon(notification.notificationType)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export {
  SocialProfile,
  ProfileShareModal,
  Connections,
  Notifications
};
