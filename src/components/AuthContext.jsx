import { createContext, useState, useEffect } from 'react';
import { DISCORD_CLIENT_ID, REDIRECT_URI } from '../config/discord.js';
import { supabaseOperations } from '../lib/supabase.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleDiscordCallback = async () => {
      const fragmentParams = parseFragmentParams();
      
      if (fragmentParams.error) {
        console.error('Discord OAuth error:', fragmentParams.error);
        setIsLoading(false);
        return;
      }

      if (fragmentParams.access_token && fragmentParams.state === localStorage.getItem('discord_oauth_state')) {
        try {
          const userInfo = await fetchUserWithToken(fragmentParams.access_token);
          setUser(userInfo);
          localStorage.setItem('ecl-user', JSON.stringify(userInfo));
          localStorage.removeItem('discord_oauth_state');

          // Update user activity in Supabase when they login with username and avatar
          console.log('🚀 New user login detected, updating activity for user:', userInfo.id)
          try {
            await supabaseOperations.updateUserActivity(userInfo.id, {
              username: userInfo.username,
              avatar: userInfo.avatar
            });
          } catch (activityError) {
            console.warn('❌ Could not update user activity:', activityError);
          }

          window.location.hash = '';

          const url = new URL(window.location);
          window.history.replaceState({}, document.title, url.pathname + url.search);
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      } else {
        const savedUser = localStorage.getItem('ecl-user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // Set user optimistically first
            setUser(parsedUser);
            setIsLoading(false);

            // Update user activity for returning users with username and avatar
            console.log('🔄 Returning user detected, updating activity for user:', parsedUser.id)
            try {
              await supabaseOperations.updateUserActivity(parsedUser.id, {
                username: parsedUser.username,
                avatar: parsedUser.avatar
              });
            } catch (activityError) {
              console.warn('❌ Could not update user activity for returning user:', activityError);
            }

            // Then validate in the background
            validateUser(parsedUser).then(isValid => {
              if (!isValid) {
                setUser(null);
                localStorage.removeItem('ecl-user');
              }
            }).catch(error => {
              console.error('Error validating user:', error);
              setUser(null);
              localStorage.removeItem('ecl-user');
            });
          } catch (error) {
            console.error('Error parsing saved user data:', error);
            localStorage.removeItem('ecl-user');
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      }
    };

    handleDiscordCallback();
  }, []);

  // Set user offline when page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id) {
        // Use navigator.sendBeacon for reliable cleanup
        if (navigator.sendBeacon) {
          const data = new FormData();
          data.append('userId', user.id);
          data.append('action', 'setOffline');
          // This would need a serverless function to handle the beacon
          // For now, we'll just rely on session timeout
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  const parseFragmentParams = () => {
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);
    return {
      access_token: params.get('access_token'),
      token_type: params.get('token_type'),
      expires_in: params.get('expires_in'),
      scope: params.get('scope'),
      state: params.get('state'),
      error: params.get('error'),
    };
  };

  const fetchUserWithToken = async (accessToken) => {
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await userResponse.json();
    
    return {
      id: userData.id,
      username: userData.global_name || userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      provider: 'discord',
      accessToken: accessToken,
      signedInAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour default
    };
  };

  const validateUser = async (user) => {
    if (!user.accessToken || !user.expiresAt) return false;
    
    if (new Date(user.expiresAt) <= new Date()) {
      return false;
    }

    try {
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const signInWithDiscord = async () => {
    if (!DISCORD_CLIENT_ID) {
      console.error('Discord Client ID not configured. Please set VITE_DISCORD_CLIENT_ID in your environment variables.');
      return;
    }

    setIsLoading(true);
    
    try {
      const state = generateRandomState();
      localStorage.setItem('discord_oauth_state', state);

      const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'token',
        scope: 'identify',
        state: state,
      });

      window.location.href = `https://discord.com/api/oauth2/authorize?${params}`;
    } catch (error) {
      console.error('Discord sign-in failed:', error);
      setIsLoading(false);
    }
  };

  const generateRandomState = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const signOut = async () => {
    console.log('🚪 User signing out, user ID:', user?.id)

    if (user?.id) {
      try {
        console.log('🔄 Setting user offline in database...')
        await supabaseOperations.setUserOffline(user.id);
        console.log('✅ User set offline successfully')
      } catch (error) {
        console.warn('❌ Could not update offline status:', error);
      }
    }

    setUser(null);
    localStorage.removeItem('ecl-user');
    localStorage.removeItem('discord_oauth_state');
    console.log('🧹 User state cleared')
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithDiscord,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};