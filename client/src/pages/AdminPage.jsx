import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Shield, Users, ClipboardList, DollarSign, AlertTriangle,
  Search, ChevronRight, Trash2, ShieldCheck, ShieldOff,
  CheckCircle2, XCircle, Eye, RefreshCw,
} from 'lucide-react';

const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  pending_review: 'Pending Review', completed: 'Completed',
  disputed: 'Disputed', cancelled: 'Cancelled',
};

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [taskFilter, setTaskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Guard: redirect non-admins
  if (user && !user.isAdmin) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (tab === 'tasks') loadTasks();
    if (tab === 'users') loadUsers();
  }, [tab, taskFilter]);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch { toast.error('Failed to load stats'); }
    setLoading(false);
  };

  const loadTasks = async () => {
    try {
      const params = { limit: 50 };
      if (taskFilter !== 'all') params.status = taskFilter;
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get('/admin/tasks', { params });
      setTasks(data.tasks);
    } catch { toast.error('Failed to load tasks'); }
  };

  const loadUsers = async () => {
    try {
      const params = { limit: 50 };
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
    } catch { toast.error('Failed to load users'); }
  };

  const resolveTask = async (taskId, action) => {
    try {
      await api.put(`/admin/tasks/${taskId}/resolve`, { action });
      toast.success(`Task ${action === 'release' ? 'resolved & paid' : 'refunded'}`);
      loadTasks();
      loadStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const cancelTask = async (taskId) => {
    try {
      await api.put(`/admin/tasks/${taskId}/cancel`);
      toast.success('Task cancelled');
      loadTasks();
      loadStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleAdmin = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle-admin`);
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
      toast.success(`Admin status toggled`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (tab === 'tasks') loadTasks();
    if (tab === 'users') loadUsers();
  };

  if (loading) return (
    <div className="pt-24 flex justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = stats ? [
    ['Total Users', stats.totalUsers, <Users key="u" className="w-6 h-6 text-indigo-400" />],
    ['Total Tasks', stats.totalTasks, <ClipboardList key="t" className="w-6 h-6 text-blue-400" />],
    ['Open', stats.openTasks, <CheckCircle2 key="o" className="w-6 h-6 text-green-400" />],
    ['Active', stats.activeTasks, <RefreshCw key="a" className="w-6 h-6 text-cyan-400" />],
    ['Pending Review', stats.pendingReviewTasks, <AlertTriangle key="p" className="w-6 h-6 text-amber-400" />],
    ['Disputed', stats.disputedTasks, <AlertTriangle key="d" className="w-6 h-6 text-red-400" />],
    ['Completed', stats.completedTasks, <CheckCircle2 key="c" className="w-6 h-6 text-indigo-400" />],
    ['Revenue', `₹${stats.totalRevenue?.toLocaleString('en-IN')}`, <DollarSign key="r" className="w-6 h-6 text-accent" />],
  ] : [];

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-7 h-7 text-accent" />
          <h1 className="font-head font-extrabold text-3xl tracking-tight">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[['overview', 'Overview'], ['tasks', 'Tasks'], ['users', 'Users']].map(([val, label]) => (
            <button key={val} onClick={() => { setTab(val); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === val ? 'bg-accent text-black' : 'bg-[#161616] border border-[#222] text-[#666] hover:border-accent/40'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(([label, value, icon], i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#161616] border border-[#222] rounded-2xl p-5 text-center hover:border-accent/30 transition-colors"
              >
                <div className="flex justify-center mb-3">{icon}</div>
                <div className="font-head font-extrabold text-xl text-white">{value}</div>
                <div className="text-xs text-[#555] mt-1">{label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..." className="w-full bg-[#111] border border-[#222] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
                </div>
                <button type="submit" className="bg-accent text-black px-4 py-2.5 rounded-xl text-sm font-bold">Search</button>
              </form>
              <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
                className="bg-[#111] border border-[#222] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent">
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-16 text-[#555]">No tasks found</div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task._id} className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center gap-4 hover:border-accent/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`status-${task.status} text-xs font-bold px-2.5 py-0.5 rounded-full`}>{STATUS_LABELS[task.status]}</span>
                        {task.paymentStatus !== 'unpaid' && (
                          <span className="text-xs text-[#666] bg-[#111] px-2 py-0.5 rounded-full">{task.paymentStatus}</span>
                        )}
                      </div>
                      <div className="font-medium text-sm text-white truncate">{task.title}</div>
                      <div className="text-xs text-[#555] mt-1">
                        by {task.poster?.name || 'Unknown'} · ₹{task.budget?.toLocaleString('en-IN')}
                        {task.assignedTo && <> · → {task.assignedTo.name}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/tasks/${task._id}`} className="p-2 rounded-lg border border-[#222] hover:border-accent text-[#666] hover:text-accent transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {task.status === 'disputed' && (
                        <>
                          <button onClick={() => resolveTask(task._id, 'release')} title="Release payment"
                            className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => resolveTask(task._id, 'refund')} title="Refund poster"
                            className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!['completed', 'cancelled'].includes(task.status) && (
                        <button onClick={() => cancelTask(task._id)} title="Cancel task"
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..." className="w-full bg-[#111] border border-[#222] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent" />
              </div>
              <button type="submit" className="bg-accent text-black px-4 py-2.5 rounded-xl text-sm font-bold">Search</button>
            </form>

            {users.length === 0 ? (
              <div className="text-center py-16 text-[#555]">No users found</div>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u._id} className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center gap-4 hover:border-accent/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold flex-shrink-0">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-white">{u.name}</span>
                        {u.isAdmin && <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-bold">Admin</span>}
                      </div>
                      <div className="text-xs text-[#555] truncate">{u.email}</div>
                      <div className="text-xs text-[#444] mt-1">
                        {u.tasksPosted} posted · {u.tasksDone} done · ₹{(u.totalEarned || 0).toLocaleString('en-IN')} earned
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/profile/${u._id}`} className="p-2 rounded-lg border border-[#222] hover:border-accent text-[#666] hover:text-accent transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => toggleAdmin(u._id)} title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                        className={`p-2 rounded-lg transition-colors ${u.isAdmin ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'}`}>
                        {u.isAdmin ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteUser(u._id)} title="Delete user"
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
