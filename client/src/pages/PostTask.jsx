import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['delivery', 'academic', 'tech', 'household', 'tutoring', 'transport', 'events', 'personal', 'other'];
const CATEGORY_ICONS = {
  delivery: '📦', academic: '📚', tech: '💻', household: '🧹',
  tutoring: '🧑‍🏫', transport: '🚗', events: '🎉', personal: '🐾', other: '✨',
};

export default function PostTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', budget: '',
    deadline: '', isUrgent: false,
    location: { city: '', isRemote: false },
  });

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setLocation = (key, value) => setForm(f => ({ ...f, location: { ...f.location, [key]: value } }));

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Please select a category');
    setLoading(true);
    try {
      const { data } = await api.post('/tasks', form);
      toast.success('Task posted successfully!');
      navigate(`/tasks/${data.task._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-head font-extrabold text-3xl tracking-tight mb-2">Post a Task</h1>
          <p className="text-[#555] text-sm">Describe your task clearly to get the best bids.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-[#161616] border border-[#222] rounded-2xl p-6">
            <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Task Title *</label>
            <input
              type="text" required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={100}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-accent transition-colors"
              placeholder="e.g. Pick up parcel from Malviya Nagar post office"
            />
            <div className="text-right text-[11px] text-[#444] mt-1">{form.title.length}/100</div>
          </div>

          {/* Description */}
          <div className="bg-[#161616] border border-[#222] rounded-2xl p-6">
            <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Description *</label>
            <textarea
              required rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-accent transition-colors resize-none"
              placeholder="Give more details about what you need, any special requirements, what tools are needed..."
            />
          </div>

          {/* Category */}
          <div className="bg-[#161616] border border-[#222] rounded-2xl p-6">
            <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-4">Category *</label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat} type="button"
                  onClick={() => set('category', cat)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    form.category === cat
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-[#222] text-[#666] hover:border-accent/40 hover:text-[#ccc]'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs font-bold capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Budget + Deadline */}
          <div className="bg-[#161616] border border-[#222] rounded-2xl p-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Budget (₹) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] font-bold">₹</span>
                  <input
                    type="number" required min="10"
                    value={form.budget}
                    onChange={e => set('budget', e.target.value)}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-accent transition-colors"
                    placeholder="500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Deadline *</label>
                <input
                  type="date" required min={minDate}
                  value={form.deadline}
                  onChange={e => set('deadline', e.target.value)}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#161616] border border-[#222] rounded-2xl p-6">
            <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-4">Location</label>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setLocation('isRemote', !form.location.isRemote)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.location.isRemote ? 'bg-accent' : 'bg-[#333]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.location.isRemote ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-[#888]">Remote / Online task</span>
            </div>
            {!form.location.isRemote && (
              <input
                type="text"
                value={form.location.city}
                onChange={e => setLocation('city', e.target.value)}
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-accent transition-colors"
                placeholder="City or area (e.g. Jaipur, Malviya Nagar)"
              />
            )}
          </div>

          {/* Urgent toggle */}
          <div className="bg-[#161616] border border-[#222] rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">⚡ Mark as Urgent</div>
              <div className="text-xs text-[#555] mt-0.5">Urgent tasks appear highlighted in the feed</div>
            </div>
            <button
              type="button"
              onClick={() => set('isUrgent', !form.isUrgent)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isUrgent ? 'bg-accent' : 'bg-[#333]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.isUrgent ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-accent text-black font-bold text-base py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Task — It\'s Free'}
          </button>
        </form>
      </div>
    </div>
  );
}
