import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRolePermissions, getUserDisplayName, getRoleDisplayName } from '../utils/roleAccess';

const RoleTestComponent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Not Authenticated</h3>
        <p className="text-red-600">Please log in to view role information.</p>
      </div>
    );
  }

  const permissions = getRolePermissions(user.role);
  const displayName = getUserDisplayName(user);
  const roleDisplayName = getRoleDisplayName(user.role);

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">🔐 Current User Role Information</h3>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">User Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Name:</span> {displayName}</div>
            <div><span className="font-medium">Email:</span> {user.email}</div>
            <div><span className="font-medium">Role:</span> {user.role}</div>
            <div><span className="font-medium">Role Display:</span> {roleDisplayName}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`flex items-center ${permissions.canManageUsers ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-2">{permissions.canManageUsers ? '✅' : '❌'}</span>
              Manage Users
            </div>
            <div className={`flex items-center ${permissions.canManageLabs ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-2">{permissions.canManageLabs ? '✅' : '❌'}</span>
              Manage Labs
            </div>
            <div className={`flex items-center ${permissions.canManageProtocols ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-2">{permissions.canManageProtocols ? '✅' : '❌'}</span>
              Manage Protocols
            </div>
            <div className={`flex items-center ${permissions.canManageInventory ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-2">{permissions.canManageInventory ? '✅' : '❌'}</span>
              Manage Inventory
            </div>
            <div className={`flex items-center ${permissions.canManageInstruments ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-2">{permissions.canManageInstruments ? '✅' : '❌'}</span>
              Manage Instruments
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Access Control Test</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Lab Management Access:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                permissions.canManageLabs ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {permissions.canManageLabs ? 'ALLOWED' : 'DENIED'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Inventory Access:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                permissions.canManageInventory ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {permissions.canManageInventory ? 'ALLOWED' : 'DENIED'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Protocol Management:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                permissions.canManageProtocols ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {permissions.canManageProtocols ? 'ALLOWED' : 'DENIED'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">🔍 Debug Information</h4>
          <div className="text-sm text-yellow-700">
            <p><strong>Raw User Object:</strong></p>
            <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleTestComponent;
