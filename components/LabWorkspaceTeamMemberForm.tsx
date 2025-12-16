/**
 * Lab Workspace Team Member Form
 * For adding and editing team members in Lab Workspace
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import axios from 'axios';

interface TeamMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (member: any) => Promise<void>;
  initialData?: any;
  labId: string | null;
  existingMembers?: Array<{ id: string; user_id: string; email: string }>;
}

const LabWorkspaceTeamMemberForm: React.FC<TeamMemberFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  labId,
  existingMembers = []
}) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'researcher' as 'principal_researcher' | 'co_supervisor' | 'researcher' | 'student',
    roleLabel: '', // Store the detailed role label
    permissions: {}
  });

  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string; name: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Try to get role label from permissions if stored
        const storedRoleLabel = initialData.permissions?.roleLabel || initialData.roleLabel || '';
        // If no stored label, try to find a matching role from our list
        const matchingRole = roles.find(r => r.value === initialData.role);
        setFormData({
          email: initialData.email || '',
          role: initialData.role || 'researcher',
          roleLabel: storedRoleLabel || matchingRole?.label || '',
          permissions: initialData.permissions || {}
        });
        setSelectedUser({
          id: initialData.user_id || initialData.id,
          email: initialData.email || '',
          name: initialData.name || `${initialData.first_name || ''} ${initialData.last_name || ''}`.trim()
        });
        setUserSearch(initialData.email || '');
      } else {
        setFormData({
          email: '',
          role: 'researcher',
          roleLabel: '',
          permissions: {}
        });
        setSelectedUser(null);
        setUserSearch('');
      }
      setError(null);
      setSearchResults([]);
    }
  }, [isOpen, initialData]);

  // Search for users by email
  const searchUsers = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      // Try to search users by email
      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { users: [] } }));
      
      // Filter users by email/name match
      const allUsers = response.data.users || [];
      const matchingUsers = allUsers.filter((u: any) => 
        (u.email && u.email.toLowerCase().includes(query.toLowerCase())) ||
        (u.first_name && u.first_name.toLowerCase().includes(query.toLowerCase())) ||
        (u.last_name && u.last_name.toLowerCase().includes(query.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(query.toLowerCase()))
      );
      
      // Filter out users who are already members
      const existingUserIds = existingMembers.map(m => m.user_id || m.id);
      const filtered = matchingUsers.filter((u: any) => 
        !existingUserIds.includes(u.id) || (initialData && u.id === initialData.user_id)
      ).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email
      }));
      
      setSearchResults(filtered);
    } catch (err: any) {
      // If search fails, allow manual email entry
      console.log('User search not available, will use email directly');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearch && !selectedUser) {
        searchUsers(userSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearch, selectedUser]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserSelect = (user: { id: string; email: string; name: string }) => {
    setSelectedUser(user);
    setUserSearch(user.email);
    setSearchResults([]);
    setFormData(prev => ({ ...prev, email: user.email }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For new members, require user selection or email
    if (!initialData && !selectedUser && !userSearch.trim()) {
      setError('Please search and select a user, or enter an email address');
      return;
    }

    if (!labId) {
      setError('Lab ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If editing, use existing user_id
      // If creating, we need to find user by email or use selected user
      let userId: string;
      
      if (initialData) {
        // Editing existing member
        userId = initialData.user_id || initialData.id;
      } else if (selectedUser) {
        // New member - user selected from search
        userId = selectedUser.id;
      } else {
        // New member - try to find user by email
        // First try to get user by email from /api/users
        try {
          const token = localStorage.getItem('token');
          const usersResponse = await axios.get('/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { users: [] } }));
          
          const foundUser = usersResponse.data.users?.find((u: any) => 
            u.email.toLowerCase() === userSearch.toLowerCase()
          );
          
          if (foundUser) {
            userId = foundUser.id;
          } else {
            throw new Error('User not found. Please search for the user first.');
          }
        } catch (searchError: any) {
          setError(searchError.message || 'User not found. Please search for the user by email.');
          setLoading(false);
          return;
        }
      }

      // Store detailed role label in permissions for display purposes
      const selectedRoleInfo = roles.find(r => r.label === formData.roleLabel);
      const permissionsWithRole = {
        ...formData.permissions,
        roleLabel: formData.roleLabel || selectedRoleInfo?.label || '',
        roleCategory: selectedRoleInfo?.category || ''
      };

      const submitData = {
        user_id: userId,
        role: formData.role,
        permissions: permissionsWithRole
      };

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save team member');
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive Research Lab Role Hierarchy (Top to Bottom)
  const roles = [
    // Leadership & Administration
    { 
      value: 'principal_researcher', 
      label: 'Principal Investigator (PI)', 
      description: 'Head of the lab with full authority over all lab operations, budgets, and personnel',
      category: 'Leadership'
    },
    { 
      value: 'co_supervisor', 
      label: 'Co-Principal Investigator (Co-PI)', 
      description: 'Secondary PI who shares leadership responsibilities and can manage projects independently',
      category: 'Leadership'
    },
    { 
      value: 'co_supervisor', 
      label: 'Lab Manager / Lab Administrator', 
      description: 'Manages day-to-day lab operations, budgets, compliance, and administrative tasks',
      category: 'Administration'
    },
    // Senior Research Staff
    { 
      value: 'researcher', 
      label: 'Senior Research Scientist', 
      description: 'Experienced researcher with PhD, leads research projects and may supervise others',
      category: 'Senior Research'
    },
    { 
      value: 'researcher', 
      label: 'Research Scientist', 
      description: 'Full-time researcher with PhD, conducts independent research and manages projects',
      category: 'Research Staff'
    },
    { 
      value: 'researcher', 
      label: 'Postdoctoral Researcher (PostDoc)', 
      description: 'PhD holder conducting advanced research, typically on a fixed-term appointment',
      category: 'Research Staff'
    },
    { 
      value: 'researcher', 
      label: 'Research Associate', 
      description: 'Research staff member supporting projects, may have Master\'s or Bachelor\'s degree',
      category: 'Research Staff'
    },
    // Graduate Students
    { 
      value: 'student', 
      label: 'PhD Student / Graduate Student (PhD)', 
      description: 'Doctoral candidate conducting research as part of their degree program',
      category: 'Graduate Students'
    },
    { 
      value: 'student', 
      label: 'Master\'s Student / Graduate Student (Master\'s)', 
      description: 'Master\'s degree candidate conducting research for their thesis or project',
      category: 'Graduate Students'
    },
    // Undergraduate & Support
    { 
      value: 'student', 
      label: 'Undergraduate Student', 
      description: 'Undergraduate researcher gaining experience, typically part-time',
      category: 'Students'
    },
    { 
      value: 'researcher', 
      label: 'Research Assistant (RA)', 
      description: 'Support staff assisting with research tasks, data collection, and lab maintenance',
      category: 'Support Staff'
    },
    { 
      value: 'researcher', 
      label: 'Lab Technician', 
      description: 'Technical specialist maintaining equipment, preparing samples, and supporting experiments',
      category: 'Support Staff'
    },
    // Visiting & External
    { 
      value: 'researcher', 
      label: 'Visiting Researcher / Visiting Scholar', 
      description: 'Temporary researcher from another institution, typically on sabbatical or exchange',
      category: 'Visiting'
    },
    { 
      value: 'researcher', 
      label: 'Collaborator', 
      description: 'External researcher collaborating on specific projects, may be from another institution',
      category: 'External'
    },
    { 
      value: 'researcher', 
      label: 'Consultant', 
      description: 'External expert providing specialized knowledge or services to the lab',
      category: 'External'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {initialData ? 'User' : 'Search User by Email'} <span className="text-red-500">*</span>
              </label>
              {initialData ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {initialData.name || `${initialData.first_name || ''} ${initialData.last_name || ''}`.trim() || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500">{initialData.email || 'No email'}</p>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="email"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setSelectedUser(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                    required={!initialData}
                  />
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && !selectedUser && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {searching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              )}
              
              {selectedUser && !initialData && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Selected:</span> {selectedUser.name} ({selectedUser.email})
                  </p>
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.roleLabel || (roles.find(r => r.value === formData.role)?.label) || ''}
                onChange={(e) => {
                  const selectedRole = roles.find(r => r.label === e.target.value);
                  if (selectedRole) {
                    setFormData(prev => ({
                      ...prev,
                      role: selectedRole.value,
                      roleLabel: selectedRole.label
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Select a role --</option>
                <optgroup label="Leadership">
                  {roles.filter(r => r.category === 'Leadership').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Administration">
                  {roles.filter(r => r.category === 'Administration').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Senior Research">
                  {roles.filter(r => r.category === 'Senior Research').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Research Staff">
                  {roles.filter(r => r.category === 'Research Staff').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Graduate Students">
                  {roles.filter(r => r.category === 'Graduate Students').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Students">
                  {roles.filter(r => r.category === 'Students').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Support Staff">
                  {roles.filter(r => r.category === 'Support Staff').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Visiting">
                  {roles.filter(r => r.category === 'Visiting').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
                <optgroup label="External">
                  {roles.filter(r => r.category === 'External').map(role => (
                    <option key={role.label} value={role.label}>{role.label}</option>
                  ))}
                </optgroup>
              </select>
              {formData.roleLabel && (
                <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                  {roles.find(r => r.label === formData.roleLabel)?.description || 'No description available'}
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || (!selectedUser && !initialData)}
          >
            {loading ? 'Saving...' : (initialData ? 'Update Member' : 'Add Member')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabWorkspaceTeamMemberForm;

