import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from './icons';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
}

interface InstrumentRosterFormProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentId: string;
  instrumentName: string;
  onSubmit: (rosterData: any) => void;
}

const InstrumentRosterForm: React.FC<InstrumentRosterFormProps> = ({
  isOpen,
  onClose,
  instrumentId,
  instrumentName,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    user_id: '',
    role: 'operator',
    training_level: 'basic',
    certification_date: '',
    certification_expiry: '',
    notes: ''
  });
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        user_id: '',
        role: 'operator',
        training_level: 'basic',
        certification_date: '',
        certification_expiry: '',
        notes: ''
      });
      setUserSearch('');
      setSearchResults([]);
      setSelectedUser(null);
      setError(null);
    }
  }, [isOpen]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (userSearch) {
        searchUsers(userSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [userSearch]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...formData, user_id: user.id });
    setUserSearch(user.name);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onSubmit({
        ...formData,
        user_id: selectedUser.id
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add member to roster');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add to Roster</h2>
            <p className="text-sm text-gray-600 mt-1">{instrumentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User
            </label>
            {selectedUser ? (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setFormData({ ...formData, user_id: '' });
                    setUserSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setSelectedUser(null);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by name or email..."
                  required
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
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="operator">Operator</option>
              <option value="supervisor">Supervisor</option>
              <option value="maintenance_tech">Maintenance Tech</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Training Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Level
            </label>
            <select
              value={formData.training_level}
              onChange={(e) => setFormData({ ...formData, training_level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Certification Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certification Date (Optional)
            </label>
            <input
              type="date"
              value={formData.certification_date}
              onChange={(e) => setFormData({ ...formData, certification_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Certification Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certification Expiry (Optional)
            </label>
            <input
              type="date"
              value={formData.certification_expiry}
              onChange={(e) => setFormData({ ...formData, certification_expiry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this member..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUser}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add to Roster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstrumentRosterForm;


