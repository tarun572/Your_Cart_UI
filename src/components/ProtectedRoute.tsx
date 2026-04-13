import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  
  if (!user) {
    console.log('🔒 Access denied - redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
