import { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { setTokenGetter } from '../utils/tokenStore';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useClerkAuth();

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

    if (!clerkUser) {
      // Signed out
      setUser(null);
      setLoading(false);
      return;
    }

    // Signed in — fetch (or lazy-create) the MongoDB profile
    setLoading(true);
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [clerkUser, clerkLoaded]);

  // Allow components to update the cached MongoDB profile (e.g. after profile edit)
  const updateUser = (updated) => setUser(updated);

  return (
    <AuthContext.Provider value={{ user, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
