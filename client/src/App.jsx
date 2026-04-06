import { Routes, Route, Navigate } from 'react-router-dom';
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

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AppInner = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to="/browse" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/browse" /> : <Register />} />
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
