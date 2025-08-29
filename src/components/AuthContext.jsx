import { createContext, useState, useEffect } from 'react';
import { DISCORD_CLIENT_ID, REDIRECT_URI } from '../config/discord.js';

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
            if (await validateUser(parsedUser)) {
              setUser(parsedUser);
            } else {
              localStorage.removeItem('ecl-user');
            }
          } catch (error) {
            console.error('Error parsing saved user data:', error);
            localStorage.removeItem('ecl-user');
          }
        }
      }
      setIsLoading(false);
    };

    handleDiscordCallback();
  }, []);

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

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('ecl-user');
    localStorage.removeItem('discord_oauth_state');
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