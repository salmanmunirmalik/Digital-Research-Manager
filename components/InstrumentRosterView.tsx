import React, { useState, useEffect } from 'react';
import { UsersIcon, PlusIcon, TrashIcon, XMarkIcon, UserIcon } from './icons';
import axios from 'axios';

interface RosterMember {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  role: string;
  training_level: string;
  certification_date?: string;
  certification_expiry?: string;
  permissions: string[];
  status: string;
  last_training?: string;
}

interface InstrumentRosterViewProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentId: string;
  instrumentName: string;
  onAddMember?: () => void;
}

const InstrumentRosterView: React.FC<InstrumentRosterViewProps> = ({
  isOpen,
  onClose,
  instrumentId,
  instrumentName,
  onAddMember
}) => {
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && instrumentId) {
      fetchRoster();
    }
  }, [isOpen, instrumentId]);

  const fetchRoster = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/api/instruments/${instrumentId}/roster`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoster(response.data.roster || []);
    } catch (err: any) {
      console.error('Error fetching roster:', err);
      setError('Failed to load roster');
      // Set empty roster on error
      setRoster([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the roster?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/instruments/${instrumentId}/roster/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchRoster();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'supervisor':
        return 'bg-blue-100 text-blue-700';
      case 'trainer':
        return 'bg-green-100 text-green-700';
      case 'operator':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrainingLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert':
        return 'bg-green-100 text-green-700';
      case 'advanced':
        return 'bg-blue-100 text-blue-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'basic':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Instrument Roster</h2>
            <p className="text-sm text-gray-600 mt-1">{instrumentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchRoster}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {roster.length} member{roster.length !== 1 ? 's' : ''} on roster
                </p>
                {onAddMember && (
                  <button
                    onClick={onAddMember}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Member
                  </button>
                )}
              </div>

              {roster.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No roster members</h3>
                  <p className="text-gray-500 mb-4">Add members to manage instrument access and training</p>
                  {onAddMember && (
                    <button
                      onClick={onAddMember}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add First Member
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {roster.map((member) => (
                    <div
                      key={member.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{member.user_name}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(member.role)}`}>
                                {member.role}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${getTrainingLevelColor(member.training_level)}`}>
                                {member.training_level}
                              </span>
                              {member.status !== 'approved' && (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                                  {member.status}
                                </span>
                              )}
                            </div>
                            {member.user_email && (
                              <p className="text-sm text-gray-600 mb-2">{member.user_email}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {member.certification_date && (
                                <div>
                                  <span className="font-medium">Certified:</span> {formatDate(member.certification_date)}
                                </div>
                              )}
                              {member.certification_expiry && (
                                <div>
                                  <span className="font-medium">Expires:</span> {formatDate(member.certification_expiry)}
                                </div>
                              )}
                              {member.last_training && (
                                <div>
                                  <span className="font-medium">Last Training:</span> {formatDate(member.last_training)}
                                </div>
                              )}
                            </div>
                            {member.permissions && member.permissions.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-600">Permissions: </span>
                                <span className="text-xs text-gray-500">
                                  {member.permissions.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from roster"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstrumentRosterView;


