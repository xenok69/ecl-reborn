import { useAuth } from '../hooks/useAuth';
import { Navigate, useLocation } from 'react-router';
import { useLoading } from './LoadingContext';
import { useEffect, useState } from 'react';
import moderatorsData from '../data/moderators.json';

export default function AdminProtectedRoute({ children, fallback = null, redirectTo = '/signin' }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { setIsLoading } = useLoading();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    setIsLoading(isLoading || isCheckingAdmin);
    
    return () => {
      if (!isLoading && !isCheckingAdmin) {
        setIsLoading(false);
      }
    };
  }, [isLoading, isCheckingAdmin, setIsLoading]);

  useEffect(() => {
    if (user && isAuthenticated) {
      const userIsModerator = moderatorsData.some(moderator => moderator.id === user.id);
      setIsAdmin(userIsModerator);
    } else {
      setIsAdmin(false);
    }
    setIsCheckingAdmin(false);
  }, [user, isAuthenticated]);

  if (isLoading || isCheckingAdmin) {
    return null;
  }

  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}