import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Create socket ONCE on mount — never re-create on user changes
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
    socketRef.current = io(SOCKET_URL, { autoConnect: false });
    socketRef.current.connect();

    return () => {
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, []); // ← empty deps: only runs once

  // Emit user:online when user changes, after socket is connected
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user?._id) return;

    const emitOnline = () => socket.emit('user:online', user._id);

    if (socket.connected) {
      emitOnline();
    } else {
      socket.on('connect', emitOnline);
    }

    return () => {
      socket.off('connect', emitOnline);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);