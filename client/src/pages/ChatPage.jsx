import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const [chat, setChat] = useState(null);
  const [task, setTask] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get(`/chats/task/${taskId}`),
      api.get(`/tasks/${taskId}`),
    ]).then(([chatRes, taskRes]) => {
      setChat(chatRes.data.chat);
      setTask(taskRes.data.task);
    }).catch(() => toast.error('Failed to load chat'))
      .finally(() => setLoading(false));
  }, [taskId]);

  // Join socket room + listen for messages
  useEffect(() => {
    if (!socket) return;
    socket.emit('chat:join', taskId);
    const handler = (msg) => {
      setChat(prev => {
        if (!prev) return prev;
        // Avoid duplicates if it's our own message echoed back
        const exists = prev.messages.some(m => m._id === msg._id);
        if (exists) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      });
    };
    socket.on('chat:message', handler);
    return () => socket.off('chat:message', handler);
  }, [socket, taskId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/chats/task/${taskId}/message`, { text });
      // Add our own message immediately (socket will echo to others)
      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, data.message],
      }));
      setText('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const isMe = (msg) => msg.sender?._id === user?._id || msg.sender === user?._id;

  if (loading) return (
    <div className="pt-24 flex justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!chat) return (
    <div className="pt-24 text-center">
      <p className="text-[#555]">Chat not available</p>
      <Link to="/dashboard" className="text-accent mt-3 inline-block">← Dashboard</Link>
    </div>
  );

  const other = chat.participants?.find(p => p._id !== user?._id);

  return (
    <div className="pt-16 h-screen flex flex-col">
      {/* Chat header */}
      <div className="border-b border-[#222] bg-[#111] px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link to={`/tasks/${taskId}`} className="text-[#555] hover:text-accent transition-colors">←</Link>
        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
          {other?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{other?.name || 'Participant'}</div>
          <div className="text-xs text-[#555] truncate">{task?.title}</div>
        </div>
        <Link to={`/tasks/${taskId}`}
          className="text-xs text-[#555] hover:text-accent border border-[#222] hover:border-accent/40 px-3 py-1.5 rounded-lg transition-colors">
          View Task
        </Link>
        {/* Status badge */}
        <span className={`status-${task?.status} text-xs font-bold px-2.5 py-1 rounded-full`}>
          {task?.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {chat.messages.length === 0 && (
          <div className="text-center text-[#444] text-sm py-10">
            No messages yet. Say hi! 👋
          </div>
        )}
        {chat.messages.map((msg, i) => {
          const mine = isMe(msg);
          const isSystem = msg.type === 'system';

          if (isSystem) return (
            <div key={msg._id || i} className="text-center">
              <span className="text-xs text-[#444] bg-[#161616] border border-[#222] px-4 py-1.5 rounded-full">
                {msg.text}
              </span>
            </div>
          );

          return (
            <div key={msg._id || i} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs"
                style={{ background: mine ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.08)', color: mine ? '#f5a623' : '#888' }}>
                {(msg.sender?.name || user?.name)?.[0]?.toUpperCase()}
              </div>

              {/* Bubble */}
              <div className={`max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  mine
                    ? 'bg-accent/15 border border-accent/25 text-white rounded-tr-sm'
                    : 'bg-[#161616] border border-[#222] text-[#ccc] rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
                <div className="text-[11px] text-[#444] px-1">
                  {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : 'now'}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#222] bg-[#111] px-6 py-4 flex-shrink-0">
        {task?.status === 'completed' ? (
          <div className="text-center text-[#444] text-sm py-2">
            This task is completed. Chat is read-only.
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex gap-3 items-end">
            <textarea
              rows={1}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message... (Enter to send)"
              className="flex-1 bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <button
              type="submit" disabled={!text.trim() || sending}
              className="bg-accent text-black font-bold w-11 h-11 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center flex-shrink-0"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        )}
        <p className="text-[10px] text-[#333] text-center mt-2">
          🔒 Messages are private between task participants only
        </p>
      </div>
    </div>
  );
}
