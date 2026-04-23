import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, CheckCircle2, Wallet, Award, Wrench, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  open: 'status-open', assigned: 'status-assigned', in_progress: 'status-in_progress',
  completed: 'status-completed', disputed: 'status-disputed', cancelled: 'status-cancelled',
};
const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  completed: 'Completed', disputed: 'Disputed', cancelled: 'Cancelled',
};

export default function Dashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [tab, setTab] = useState('posted');
  const [postedTasks, setPostedTasks] = useState([]);
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks/my/posted'),
      api.get('/tasks/my/accepted'),
    ]).then(([posted, accepted]) => {
      setPostedTasks(posted.data.tasks);
      setAcceptedTasks(accepted.data.tasks);
    }).catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  // Real-time: remove tasks that have just been auto-deleted by the expiry job
  useEffect(() => {
    if (!socket) return;
    const handleExpired = ({ expiredIds }) => {
      const expiredSet = new Set(expiredIds.map(String));
      setPostedTasks(prev => prev.filter(t => !expiredSet.has(String(t._id))));
      setAcceptedTasks(prev => prev.filter(t => !expiredSet.has(String(t._id))));
      toast('⏰ Some of your tasks expired and were automatically removed.', {
        style: { background: '#1a1a1a', color: '#ccc', border: '1px solid #333' },
      });
    };
    socket.on('tasks:expired', handleExpired);
    return () => socket.off('tasks:expired', handleExpired);
  }, [socket]);

  const tasks = tab === 'posted' ? postedTasks : acceptedTasks;

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-head font-extrabold text-3xl tracking-tight">Dashboard</h1>
            <p className="text-[#555] text-sm mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <Link to="/post" className="bg-accent text-black font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
            + Post New Task
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['Tasks Posted', user?.tasksPosted || 0, <ClipboardList key="clip" className="w-6 h-6 text-indigo-400 mx-auto" />],
            ['Tasks Done', user?.tasksDone || 0, <CheckCircle2 key="check" className="w-6 h-6 text-green-400 mx-auto" />],
            ['Total Earned', `₹${(user?.totalEarned || 0).toLocaleString('en-IN')}`, <Wallet key="wallet" className="w-6 h-6 text-accent mx-auto" />],
            ['Rating', user?.rating ? `${user.rating.toFixed(1)} / 5.0` : 'No reviews', <Award key="award" className="w-6 h-6 text-yellow-400 mx-auto" />],
          ].map(([label, value, icon], index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
              key={label} className="bg-[#161616] border border-[#222] rounded-2xl p-5 text-center hover:border-accent/30 transition-colors"
            >
              <div className="mb-3">{icon}</div>
              <div className="font-head font-extrabold text-xl text-white">{value}</div>
              <div className="text-xs text-[#555] mt-1">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[['posted', `Tasks I Posted (${postedTasks.length})`], ['accepted', `Tasks I'm Doing (${acceptedTasks.length})`]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === val ? 'bg-accent text-black' : 'bg-[#161616] border border-[#222] text-[#666] hover:border-accent/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#161616] border border-[#222] rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-[#161616] border border-[#222] rounded-2xl"
          >
            <div className="flex justify-center mb-4">
              {tab === 'posted' ? <ClipboardList className="w-12 h-12 text-[#444]" /> : <Wrench className="w-12 h-12 text-[#444]" />}
            </div>
            <h3 className="font-head font-bold text-lg mb-2 text-white">No tasks yet</h3>
            <p className="text-[#555] text-sm mb-6">
              {tab === 'posted' ? "You haven't posted any tasks yet." : "You haven't accepted any tasks yet."}
            </p>
            {tab === 'posted' && (
              <Link to="/post" className="bg-accent text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm inline-block">
                Post your first task
              </Link>
            )}
            {tab === 'accepted' && (
              <Link to="/browse" className="bg-accent text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm inline-block">
                Browse available tasks
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task, index) => (
                <motion.div 
                  key={task._id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/tasks/${task._id}`}
                    className="flex items-center gap-4 bg-[#161616] border border-[#222] rounded-2xl p-5 hover:border-accent/40 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`${STATUS_COLORS[task.status]} text-xs font-bold px-2.5 py-0.5 rounded-full`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                        <span className={`pill-${task.category} text-xs font-bold px-2.5 py-0.5 rounded-full`}>
                          {task.category}
                        </span>
                      </div>
                      <h3 className="font-medium text-[15px] text-white group-hover:text-accent transition-colors truncate">{task.title}</h3>
                      <div className="text-xs text-[#666] mt-1.5 flex items-center gap-2">
                        <span>Deadline: {format(new Date(task.deadline), 'dd MMM yyyy')}</span>
                        {tab === 'posted' && task.assignedTo && (
                          <><span>•</span><span className="text-[#888]">Assigned to {task.assignedTo.name}</span></>
                        )}
                        {tab === 'accepted' && (
                          <><span>•</span><span className="text-[#888]">Posted by {task.poster?.name}</span></>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-head font-extrabold text-white text-lg">₹{task.budget?.toLocaleString('en-IN')}</div>
                      {task.bidsCount > 0 && tab === 'posted' && (
                        <div className="text-xs text-accent mt-1">{task.bidsCount} bids</div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#444] group-hover:text-accent transition-colors ml-2" />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
