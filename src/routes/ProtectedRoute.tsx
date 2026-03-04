import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const role = (user?.role || user?.roleName) as Role;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Unauthorized access
    // Unauthorized access - Redirect to login as per requirements
    // This handles cases where a user might try to access a route they don't have permission for
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
