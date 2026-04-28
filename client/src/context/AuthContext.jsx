import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { setTokenGetter } from '../utils/tokenStore';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken, isSignedIn } = useClerkAuth();

  // MongoDB user profile
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register Clerk's getToken so api.js can attach it to requests
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // When Clerk's auth state changes, sync the MongoDB profile
  useEffect(() => {
    if (!clerkLoaded) return;

    if (!clerkUser || !isSignedIn) {
      // Signed out
      setUser(null);
      setLoading(false);
      return;
    }

    // Signed in — wait for a valid token before calling /auth/me
    let cancelled = false;
    setLoading(true);

    const syncProfile = async () => {
      try {
        // Ensure we actually have a token before making the request
        const token = await getToken();
        if (!token || cancelled) {
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const { data } = await api.get('/auth/me');
        if (!cancelled) setUser(data.user);
      } catch (err) {
        console.error('Auth sync failed:', err.response?.status, err.message);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    syncProfile();

    return () => { cancelled = true; };
  }, [clerkUser, clerkLoaded, isSignedIn, getToken]);

  // Allow components to update the cached MongoDB profile (e.g. after profile edit)
  const updateUser = useCallback((updated) => setUser(updated), []);

  return (
    <AuthContext.Provider value={{ user, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
