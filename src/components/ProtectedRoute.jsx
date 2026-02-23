import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole, canAccessRoute, getDefaultRedirect } from '../config/permissions';

export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const userRole = getUserRole();

  // Not logged in → redirect to auth page
  if (!authenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Check specific role requirement
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="card-glass p-12 text-center max-w-md border border-red-500/30 rounded-2xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="text-4xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-3">Access Denied</h2>
          <p className="text-gray-400 mb-2">
            This page is only available for <span className="text-neon-cyan font-semibold capitalize">{requiredRole}</span> accounts.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You are signed in as <span className="text-neon-purple font-semibold capitalize">{userRole}</span>.
          </p>
          <button
            onClick={() => window.location.href = getDefaultRedirect()}
            className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-950 rounded-lg font-bold text-sm shadow-lg shadow-neon-cyan/30 hover:shadow-neon-cyan/50 transition-all"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check route-level access
  if (!canAccessRoute(location.pathname)) {
    return <Navigate to={getDefaultRedirect()} replace />;
  }

  return children;
}
