import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import TaskCard from '../components/TaskCard';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const CATEGORIES = ['all', 'delivery', 'academic', 'tech', 'household', 'tutoring', 'transport', 'events', 'personal', 'other'];
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'budget_high', label: 'Budget: High to Low' },
  { value: 'budget_low', label: 'Budget: Low to High' },
  { value: 'deadline', label: 'Deadline soonest' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [searchInput, setSearchInput] = useState(search);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    p.set(key, value);
    if (key !== 'page') p.set('page', '1');
    setSearchParams(p);
  };

  useEffect(() => {
    setLoading(true);
    const params = { status: 'open', page, sort };
    if (category !== 'all') params.category = category;
    if (search) params.search = search;

    api.get('/tasks', { params })
      .then(({ data }) => {
        setTasks(data.tasks);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [category, sort, search, page]);

  // Real-time: remove tasks that have just been auto-deleted by the expiry job
  useEffect(() => {
    if (!socket) return;
    const handleExpired = ({ expiredIds }) => {
      const expiredSet = new Set(expiredIds.map(String));
      setTasks(prev => prev.filter(t => !expiredSet.has(String(t._id))));
      setTotal(prev => Math.max(0, prev - expiredIds.length));
      toast('Some tasks expired and were automatically removed.', {
        icon: '⏰',
        style: { background: '#1a1a1a', color: '#ccc', border: '1px solid #333' },
      });
    };
    socket.on('tasks:expired', handleExpired);
    return () => socket.off('tasks:expired', handleExpired);
  }, [socket]);

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-head font-extrabold text-3xl tracking-tight mb-1">Browse Tasks</h1>
          <p className="text-[#555] text-sm">{total} tasks available right now</p>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setParam('search', searchInput); }}
              placeholder="Search tasks..."
              className="w-full bg-[#161616] border border-[#222] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={e => setParam('sort', e.target.value)}
            className="bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-sm text-[#ccc] focus:outline-none focus:border-accent transition-colors"
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setParam('category', cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                category === cat
                  ? 'bg-accent text-black'
                  : 'bg-[#161616] border border-[#222] text-[#666] hover:border-accent/40 hover:text-[#ccc]'
              }`}
            >
              {cat === 'all' ? 'All Tasks' : cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#161616] border border-[#222] rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-[#222] rounded w-1/3 mb-4" />
                <div className="h-5 bg-[#222] rounded w-3/4 mb-2" />
                <div className="h-4 bg-[#222] rounded w-full mb-4" />
                <div className="h-4 bg-[#222] rounded w-2/3 mb-6" />
                <div className="flex justify-between items-center pt-3 border-t border-[#1e1e1e]">
                  <div className="h-8 w-24 bg-[#222] rounded-full" />
                  <div className="h-7 w-16 bg-[#222] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-head font-bold text-xl mb-2">No tasks found</h3>
            <p className="text-[#555] text-sm">Try changing filters or be the first to post one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tasks.map(task => <TaskCard key={task._id} task={task} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {[...Array(pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setParam('page', String(i + 1))}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  page === i + 1
                    ? 'bg-accent text-black'
                    : 'bg-[#161616] border border-[#222] text-[#666] hover:border-accent/40'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
