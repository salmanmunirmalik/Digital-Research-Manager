
import React from 'react';
import { Link } from 'react-router-dom';
import { 
    BookOpenIcon, JournalIcon, BoxesIcon, CalendarClockIcon, 
    UsersIcon, BarChart3Icon, LightbulbIcon, MessageSquareQuestionIcon,
    ArrowRightIcon, PlayIcon, ClockIcon, TrendingUpIcon, SparklesIcon
} from '../components/icons';

const HomePage: React.FC = () => {
  const today = new Date();
  
  const quickActions = [
    {
      title: "Lab Notebook",
      description: "Record your experiments and findings",
      icon: <JournalIcon className="h-8 w-8 text-blue-600" />,
      link: "/notebook",
      color: "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:from-blue-100 hover:to-blue-200/50",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      title: "Protocol Library",
      description: "Access and manage lab protocols",
      icon: <BookOpenIcon className="h-8 w-8 text-green-600" />,
      link: "/protocols",
      color: "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:from-green-100 hover:to-green-200/50",
      gradient: "from-green-500 to-green-600"
    },
    {
      title: "Research Intelligence",
      description: "AI-powered insights and presentations",
      icon: <LightbulbIcon className="h-8 w-8 text-purple-600" />,
      link: "/research-intelligence",
      color: "bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:from-purple-100 hover:to-purple-200/50",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      title: "Team Collaboration",
      description: "Connect with your lab team",
      icon: <UsersIcon className="h-8 w-8 text-orange-600" />,
      link: "/team",
      color: "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 hover:from-orange-100 hover:to-orange-200/50",
      gradient: "from-orange-500 to-orange-600"
    }
  ];

  const stats = [
    { label: "Active Projects", value: "12", change: "+2", changeType: "positive", icon: "📊" },
    { label: "Completed Protocols", value: "47", change: "+5", changeType: "positive", icon: "📋" },
    { label: "Team Members", value: "8", change: "+1", changeType: "positive", icon: "👥" },
    { label: "Data Sets", value: "156", change: "+23", changeType: "positive", icon: "💾" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative text-center py-20 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full border border-blue-200/50 mb-6">
            <SparklesIcon className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">AI-Powered Research Platform</span>
          </div>
          
          <h1 className="text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Digital Research Manager
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            Your comprehensive research platform for seamless lab management, collaboration, and discovery. 
            Streamline your research workflow with intelligent tools and AI-powered insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/notebook"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <PlayIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Start Your Research
            </Link>
            <Link 
              to="/research-intelligence"
              className="group inline-flex items-center px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <LightbulbIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Explore AI Features
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 mb-2">{stat.label}</div>
              <div className={`inline-flex items-center text-xs font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUpIcon className="h-3 w-3 mr-1" />
                {stat.change} this month
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <p className="text-lg text-slate-600">Get started with your research workflow</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link 
              key={index} 
              to={action.link}
              className={`group p-8 rounded-2xl border-2 transition-all duration-300 ${action.color} hover:shadow-xl transform hover:-translate-y-2`}
            >
              <div className="text-center">
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {action.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{action.title}</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">{action.description}</p>
                <div className={`inline-flex items-center text-sm font-medium bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300`}>
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Preview */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100/50 p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Platform Features</h2>
            <p className="text-lg text-slate-600">Discover what makes Digital Research Manager powerful</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <LightbulbIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">AI-Powered Insights</h3>
              <p className="text-slate-600 leading-relaxed">Get intelligent suggestions for papers, presentations, and research directions based on your data.</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-100 to-green-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <UsersIcon className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Team Collaboration</h3>
              <p className="text-slate-600 leading-relaxed">Share protocols, collaborate on experiments, and manage team resources efficiently.</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3Icon className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Data Management</h3>
              <p className="text-slate-600 leading-relaxed">Organize, analyze, and visualize your research data with powerful tools.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100/50 p-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Recent Activity</h2>
            <Link to="/notebook" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mr-6">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-lg">New experiment recorded in Lab Notebook</p>
                <p className="text-sm text-slate-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-6 bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl hover:from-green-100 hover:to-green-200/50 transition-all duration-200">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center mr-6">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-lg">Protocol "Western Blot" updated to v2.2</p>
                <p className="text-sm text-slate-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl hover:from-purple-100 hover:to-purple-200/50 transition-all duration-200">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mr-6">
                <MessageSquareQuestionIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-lg">New question posted in Help Forum</p>
                <p className="text-sm text-slate-500">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-20 text-center">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-30" />
          <div className="relative p-12 text-white">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Research?</h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Join thousands of researchers who are already using Digital Research Manager to accelerate their discoveries.
            </p>
            <Link 
              to="/notebook"
              className="group inline-flex items-center px-10 py-5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              Start Your Free Trial
              <ArrowRightIcon className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;