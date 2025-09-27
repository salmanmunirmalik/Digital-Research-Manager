import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  CalendarIcon,
  MapPinIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  UsersIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
  ShareIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  LightBulbIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  LinkIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '../components/icons';

interface Event {
  id: string;
  title: string;
  type: 'research_exchange' | 'conference' | 'summer_school' | 'workshop' | 'symposium' | 'internship';
  description: string;
  organizer: string;
  institution: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  cost: number;
  currency: string;
  funding: boolean;
  fundingAmount?: number;
  requirements: string[];
  skillsRequired: string[];
  benefits: string[];
  website: string;
  contactEmail: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isApplied: boolean;
  isBookmarked: boolean;
  rating: number;
  reviewsCount: number;
}

const EventsAndOpportunities: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'research_exchange' | 'conferences' | 'summer_schools'>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    cost: '',
    funding: '',
    type: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // No mock data - start with empty array
      setEvents([]);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAction = async (eventId: string, action: 'apply' | 'bookmark' | 'unbookmark') => {
    try {
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          switch (action) {
            case 'apply':
              return { ...event, isApplied: true, currentParticipants: event.currentParticipants + 1 };
            case 'bookmark':
              return { ...event, isBookmarked: true };
            case 'unbookmark':
              return { ...event, isBookmarked: false };
            default:
              return event;
          }
        }
        return event;
      }));
    } catch (error) {
      console.error('Error performing event action:', error);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'research_exchange':
        return GlobeAltIcon;
      case 'conference':
        return UsersIcon;
      case 'summer_school':
        return AcademicCapIcon;
      case 'workshop':
        return LightBulbIcon;
      case 'symposium':
        return BookOpenIcon;
      case 'internship':
        return BuildingOfficeIcon;
      default:
        return CalendarIcon;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'research_exchange':
        return 'bg-blue-100 text-blue-800';
      case 'conference':
        return 'bg-green-100 text-green-800';
      case 'summer_school':
        return 'bg-purple-100 text-purple-800';
      case 'workshop':
        return 'bg-yellow-100 text-yellow-800';
      case 'symposium':
        return 'bg-red-100 text-red-800';
      case 'internship':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || event.type === activeTab;
    
    const matchesFilters = (!selectedFilters.location || event.location.includes(selectedFilters.location)) &&
                          (!selectedFilters.cost || (selectedFilters.cost === 'free' && event.cost === 0) || 
                           (selectedFilters.cost === 'paid' && event.cost > 0)) &&
                          (!selectedFilters.funding || (selectedFilters.funding === 'funded' && event.funding) ||
                           (selectedFilters.funding === 'unfunded' && !event.funding));
    
    return matchesSearch && matchesTab && matchesFilters;
  });

  const tabs = [
    { id: 'all', name: 'All Events', icon: CalendarIcon },
    { id: 'research_exchange', name: 'Research Exchange', icon: GlobeAltIcon },
    { id: 'conferences', name: 'Conferences', icon: UsersIcon },
    { id: 'summer_schools', name: 'Summer Schools', icon: AcademicCapIcon }
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">Events & Opportunities</h2>
          <p className="text-gray-600">Discover research exchanges, conferences, summer schools, and more</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="primary" className="flex items-center">
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Event
          </Button>
          <Button variant="secondary" className="flex items-center">
            <ShareIcon className="w-5 h-5 mr-2" />
            Share Event
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events, organizers, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedFilters.location}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, location: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                <option value="New York">New York</option>
                <option value="Boston">Boston</option>
                <option value="San Francisco">San Francisco</option>
                <option value="London">London</option>
              </select>
              <select
                value={selectedFilters.cost}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, cost: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Costs</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
              <select
                value={selectedFilters.funding}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, funding: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Funding</option>
                <option value="funded">Funded</option>
                <option value="unfunded">No Funding</option>
              </select>
              <Button variant="ghost" className="flex items-center">
                <FunnelIcon className="w-5 h-5 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => {
          const EventIcon = getEventTypeIcon(event.type);
          return (
            <Card key={event.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <EventIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                          {event.type.replace('_', ' ')}
                        </span>
                        {event.funding && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Funded
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                          {event.organizer}
                        </span>
                        <span className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {event.location}
                        </span>
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <UsersIcon className="w-4 h-4 mr-1" />
                          {event.currentParticipants}/{event.maxParticipants} participants
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {event.skillsRequired.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center text-yellow-600">
                          <StarIcon className="w-4 h-4 mr-1" />
                          {event.rating} ({event.reviewsCount} reviews)
                        </span>
                        <span className="text-gray-500">
                          Application deadline: {new Date(event.applicationDeadline).toLocaleDateString()}
                        </span>
                        {event.cost > 0 && (
                          <span className="text-gray-500">
                            Cost: {event.cost} {event.currency}
                          </span>
                        )}
                        {event.fundingAmount && (
                          <span className="text-green-600 font-medium">
                            Funding: {event.fundingAmount} {event.currency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {event.isApplied ? (
                      <Button variant="secondary" className="flex items-center" disabled>
                        <CheckIcon className="w-4 h-4 mr-2" />
                        Applied
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEventAction(event.id, 'apply')}
                        variant="primary"
                        className="flex items-center"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Apply Now
                      </Button>
                    )}
                    {event.isBookmarked ? (
                      <Button
                        onClick={() => handleEventAction(event.id, 'unbookmark')}
                        variant="ghost"
                        className="flex items-center"
                      >
                        <HeartIcon className="w-4 h-4 mr-2 text-red-600" />
                        Bookmarked
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEventAction(event.id, 'bookmark')}
                        variant="ghost"
                        className="flex items-center"
                      >
                        <HeartIcon className="w-4 h-4 mr-2" />
                        Bookmark
                      </Button>
                    )}
                    <Button variant="ghost" className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="ghost" className="flex items-center">
                      <ShareIcon className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EventsAndOpportunities;
