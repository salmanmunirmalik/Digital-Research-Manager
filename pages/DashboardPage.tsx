import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FireIcon,
  ShieldCheckIcon,
  UsersIcon,
  ClockIcon,
  AcademicCapIcon,
  BookOpenIcon,
  LightbulbIcon,
  TrophyIcon,
  StarIcon,
  ArrowRightIcon,
  PlusIcon,
  BellIcon,
  CalendarIcon,
  PresentationChartLineIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import RecommendationsWidget from '../components/RecommendationsWidget';

interface DashboardStats {
  protocols: number;
  experiments: number;
  negativeResults: number;
  collaborations: number;
  papers: number;
  passportScore: number;
}

interface RecentActivity {
  id: string;
  type: 'protocol' | 'experiment' | 'negative_result' | 'collaboration' | 'paper';
  title: string;
  timestamp: string;
  link: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: 'meeting' | 'deadline' | 'reminder' | 'experiment' | 'appointment';
  priority: 'low' | 'medium' | 'high';
  color: string;
  all_day: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    protocols: 0,
    experiments: 0,
    negativeResults: 0,
    collaborations: 0,
    papers: 0,
    passportScore: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'meeting' as 'meeting' | 'deadline' | 'reminder' | 'experiment' | 'appointment',
    priority: 'medium' as 'low' | 'medium' | 'high',
    color: 'blue'
  });

  useEffect(() => {
    fetchDashboardData();
    fetchCalendarEvents();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch user stats
      const [protocolsRes, experimentsRes, negativeResultsRes, collaborationsRes, papersRes, passportRes] = await Promise.all([
        axios.get('/api/protocols', { headers }).catch(() => null),
        axios.get('/api/experiments', { headers }).catch(() => null),
        axios.get('/api/negative-results/my/submissions', { headers }).catch(() => null),
        axios.get('/api/collaborations', { headers }).catch(() => null),
        axios.get('/api/papers', { headers }).catch(() => null),
        axios.get('/api/scientist-passport/gamification', { headers }).catch(() => null)
      ]);

      setStats({
        protocols: protocolsRes?.data?.length || 0,
        experiments: experimentsRes?.data?.length || 0,
        negativeResults: negativeResultsRes?.data?.length || 0,
        collaborations: collaborationsRes?.data?.length || 0,
        papers: papersRes?.data?.length || 0,
        passportScore: passportRes?.data?.overallScore || 0
      });

      // Build recent activity list
      const activities: RecentActivity[] = [];
      
      if (protocolsRes?.data) {
        protocolsRes.data.slice(0, 2).forEach((p: any) => {
          activities.push({
            id: p.id,
            type: 'protocol',
            title: p.title || p.name,
            timestamp: p.created_at || p.updated_at,
            link: '/professional-protocols'
          });
        });
      }

      if (negativeResultsRes?.data) {
        negativeResultsRes.data.slice(0, 2).forEach((nr: any) => {
          activities.push({
            id: nr.id,
            type: 'negative_result',
            title: nr.experiment_title,
            timestamp: nr.created_at,
            link: '/negative-results'
          });
        });
      }

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentActivity(activities.slice(0, 6));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: PlusIcon,
      title: 'Start Experiment',
      description: 'Create a new experiment',
      color: 'from-blue-500 to-blue-600',
      link: '/experiment-tracker'
    },
    {
      icon: DocumentTextIcon,
      title: 'Add Protocol',
      description: 'Document a new protocol',
      color: 'from-green-500 to-green-600',
      link: '/professional-protocols'
    },
    {
      icon: FireIcon,
      title: 'Share Failed Experiment',
      description: 'Build transparency reputation',
      color: 'from-orange-500 to-red-500',
      link: '/negative-results'
    },
    {
      icon: UsersIcon,
      title: 'Collaborate',
      description: 'Find research partners',
      color: 'from-purple-500 to-purple-600',
      link: '/collaboration-networking'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'protocol':
        return DocumentTextIcon;
      case 'experiment':
        return BeakerIcon;
      case 'negative_result':
        return FireIcon;
      case 'collaboration':
        return UsersIcon;
      case 'paper':
        return BookOpenIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'protocol':
        return 'bg-green-100 text-green-700';
      case 'experiment':
        return 'bg-blue-100 text-blue-700';
      case 'negative_result':
        return 'bg-orange-100 text-orange-700';
      case 'collaboration':
        return 'bg-purple-100 text-purple-700';
      case 'paper':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Calendar functions
  const getEventsForDate = (date: string) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0];
      return eventDate === date;
    });
  };

  const handleDateClick = (date: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setEventForm(prev => ({ ...prev, date: dateStr }));
    setShowEventForm(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const fetchCalendarEvents = async () => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No auth token found');
        return;
      }

      const response = await axios.get('/api/calendar-events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        setCalendarEvents(response.data);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.first_name || 'Researcher'}! 👋
              </h1>
              <p className="mt-2 text-gray-600">
                Overview of your research activities and contributions
              </p>
            </div>
            <button
              onClick={() => navigate('/my-portfolio')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShieldCheckIcon className="w-5 h-5" />
              <span>My Scientific Passport</span>
            </button>
          </div>
        </div>

        {/* Calendar Section */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Calendar Grid */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-2xl p-4 shadow-xl border border-blue-100/50 backdrop-blur-sm">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-blue-700 py-2 bg-white/90 rounded-lg backdrop-blur-sm shadow-sm border border-blue-100/50">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Dates */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = i - 6 + 1;
                      const isCurrentMonth = date > 0 && date <= 31;
                      const isToday = date === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                      const dayEvents = getEventsForDate(dateStr);
                      const hasEvent = dayEvents.length > 0;
                      const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
                      const isWeekend = i % 7 === 0 || i % 7 === 6;
                      
                      return (
                        <div
                          key={i}
                          onClick={() => isCurrentMonth && handleDateClick(date)}
                          className={`
                            relative aspect-square flex flex-col items-center justify-center text-xs font-medium rounded-lg cursor-pointer transition-all duration-300 group
                            ${isCurrentMonth 
                              ? isToday 
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-400' 
                                : hasEvent 
                                  ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-900 hover:from-blue-200 hover:to-blue-300 hover:shadow-md hover:scale-105 border border-blue-300/50' 
                                  : isPast
                                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 hover:shadow-sm'
                                    : isWeekend
                                      ? 'text-blue-600 hover:bg-white hover:shadow-md hover:scale-105 bg-white/60'
                                      : 'text-blue-700 hover:bg-white hover:shadow-md hover:scale-105 bg-white/80'
                              : 'text-slate-300 hover:text-slate-400'
                            }
                          `}
                        >
                          {isCurrentMonth && (
                            <>
                              <span className="relative z-10">{date}</span>
                              {/* Event List */}
                              {dayEvents.length > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 p-1 space-y-0.5">
                                  {dayEvents.slice(0, 2).map((event) => (
                                    <div
                                      key={event.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEventClick(event);
                                      }}
                                      className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                                        event.color === 'blue' ? 'bg-blue-500 text-white' :
                                        event.color === 'green' ? 'bg-green-500 text-white' :
                                        event.color === 'red' ? 'bg-red-500 text-white' :
                                        event.color === 'yellow' ? 'bg-yellow-500 text-black' :
                                        'bg-blue-500 text-white'
                                      }`}
                                      title={event.title}
                                    >
                                      {event.title}
                                    </div>
                                  ))}
                                  {dayEvents.length > 2 && (
                                    <div className="text-xs text-blue-600 font-medium">
                                      +{dayEvents.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Hover Effect */}
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Today's Glow Effect */}
                          {isToday && (
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-500/20 animate-pulse"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Calendar Footer */}
                  <div className="mt-3 flex items-center justify-between text-xs text-blue-600">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span>Today</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Events</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Today's Schedule
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 p-1.5 bg-blue-50 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900">Team Standup</p>
                        <p className="text-xs text-blue-700">9:00 AM - 9:30 AM</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-1.5 bg-green-50 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-900">Lab Session</p>
                        <p className="text-xs text-green-700">2:00 PM - 4:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Notes */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Quick Notes
                  </h3>
                  <div className="space-y-1.5">
                    <div className="p-1.5 bg-purple-50 rounded-lg">
                      <p className="text-xs font-medium text-purple-900">Lab meeting notes</p>
                      <p className="text-xs text-purple-700">Review experiment results</p>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-900">Equipment check</p>
                      <p className="text-xs text-blue-700">Calibrate pH meter</p>
                    </div>
                    <button className="w-full p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                      <div className="flex items-center space-x-2">
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">Add Note</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Activity
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 p-1.5 bg-green-50 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-900">Experiment completed</p>
                        <p className="text-xs text-green-700">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-1.5 bg-blue-50 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900">Equipment booked</p>
                        <p className="text-xs text-blue-700">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-1.5 bg-purple-50 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-purple-900">Note added</p>
                        <p className="text-xs text-purple-700">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Personalized Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <RecommendationsWidget
                itemType="protocols"
                title="Recommended Protocols"
                limit={3}
                showFeedback={true}
                onItemClick={(itemId) => navigate(`/protocols?id=${itemId}`)}
              />
              <RecommendationsWidget
                itemType="papers"
                title="Recommended Papers"
                limit={3}
                showFeedback={true}
                onItemClick={(itemId) => navigate(`/reference-library?paper=${itemId}`)}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <PlusIcon className="w-5 h-5 text-indigo-600" />
                  <span>Quick Actions</span>
                </h2>
                <div className="space-y-3">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => navigate(action.link)}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all group"
                      >
                        <div className={`p-2 bg-gradient-to-br ${action.color} rounded-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                            {action.title}
                          </p>
                          <p className="text-xs text-gray-500">{action.description}</p>
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-indigo-600" />
                  <span>Recent Activity</span>
                </h2>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No recent activity yet</p>
                    <button
                      onClick={() => navigate('/professional-protocols')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Get Started
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <button
                          key={activity.id}
                          onClick={() => navigate(activity.link)}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all group"
                        >
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button
                onClick={() => navigate('/current-trends')}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all text-left group"
              >
                <div className="p-3 bg-purple-100 rounded-lg mb-4 inline-block group-hover:scale-110 transition-transform">
                  <ChartBarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Current Trends</h3>
                <p className="text-xs text-gray-600">Stay updated with latest research trends</p>
              </button>

              <button
                onClick={() => navigate('/communications')}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all text-left group"
              >
                <div className="p-3 bg-blue-100 rounded-lg mb-4 inline-block group-hover:scale-110 transition-transform">
                  <BellIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Communications</h3>
                <p className="text-xs text-gray-600">Messages, notifications & updates</p>
              </button>

              <button
                onClick={() => navigate('/help-forum')}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all text-left group"
              >
                <div className="p-3 bg-green-100 rounded-lg mb-4 inline-block group-hover:scale-110 transition-transform">
                  <UsersIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Discussions</h3>
                <p className="text-xs text-gray-600">Open questions in help forum</p>
              </button>

              <button
                onClick={() => navigate('/journal')}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all text-left group"
              >
                <div className="p-3 bg-purple-100 rounded-lg mb-4 inline-block group-hover:scale-110 transition-transform">
                  <BookOpenIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Journal</h3>
                <p className="text-xs text-gray-600">Science For All Journal - Open access</p>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Event</h2>
                <button
                  onClick={() => setShowEventForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Event title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    rows={3}
                    placeholder="Event description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                      <option value="reminder">Reminder</option>
                      <option value="experiment">Experiment</option>
                      <option value="appointment">Appointment</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select
                      value={eventForm.priority}
                      onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value as any })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <div className="flex space-x-2">
                    {['blue', 'green', 'red', 'yellow'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEventForm({ ...eventForm, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          eventForm.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        } ${
                          color === 'blue' ? 'bg-blue-500' :
                          color === 'green' ? 'bg-green-500' :
                          color === 'red' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEventForm(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const startTime = eventForm.date + (eventForm.time ? 'T' + eventForm.time : 'T00:00:00');
                      const endTime = eventForm.date + (eventForm.time ? 'T' + eventForm.time : 'T23:59:59');
                      
                      await axios.post('/api/calendar-events', {
                        title: eventForm.title,
                        description: eventForm.description,
                        start_time: startTime,
                        end_time: endTime,
                        event_type: eventForm.type,
                        all_day: !eventForm.time
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      setShowEventForm(false);
                      setEventForm({
                        title: '',
                        description: '',
                        date: '',
                        time: '',
                        type: 'meeting',
                        priority: 'medium',
                        color: 'blue'
                      });
                      fetchCalendarEvents();
                    } catch (error) {
                      console.error('Error creating event:', error);
                      alert('Error creating event');
                    }
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">{new Date(selectedEvent.start_time).toLocaleDateString()}</span>
                </div>
                
                {!selectedEvent.all_day && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{new Date(selectedEvent.start_time).toLocaleTimeString()}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700">Type:</span>
                  <span className="text-sm text-gray-600 capitalize">{selectedEvent.event_type}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700">Priority:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    selectedEvent.priority === 'high' ? 'bg-red-100 text-red-700' :
                    selectedEvent.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedEvent.priority}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      await axios.delete(`/api/calendar-events/${selectedEvent.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setShowEventModal(false);
                      fetchCalendarEvents();
                    } catch (error) {
                      console.error('Error deleting event:', error);
                      alert('Error deleting event');
                    }
                  }}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

