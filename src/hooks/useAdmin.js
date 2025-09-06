import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import moderatorsData from '../data/moderators.json';

export function useAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    console.log('🔍 useAdmin Debug:', { 
      isLoading, 
      isAuthenticated, 
      userId: user?.id, 
      username: user?.username,
      moderators: moderatorsData.map(m => m.id)
    });
    
    // Wait until we have a definitive authentication state
    if (isLoading) {
      return; // Don't do anything while auth is still loading
    }
    
    if (isAuthenticated && user) {
      const userIsModerator = moderatorsData.some(moderator => moderator.id === user.id);
      console.log('🔍 Admin check result:', { userIsModerator, userId: user.id });
      setIsAdmin(userIsModerator);
      setIsCheckingAdmin(false);
    } else if (!isAuthenticated) {
      setIsAdmin(false);
      setIsCheckingAdmin(false);
    }
  }, [user, isAuthenticated, isLoading]);

  return {
    isAdmin,
    isCheckingAdmin,
    isLoading: isLoading || isCheckingAdmin
  };
}