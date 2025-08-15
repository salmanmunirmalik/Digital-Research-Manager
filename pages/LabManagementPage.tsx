import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  UsersIcon, 
  CogIcon, 
  PencilIcon, 
  TrashIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon
} from '../components/icons';
import { Lab, User } from '../types';

interface LabMember {
  id: string;
  lab_id: string;
  user_id: string;
  role: string;
  permissions: any;
  joined_at: string;
  user: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    role: string;
  };
}

interface LabWithMembers extends Lab {
  members: LabMember[];
  member_count: number;
}

const LabManagementPage: React.FC = () => {
  const { user, token } = useAuth();
  const [labs, setLabs] = useState<LabWithMembers[]>([]);
  const [selectedLab, setSelectedLab] = useState<LabWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [labForm, setLabForm] = useState({
    name: '',
    description: '',
    institution: '',
    department: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  });

  const [memberForm, setMemberForm] = useState({
    user_id: '',
    role: 'researcher',
    permissions: {}
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchLabs();
    fetchAvailableUsers();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLabs(data.labs);
      } else {
        setError('Failed to fetch labs');
      }
    } catch (error) {
      setError('Error fetching labs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLabDetails = async (labId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/labs/${labId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedLab(data);
      }
    } catch (error) {
      setError('Error fetching lab details');
    }
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(labForm)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setLabForm({
          name: '',
          description: '',
          institution: '',
          department: '',
          contact_email: '',
          contact_phone: '',
          address: ''
        });
        fetchLabs();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create lab');
      }
    } catch (error) {
      setError('Error creating lab');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab) return;

    try {
      const response = await fetch(`http://localhost:5001/api/labs/${selectedLab.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(memberForm)
      });

      if (response.ok) {
        setShowMemberModal(false);
        setMemberForm({
          user_id: '',
          role: 'researcher',
          permissions: {}
        });
        fetchLabDetails(selectedLab.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add member');
      }
    } catch (error) {
      setError('Error adding member');
    }
  };

  const handleUpdateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab) return;

    try {
      const response = await fetch(`http://localhost:5001/api/labs/${selectedLab.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(labForm)
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchLabs();
        fetchLabDetails(selectedLab.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update lab');
      }
    } catch (error) {
      setError('Error updating lab');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedLab) return;

    try {
      const response = await fetch(`http://localhost:5001/api/labs/${selectedLab.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchLabDetails(selectedLab.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove member');
      }
    } catch (error) {
      setError('Error removing member');
    }
  };

  const openEditModal = (lab: LabWithMembers) => {
    setSelectedLab(lab);
    setLabForm({
      name: lab.name || '',
      description: lab.description || '',
      institution: lab.institution || '',
      department: lab.department || '',
      contact_email: lab.contact_email || '',
      contact_phone: lab.contact_phone || '',
      address: lab.address || ''
    });
    setShowEditModal(true);
  };

  const canManageLab = (lab: LabWithMembers) => {
    if (user?.role === 'admin') return true;
    const member = lab.members?.find(m => m.user_id === user?.id);
    return member?.role === 'principal_researcher';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Management</h1>
          <p className="text-gray-600">Create and manage research laboratories</p>
        </div>
        {['admin', 'principal_researcher'].includes(user?.role || '') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Lab</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <div key={lab.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-white" />
              </div>
              {canManageLab(lab) && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(lab)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{lab.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{lab.description}</p>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="w-4 h-4" />
                <span>{lab.institution}</span>
              </div>
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-4 h-4" />
                <span>{lab.member_count || 0} members</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedLab(lab);
                  fetchLabDetails(lab.id);
                }}
                className="w-full bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lab Details Sidebar */}
      {selectedLab && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedLab.name}</h2>
              <button
                onClick={() => setSelectedLab(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Lab Info */}
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Lab Information</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Institution:</strong> {selectedLab.institution}</p>
                  <p><strong>Department:</strong> {selectedLab.department}</p>
                  <p><strong>Contact:</strong> {selectedLab.contact_email}</p>
                  {selectedLab.description && (
                    <p><strong>Description:</strong> {selectedLab.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Team Members</h3>
                {canManageLab(selectedLab) && (
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {selectedLab.members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.first_name} {member.user.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {member.role}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {member.user.role}
                        </span>
                      </div>
                    </div>
                    {canManageLab(selectedLab) && member.user_id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Lab Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Lab</h2>
            <form onSubmit={handleCreateLab} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab Name</label>
                <input
                  type="text"
                  value={labForm.name}
                  onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={labForm.description}
                  onChange={(e) => setLabForm({ ...labForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={labForm.institution}
                    onChange={(e) => setLabForm({ ...labForm, institution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={labForm.department}
                    onChange={(e) => setLabForm({ ...labForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={labForm.contact_email}
                  onChange={(e) => setLabForm({ ...labForm, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && selectedLab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Team Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                <select
                  value={memberForm.user_id}
                  onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a user...</option>
                  {availableUsers
                    .filter(user => !selectedLab.members?.some(m => m.user_id === user.id))
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.username})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab Role</label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="researcher">Researcher</option>
                  <option value="student">Student</option>
                  <option value="co_supervisor">Co-Supervisor</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lab Modal */}
      {showEditModal && selectedLab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Lab</h2>
            <form onSubmit={handleUpdateLab} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab Name</label>
                <input
                  type="text"
                  value={labForm.name}
                  onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={labForm.description}
                  onChange={(e) => setLabForm({ ...labForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={labForm.institution}
                    onChange={(e) => setLabForm({ ...labForm, institution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={labForm.department}
                    onChange={(e) => setLabForm({ ...labForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={labForm.contact_email}
                  onChange={(e) => setLabForm({ ...labForm, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Update Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabManagementPage;
