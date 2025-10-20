/**
 * Project Management Page
 * Implements Jahanzaib's vision: Projects, Work Packages, Team Hierarchy
 * Complete project lifecycle with visual team tree
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  PlusIcon,
  ChartBarIcon,
  UsersIcon,
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TrendingUpIcon
} from '../components/icons';

interface Project {
  id: string;
  project_code: string;
  project_title: string;
  project_description: string;
  status: string;
  overall_progress_percentage: number;
  total_budget: number;
  budget_spent: number;
  planned_start_date: string;
  planned_end_date: string;
  pi_name: string;
}

interface WorkPackage {
  id: string;
  package_code: string;
  package_title: string;
  status: string;
  progress_percentage: number;
  lead_name: string;
}

interface TeamMember {
  id: string;
  member_name: string;
  member_email: string;
  role: string;
  position_title: string;
  position_level: number;
  reports_to: string;
  supervisor_name: string;
}

const ProjectManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'team' | 'progress'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);

  useEffect(() => {
    if (activeTab === 'projects') {
      fetchProjects();
    } else if (activeTab === 'team') {
      fetchTeamHierarchy();
    }
  }, [activeTab]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/project-management/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamHierarchy = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Using a placeholder lab ID - in real app, would get from user's lab
      const labId = '650e8400-e29b-41d4-a716-446655440000';
      const response = await axios.get(`/api/project-management/team-hierarchy/${labId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        setTeamMembers(response.data);
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team hierarchy:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical tree structure
  const buildTeamTree = (members: TeamMember[]) => {
    // Group by position level
    const byLevel: { [key: number]: TeamMember[] } = {};
    members.forEach(member => {
      if (!byLevel[member.position_level]) {
        byLevel[member.position_level] = [];
      }
      byLevel[member.position_level].push(member);
    });

    return byLevel;
  };

  const teamTree = buildTeamTree(teamMembers);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
              <p className="text-gray-600 mt-1">Manage research projects, work packages, and team hierarchy</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FolderIcon className="w-5 h-5" />
                <span>Projects & Work Packages</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'team'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-5 h-5" />
                <span>Team Hierarchy</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>Progress & Reviews</span>
              </div>
            </button>
          </div>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-4">
                  Create research projects and break them down into manageable work packages
                </p>
                <div className="text-sm text-gray-500 mt-4">
                  <p className="font-medium mb-2">Use API to create projects:</p>
                  <code className="bg-gray-100 px-3 py-1 rounded text-xs">
                    POST /api/project-management/projects
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-mono">
                            {project.project_code}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">{project.project_title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'active' ? 'bg-green-100 text-green-700' :
                            project.status === 'planning' ? 'bg-yellow-100 text-yellow-700' :
                            project.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{project.project_description}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Overall Progress</span>
                        <span className="font-medium text-gray-900">
                          {project.overall_progress_percentage || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.overall_progress_percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <UsersIcon className="w-4 h-4" />
                        <span>PI: {project.pi_name || 'Not assigned'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span>
                          ${project.budget_spent || 0} / ${project.total_budget || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span>
                          {project.planned_start_date ? new Date(project.planned_start_date).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team Hierarchy Tab */}
        {activeTab === 'team' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading team hierarchy...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team hierarchy set up</h3>
                <p className="text-gray-600 mb-4">
                  Create your lab's organizational structure with clear reporting lines
                </p>
                <div className="text-sm text-gray-500 mt-4">
                  <p className="font-medium mb-2">Use API to add team members:</p>
                  <code className="bg-gray-100 px-3 py-1 rounded text-xs">
                    POST /api/project-management/team-hierarchy
                  </code>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Lab Team Hierarchy</h2>
                
                {/* Visual Tree Representation */}
                <div className="space-y-6">
                  {Object.keys(teamTree).sort().map((level) => (
                    <div key={level} className="relative">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className={`w-3 h-3 rounded-full ${
                          level === '0' ? 'bg-purple-600' :
                          level === '1' ? 'bg-blue-600' :
                          level === '2' ? 'bg-green-600' :
                          'bg-gray-600'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          Level {level}: {
                            level === '0' ? 'Principal Investigator' :
                            level === '1' ? 'PostDocs / Co-Investigators' :
                            level === '2' ? 'PhD Students' :
                            level === '3' ? 'Masters Students' :
                            'Research Assistants'
                          }
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-5">
                        {teamTree[parseInt(level)].map((member) => (
                          <div
                            key={member.id}
                            className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {member.member_name?.split(' ').map(n => n[0]).join('') || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">{member.member_name}</div>
                                <div className="text-xs text-gray-600">{member.position_title || member.role}</div>
                              </div>
                            </div>
                            
                            {member.supervisor_name && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                                <ArrowRightIcon className="w-3 h-3" />
                                <span>Reports to: {member.supervisor_name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {teamMembers.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No team members in hierarchy. Use API to add members.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progress & Reviews Tab */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Reports & PI Reviews</h3>
            <p className="text-gray-600 mb-4">
              Submit weekly/monthly progress reports and receive PI feedback
            </p>
            <p className="text-sm text-gray-500">
              Progress report submission and review features coming in next update.<br />
              Backend APIs are ready - see PI Review Dashboard page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManagementPage;

