import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  UserIcon,
  UsersIcon,
  BuildingOfficeIcon,
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarIcon,
  AcademicCapIcon,
  StarIcon,
  HeartIcon,
  ShareIcon,
  LinkIcon,
  EyeIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  GlobeAltIcon,
  BellIcon,
  ClockIcon
} from '../components/icons';

interface Lab {
  id: string;
  name: string;
  institution: string;
  location: string;
  description: string;
  researchAreas: string[];
  memberCount: number;
  isMember: boolean;
  isFollowing: boolean;
  foundedYear: number;
  website: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  institution: string;
  location: string;
  researchInterests: string[];
  profilePicture?: string;
  isConnected: boolean;
  isFollowing: boolean;
  connectionStatus: 'none' | 'pending' | 'connected';
  mutualConnections: number;
  lastActive: string;
  isOnline: boolean;
}

const LinkedInStyleNetworking: React.FC = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'labs' | 'members'>('all');

  useEffect(() => {
    loadLabs();
    loadMembers();
  }, []);

  const loadLabs = async () => {
    setLoading(true);
    try {
      // Fetch real labs from API
      const response = await fetch('/api/labs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const apiLabs = result.labs || [];
        
        // Transform API labs to component format
        const transformedLabs: Lab[] = apiLabs.map((lab: any) => ({
          id: lab.id,
          name: lab.name,
          institution: lab.institution,
          location: lab.address || 'Location not specified',
          description: lab.description || 'No description available',
          researchAreas: [], // Could be populated from a separate API call
          memberCount: 1, // Default to 1 (the creator), could be fetched separately
          isMember: false, // Could be determined based on user's lab memberships
          isFollowing: false, // Could be determined based on user's follows
          foundedYear: new Date(lab.created_at).getFullYear(),
          website: lab.website_url || '',
          socialLinks: {
            website: lab.website_url
          }
        }));
        
        setLabs(transformedLabs);
      } else {
        console.error('Failed to fetch labs:', response.statusText);
        loadMockLabs();
      }
    } catch (error) {
      console.error('Error loading labs:', error);
      loadMockLabs();
    } finally {
      setLoading(false);
    }
  };

  const loadMockLabs = () => {
    // No mock data - start with empty array
    setLabs([]);
  };

  const loadMembers = () => {
    // No mock data - start with empty array
    setMembers([]);
  };

  const handleLabAction = (labId: string, action: 'join' | 'leave' | 'follow' | 'unfollow') => {
    setLabs(prevLabs => 
      prevLabs.map(lab => {
        if (lab.id === labId) {
          switch (action) {
            case 'join':
              return { ...lab, isMember: true, memberCount: lab.memberCount + 1 };
            case 'leave':
              return { ...lab, isMember: false, memberCount: lab.memberCount - 1 };
            case 'follow':
              return { ...lab, isFollowing: true };
            case 'unfollow':
              return { ...lab, isFollowing: false };
            default:
              return lab;
          }
        }
        return lab;
      })
    );
  };

  const handleMemberAction = (memberId: string, action: 'connect' | 'disconnect' | 'follow' | 'unfollow') => {
    setMembers(prevMembers => 
      prevMembers.map(member => {
        if (member.id === memberId) {
          switch (action) {
            case 'connect':
              return { ...member, connectionStatus: 'pending' as const };
            case 'disconnect':
              return { ...member, connectionStatus: 'none' as const, isConnected: false };
            case 'follow':
              return { ...member, isFollowing: true };
            case 'unfollow':
              return { ...member, isFollowing: false };
            default:
              return member;
          }
        }
        return member;
      })
    );
  };

  const filteredLabs = labs.filter(lab => 
    lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.researchAreas.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredMembers = members.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.researchInterests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderLabCard = (lab: Lab) => (
    <Card key={lab.id}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{lab.name}</h3>
                <p className="text-gray-600">{lab.institution} • {lab.location}</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">{lab.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {lab.researchAreas.map((area, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {area}
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <UsersIcon className="w-4 h-4 mr-1" />
                {lab.memberCount} members
              </span>
              <span className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Founded {lab.foundedYear}
              </span>
              {lab.website && (
                <span className="flex items-center">
                  <LinkIcon className="w-4 h-4 mr-1" />
                  <a href={lab.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Website
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {lab.isMember ? (
            <Button
              onClick={() => handleLabAction(lab.id, 'leave')}
              variant="secondary"
              className="flex items-center"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Member
            </Button>
          ) : (
            <Button
              onClick={() => handleLabAction(lab.id, 'join')}
              variant="primary"
              className="flex items-center"
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Join Lab
            </Button>
          )}
          {lab.isFollowing ? (
            <Button
              onClick={() => handleLabAction(lab.id, 'unfollow')}
              variant="ghost"
              className="flex items-center"
            >
              <HeartIcon className="w-4 h-4 mr-2 text-red-500" />
              Following
            </Button>
          ) : (
            <Button
              onClick={() => handleLabAction(lab.id, 'follow')}
              variant="outline"
              className="flex items-center"
            >
              <HeartIcon className="w-4 h-4 mr-2" />
              Follow
            </Button>
          )}
          <Button variant="outline" className="flex items-center">
            <EyeIcon className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderMemberCard = (member: Member) => (
    <Card key={member.id}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-gray-600">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {member.firstName} {member.lastName}
                </h3>
                {member.isOnline && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <p className="text-gray-600 mb-1">{member.position}</p>
              <p className="text-gray-500 text-sm mb-2">{member.institution} • {member.location}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {member.researchInterests.map((interest, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {interest}
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{member.mutualConnections} mutual connections</span>
                <span>Last active {member.lastActive}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            {member.connectionStatus === 'connected' ? (
              <Button
                onClick={() => handleMemberAction(member.id, 'disconnect')}
                variant="secondary"
                className="flex items-center"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Connected
              </Button>
            ) : member.connectionStatus === 'pending' ? (
              <Button
                variant="ghost"
                className="flex items-center"
                disabled
              >
                <ClockIcon className="w-4 h-4 mr-2" />
                Pending
              </Button>
            ) : (
              <Button
                onClick={() => handleMemberAction(member.id, 'connect')}
                variant="primary"
                className="flex items-center"
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}
            {member.isFollowing ? (
              <Button
                onClick={() => handleMemberAction(member.id, 'unfollow')}
                variant="ghost"
                className="flex items-center"
              >
                <HeartIcon className="w-4 h-4 mr-2 text-red-500" />
                Following
              </Button>
            ) : (
              <Button
                onClick={() => handleMemberAction(member.id, 'follow')}
                variant="outline"
                className="flex items-center"
              >
                <HeartIcon className="w-4 h-4 mr-2" />
                Follow
              </Button>
            )}
            <Button variant="outline" className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collaboration & Networking</h1>
          <p className="text-gray-600">Connect with labs and researchers worldwide</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" className="flex items-center">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Lab
          </Button>
          <Button variant="primary" className="flex items-center">
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Invite Researcher
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search labs and researchers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => setActiveFilter('all')}
            variant={activeFilter === 'all' ? 'primary' : 'outline'}
            className="flex items-center"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            All
          </Button>
          <Button
            onClick={() => setActiveFilter('labs')}
            variant={activeFilter === 'labs' ? 'primary' : 'outline'}
            className="flex items-center"
          >
            <BuildingOfficeIcon className="w-4 h-4 mr-2" />
            Labs
          </Button>
          <Button
            onClick={() => setActiveFilter('members')}
            variant={activeFilter === 'members' ? 'primary' : 'outline'}
            className="flex items-center"
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Members
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Labs Section */}
        {(activeFilter === 'all' || activeFilter === 'labs') && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BuildingOfficeIcon className="w-5 h-5 mr-2 text-blue-600" />
                Research Labs ({filteredLabs.length})
              </h2>
            </div>
            <div className="space-y-4">
              {filteredLabs.map(renderLabCard)}
            </div>
          </div>
        )}

        {/* Members Section */}
        {(activeFilter === 'all' || activeFilter === 'members') && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-green-600" />
                Researchers ({filteredMembers.length})
              </h2>
            </div>
            <div className="space-y-4">
              {filteredMembers.map(renderMemberCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInStyleNetworking;