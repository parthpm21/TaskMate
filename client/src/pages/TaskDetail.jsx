import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  completed: 'Completed', disputed: 'Disputed', cancelled: 'Cancelled',
};

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidForm, setBidForm] = useState({ amount: '', message: '', deliveryTime: '' });
  const [bidding, setBidding] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);

  const isPoster = user && task?.poster?._id === user._id;
  const isAssigned = user && task?.assignedTo?._id === user._id;
  const myBid = bids.find(b => b.bidder?._id === user?._id);

  useEffect(() => {
    Promise.all([
      api.get(`/tasks/${id}`),
      user && api.get(`/bids/task/${id}`).catch(() => ({ data: { bids: [] } })),
    ]).then(([taskRes, bidsRes]) => {
      setTask(taskRes.data.task);
      if (bidsRes) setBids(bidsRes.data.bids);
    }).catch(() => toast.error('Task not found'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const placeBid = async (e) => {
    e.preventDefault();
    setBidding(true);
    try {
      const { data } = await api.post('/bids', { taskId: id, ...bidForm });
      setBids(prev => [data.bid, ...prev]);
      setTask(t => ({ ...t, bidsCount: t.bidsCount + 1 }));
      setShowBidForm(false);
      setBidForm({ amount: '', message: '', deliveryTime: '' });
      toast.success('Bid placed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  const acceptBid = async (bidId) => {
    try {
      const { data } = await api.put(`/bids/${bidId}/accept`);
      setTask(data.task);
      setBids(prev => prev.map(b => ({ ...b, status: b._id === bidId ? 'accepted' : 'rejected' })));
      toast.success('Bid accepted! Chat is now open.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept bid');
    }
  };

  const markComplete = async () => {
    try {
      const { data } = await api.put(`/tasks/${id}/complete`);
      setTask(data.task);
      toast.success('Task marked as complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const startTask = async () => {
    const myAcceptedBid = bids.find(b => b.bidder?._id === user?._id && b.status === 'accepted');
    if (!myAcceptedBid) return;
    try {
      await api.put(`/bids/${myAcceptedBid._id}/start`);
      setTask(t => ({ ...t, status: 'in_progress' }));
      toast.success('Task started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return (
    <div className="pt-24 flex justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!task) return (
    <div className="pt-24 text-center">
      <h2 className="font-head font-bold text-2xl">Task not found</h2>
      <Link to="/browse" className="text-accent mt-4 inline-block">← Back to Browse</Link>
    </div>
  );

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link to="/browse" className="text-[#555] text-sm hover:text-accent transition-colors mb-6 inline-flex items-center gap-1">
          ← Back to Browse
        </Link>

        <div className="grid md:grid-cols-3 gap-8 mt-4">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Task header */}
            <div className="bg-[#161616] border border-[#222] rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`pill-${task.category} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
                  {task.category}
                </span>
                <span className={`status-${task.status} text-xs font-bold px-3 py-1 rounded-full`}>
                  {STATUS_LABELS[task.status]}
                </span>
                {task.isUrgent && <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">⚡ Urgent</span>}
              </div>

              <h1 className="font-head font-extrabold text-2xl md:text-3xl tracking-tight mb-4">{task.title}</h1>
              <p className="text-[#888] leading-relaxed mb-6">{task.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  ['💰', 'Budget', `₹${task.budget?.toLocaleString('en-IN')}`],
                  ['📍', 'Location', task.location?.isRemote ? 'Remote' : (task.location?.city || 'Nearby')],
                  ['⏰', 'Deadline', format(new Date(task.deadline), 'dd MMM yyyy')],
                  ['💬', 'Bids', task.bidsCount],
                  ['📅', 'Posted', formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })],
                ].map(([icon, label, value]) => (
                  <div key={label} className="bg-[#111] rounded-xl p-3">
                    <div className="text-[11px] text-[#444] uppercase tracking-wider mb-1">{icon} {label}</div>
                    <div className="text-sm font-medium text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons for involved parties */}
            {user && task.status === 'open' && !isPoster && !myBid && (
              <div>
                {!showBidForm ? (
                  <button
                    onClick={() => setShowBidForm(true)}
                    className="w-full bg-accent text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity text-base"
                  >
                    Place a Bid
                  </button>
                ) : (
                  <form onSubmit={placeBid} className="bg-[#161616] border border-[#222] rounded-2xl p-6 space-y-4">
                    <h3 className="font-head font-bold text-lg">Your Bid</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">Your Price (₹)</label>
                        <input
                          type="number" required min="1"
                          value={bidForm.amount}
                          onChange={e => setBidForm(f => ({ ...f, amount: e.target.value }))}
                          className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                          placeholder={task.budget}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">Delivery Time</label>
                        <input
                          type="text"
                          value={bidForm.deliveryTime}
                          onChange={e => setBidForm(f => ({ ...f, deliveryTime: e.target.value }))}
                          className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                          placeholder="e.g. 2 hours"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">Message to poster</label>
                      <textarea
                        required rows={3}
                        value={bidForm.message}
                        onChange={e => setBidForm(f => ({ ...f, message: e.target.value }))}
                        className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent transition-colors resize-none"
                        placeholder="Explain why you're the right person for this task..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={bidding} className="flex-1 bg-accent text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
                        {bidding ? 'Placing bid...' : 'Submit Bid'}
                      </button>
                      <button type="button" onClick={() => setShowBidForm(false)} className="px-6 border border-[#222] rounded-xl text-[#666] hover:border-accent hover:text-accent transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {myBid && (
              <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-green-400 font-bold mb-1">✅ Your bid is placed</div>
                <p className="text-[#888] text-sm">You bid ₹{myBid.amount} — waiting for poster to respond.</p>
              </div>
            )}

            {isAssigned && task.status === 'assigned' && (
              <button onClick={startTask} className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-colors">
                Start Task
              </button>
            )}

            {(isPoster || isAssigned) && task.status === 'in_progress' && (
              <button onClick={markComplete} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-colors">
                Mark as Complete
              </button>
            )}

            {(isPoster || isAssigned) && ['assigned', 'in_progress'].includes(task.status) && (
              <Link to={`/chat/${task._id}`} className="w-full flex items-center justify-center gap-2 border border-[#222] hover:border-accent text-[#ccc] hover:text-accent font-medium py-4 rounded-xl transition-all">
                💬 Open Chat
              </Link>
            )}

            {/* Bids list (poster only) */}
            {isPoster && bids.length > 0 && (
              <div className="bg-[#161616] border border-[#222] rounded-2xl p-6">
                <h3 className="font-head font-bold text-lg mb-5">Bids ({bids.length})</h3>
                <div className="space-y-4">
                  {bids.map(bid => (
                    <div key={bid._id} className={`border rounded-xl p-4 transition-colors ${
                      bid.status === 'accepted' ? 'border-green-500/40 bg-green-500/5' :
                      bid.status === 'rejected' ? 'border-[#1e1e1e] opacity-50' :
                      'border-[#222] hover:border-accent/30'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                            {bid.bidder?.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{bid.bidder?.name}</div>
                            <div className="text-xs text-[#555]">⭐ {bid.bidder?.rating?.toFixed(1) || 'New'} · {bid.bidder?.tasksDone} tasks done</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-head font-extrabold text-accent text-lg">₹{bid.amount}</div>
                          {bid.deliveryTime && <div className="text-xs text-[#555]">{bid.deliveryTime}</div>}
                        </div>
                      </div>
                      <p className="text-[#777] text-sm mt-3 leading-relaxed">{bid.message}</p>
                      {task.status === 'open' && bid.status === 'pending' && (
                        <button onClick={() => acceptBid(bid._id)} className="mt-3 bg-accent text-black text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                          Accept this Bid
                        </button>
                      )}
                      {bid.status === 'accepted' && <span className="mt-2 inline-block text-xs font-bold text-green-400">✓ Accepted</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Poster card */}
            <div className="bg-[#161616] border border-[#222] rounded-2xl p-5">
              <h3 className="text-xs font-bold text-[#555] uppercase tracking-wider mb-4">Posted by</h3>
              <Link to={`/profile/${task.poster?._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                  {task.poster?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{task.poster?.name}</div>
                  <div className="text-xs text-[#555]">⭐ {task.poster?.rating?.toFixed(1) || 'New'} · {task.poster?.tasksPosted} tasks posted</div>
                </div>
              </Link>
            </div>

            {/* Assigned to */}
            {task.assignedTo && (
              <div className="bg-[#161616] border border-green-500/25 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-4">Assigned to</h3>
                <Link to={`/profile/${task.assignedTo?._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-lg">
                    {task.assignedTo?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{task.assignedTo?.name}</div>
                    <div className="text-xs text-[#555]">⭐ {task.assignedTo?.rating?.toFixed(1) || 'New'}</div>
                  </div>
                </Link>
              </div>
            )}

            {/* Final amount */}
            {task.finalAmount && (
              <div className="bg-[#161616] border border-[#222] rounded-2xl p-5 text-center">
                <div className="text-xs text-[#555] uppercase tracking-wider mb-1">Agreed Price</div>
                <div className="font-head font-extrabold text-3xl text-accent">₹{task.finalAmount?.toLocaleString('en-IN')}</div>
                <div className="text-xs text-[#444] mt-1">Held in escrow</div>
              </div>
            )}

            {/* Safety note */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
              <div className="text-xs font-bold text-[#555] uppercase tracking-wider mb-3">🔒 Safe & Secure</div>
              <ul className="space-y-2 text-xs text-[#555]">
                <li>✓ Payment held in escrow</li>
                <li>✓ No phone number sharing</li>
                <li>✓ Both sides rated after task</li>
                <li>✓ Dispute resolution available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
