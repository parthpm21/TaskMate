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
import AdminPage from './pages/AdminPage';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

// Guard for routes that need the user to be signed in.
// Only waits for Clerk's session — the MongoDB profile loads in the background
// so the page renders immediately after Clerk confirms sign-in.
const PrivateRoute = ({ children }) => {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();

  // Still initialising Clerk — show spinner, never redirect yet
  if (!clerkLoaded) return <Spinner />;

  // Clerk says not signed in → send to login
  if (!isSignedIn) return <Navigate to="/login" replace />;

  // Clerk says signed in → render immediately (MongoDB profile loads in background)
  return children;
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
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
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
