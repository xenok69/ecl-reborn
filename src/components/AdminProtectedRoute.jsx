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

  console.log('🔍 AdminProtectedRoute Debug:');
  console.log('isLoading:', isLoading);
  console.log('isCheckingAdmin:', isCheckingAdmin);
  console.log('isAuthenticated:', isAuthenticated);
  console.log('isAdmin:', isAdmin);
  console.log('user:', user);

  if (isLoading || isCheckingAdmin) {
    console.log('❌ Returning null due to loading state');
    return null;
  }

  if (!isAuthenticated) {
    console.log('❌ Redirecting to signin - not authenticated');
    if (fallback) {
      return fallback;
    }
    
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    console.log('❌ Redirecting to home - not admin, isAdmin:', isAdmin);
    return <Navigate to="/" replace />;
  }

  console.log('✅ Rendering protected content - user is admin!');
  return children;
}