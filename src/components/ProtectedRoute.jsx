import { useAuth } from '../hooks/useAuth';
import { Navigate, useLocation } from 'react-router';
import { useLoading } from './LoadingContext';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, fallback = null, redirectTo = '/ecl-reborn/signin' }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { setIsLoading } = useLoading();
  const location = useLocation();

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
}