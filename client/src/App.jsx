import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import TaskDetail from './pages/TaskDetail';
import PostTask from './pages/PostTask';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ChatPage from './pages/ChatPage';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

// Guard for routes that need the user to be signed in.
// Waits for BOTH Clerk's session AND the MongoDB profile sync to complete
// before making any redirect decision — prevents false /login bounces.
const PrivateRoute = ({ children }) => {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { user, loading } = useAuth();

  // Still initialising — show spinner, never redirect yet
  if (!clerkLoaded || loading) return <Spinner />;

  // Clerk says not signed in → send to login
  if (!isSignedIn) return <Navigate to="/login" replace />;

  // Clerk says signed in but MongoDB sync failed (network error, etc.)
  // Allow through — the page itself can handle a missing profile gracefully
  return user ? children : <Spinner />;
};

const AppInner = () => {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();

  // Don't render auth-dependent route guards until Clerk has hydrated.
  // Without this, isSignedIn is always false on first render and
  // immediately redirects signed-in users away from /login before
  // Clerk's session cookie is read.
  if (!clerkLoaded) return <Spinner />;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* Use wildcard paths so Clerk's internal sub-routes (/login/factor-one, /login/sso-callback, etc.) work correctly */}
        <Route path="/login/*" element={isSignedIn ? <Navigate to="/browse" replace /> : <Login />} />
        <Route path="/register/*" element={isSignedIn ? <Navigate to="/browse" replace /> : <Register />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/post" element={<PrivateRoute><PostTask /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/chat/:taskId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppInner />
      </SocketProvider>
    </AuthProvider>
  );
}
