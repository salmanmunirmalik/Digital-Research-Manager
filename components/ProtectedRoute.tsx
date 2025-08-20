import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessRoute, hasMinimumRole, hasAllowedRole } from '../utils/roleAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  allowedRoles?: string[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  fallbackPath = '/login'
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole || allowedRoles) {
    const userRole = user.role;
    
    // Debug logging
    console.log(`🔐 Route Protection Check:`);
    console.log(`   User: ${user.email} (${user.first_name} ${user.last_name})`);
    console.log(`   User Role: ${userRole}`);
    console.log(`   Required Role: ${requiredRole}`);
    console.log(`   Allowed Roles: ${allowedRoles}`);
    
    // Check if user has required role (exact match)
    if (requiredRole) {
      const required = Array.isArray(requiredRole) 
        ? requiredRole
        : [requiredRole];
      
      if (!hasAllowedRole(userRole, required)) {
        console.log(`❌ Access denied: User role ${userRole} not in required roles ${required}`);
        return <Navigate to="/unauthorized" replace />;
      }
    }
    
    // Check if user has one of the allowed roles
    if (allowedRoles) {
      if (!hasAllowedRole(userRole, allowedRoles)) {
        console.log(`❌ Access denied: User role ${userRole} not in allowed roles ${allowedRoles}`);
        return <Navigate to="/unauthorized" replace />;
      }
    }
    
    console.log(`✅ Access granted for user role ${userRole}`);
  }

  return <>{children}</>;
};

export default ProtectedRoute;
