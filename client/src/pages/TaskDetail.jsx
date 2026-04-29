import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import PayButton from '../components/PayButton';
import ReleaseButton from '../components/ReleaseButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, MapPin, Clock, MessageCircle, CalendarDays, Lock, Rocket, CheckCircle2, PartyPopper, MessageSquare, Star, ArrowLeft } from 'lucide-react';

const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  pending_review: 'Pending Review', completed: 'Completed',
  disputed: 'Disputed', cancelled: 'Cancelled',
};

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
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

  // Fetch task data
  useEffect(() => {
    setLoading(true);
    api.get(`/tasks/${id}`)
      .then(({ data }) => setTask(data.task))
      .catch(() => toast.error('Task not found'))
      .finally(() => setLoading(false));
  }, [id]);

  // Real-time socket: join task room and listen for updates
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('chat:join', id);
    const handleUpdate = ({ taskId, status, paymentStatus }) => {
      if (String(taskId) === id) {
        setTask(t => t ? { ...t, status, ...(paymentStatus ? { paymentStatus } : {}) } : t);
      }
    };
    socket.on('task:updated', handleUpdate);
    return () => socket.off('task:updated', handleUpdate);
  }, [socket, id]);

  // Fetch bids separately — re-runs when user loads
  useEffect(() => {
    if (!user) {
      setBids([]);
      return;
    }
    api.get(`/bids/task/${id}`)
      .then(({ data }) => setBids(data.bids || []))
      .catch((err) => {
        // 403 = not the poster, try fetching own bid only
        if (err.response?.status === 403) {
          return api.get(`/bids/my/${id}`)
            .then(({ data }) => setBids(data.bid ? [data.bid] : []))
            .catch(() => setBids([]));
        }
        setBids([]);
      });
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

  const submitWork = async () => {
    try {
      const { data } = await api.put(`/tasks/${id}/submit`);
      setTask(data.task);
      toast.success('Work submitted for review!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
  };

  const approveWork = async () => {
    try {
      const { data } = await api.put(`/tasks/${id}/approve`);
      setTask(data.task);
      toast.success('Work approved! Payment released.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const [starting, setStarting] = useState(false);

  const startTask = async () => {
    setStarting(true);
    try {
      const { data } = await api.put(`/bids/start-by-task/${id}`);
      setTask(data.task);
      toast.success('🚀 Task started! Go get it done.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start task');
    } finally {
      setStarting(false);
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
          <ArrowLeft className="w-4 h-4" /> Back to Browse
        </Link>

        <div className="grid md:grid-cols-3 gap-8 mt-4">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Task header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#161616] border border-[#222] rounded-2xl overflow-hidden"
            >
              <div className="h-48 w-full relative">
                <img 
                  src={`https://picsum.photos/seed/${task._id}/800/400`} 
                  alt="Task cover" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161616] to-transparent" />
              </div>
              
              <div className="p-7 pt-0 relative z-10 -mt-12">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className={`pill-${task.category} text-xs font-bold px-3 py-1 rounded-full uppercase shadow-lg bg-[#161616]`}>
                    {task.category}
                  </span>
                  <span className={`status-${task.status} text-xs font-bold px-3 py-1 rounded-full shadow-lg bg-[#161616]`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  {task.isUrgent && <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full backdrop-blur-md">⚡ Urgent</span>}
                </div>

                <h1 className="font-head font-extrabold text-2xl md:text-3xl tracking-tight mb-4">{task.title}</h1>
                <p className="text-[#888] leading-relaxed mb-6">{task.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    [<Wallet className="w-4 h-4 inline mr-1" />, 'Budget', `₹${task.budget?.toLocaleString('en-IN')}`],
                    [<MapPin className="w-4 h-4 inline mr-1" />, 'Location', task.location?.isRemote ? 'Remote' : (task.location?.city || 'Nearby')],
                    [<Clock className="w-4 h-4 inline mr-1" />, 'Deadline', format(new Date(task.deadline), 'dd MMM yyyy')],
                    [<MessageCircle className="w-4 h-4 inline mr-1" />, 'Bids', task.bidsCount],
                    [<CalendarDays className="w-4 h-4 inline mr-1" />, 'Posted', formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })],
                  ].map(([icon, label, value]) => (
                    <div key={label} className="bg-[#111] rounded-xl p-3 border border-[#222]">
                      <div className="flex items-center text-[11px] text-[#444] uppercase tracking-wider mb-1">{icon} {label}</div>
                      <div className="text-sm font-medium text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Action buttons for involved parties */}
            <AnimatePresence>
              {user && task.status === 'open' && !isPoster && !myBid && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
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
                </motion.div>
              )}
            </AnimatePresence>

            {myBid && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-green-400 font-bold mb-1"><CheckCircle2 className="w-5 h-5" /> Your bid is placed</div>
                <p className="text-[#888] text-sm">You bid ₹{myBid.amount} — waiting for poster to respond.</p>
              </motion.div>
            )}

            {/* Poster pays into escrow after assigning a bid */}
            {isPoster && task.status === 'assigned' && task.paymentStatus === 'unpaid' && (
              <PayButton
                task={task}
                onPaid={(updatedTask) => setTask(updatedTask)}
              />
            )}

            {/* Escrow held — inform poster payment is locked in */}
            {isPoster && task.status === 'assigned' && task.paymentStatus === 'held' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/25 rounded-2xl p-4 flex items-center gap-3">
                <Lock className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-sm font-bold text-green-400">Payment held in escrow</div>
                  <div className="text-xs text-[#666] mt-0.5">₹{task.finalAmount?.toLocaleString('en-IN')} will be released to the tasker once the task is complete.</div>
                </div>
              </motion.div>
            )}

            {/* Tasker starts the task */}
            {isAssigned && task.status === 'assigned' && (
              <button
                onClick={startTask}
                disabled={starting}
                className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {starting ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Starting...</>
                ) : <><Rocket className="w-5 h-5" /> Start Task</>}
              </button>
            )}

            {/* Tasker submits work for review */}
            {isAssigned && task.status === 'in_progress' && (
              <button onClick={submitWork} className="w-full bg-amber-500 text-black font-bold py-4 rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Submit Work for Review
              </button>
            )}

            {/* Pending review state */}
            {task.status === 'pending_review' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-400" />
                <div>
                  <div className="text-sm font-bold text-amber-400">Work submitted — awaiting poster review</div>
                  <div className="text-xs text-[#666] mt-0.5">{isPoster ? 'Review the work and approve to release payment.' : 'The poster will review your submission shortly.'}</div>
                </div>
              </motion.div>
            )}

            {/* Poster approves work */}
            {isPoster && task.status === 'pending_review' && (
              <button onClick={approveWork} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Approve &amp; Release Payment
              </button>
            )}

            {/* Poster releases escrow after task is completed */}
            {isPoster && task.status === 'completed' && task.paymentStatus === 'held' && (
              <ReleaseButton
                task={task}
                onReleased={(updatedTask) => setTask(updatedTask)}
              />
            )}

            {/* Show released state */}
            {task.status === 'completed' && task.paymentStatus === 'released' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/10 border border-accent/25 rounded-2xl p-4 flex items-center gap-3">
                <PartyPopper className="w-8 h-8 text-accent" />
                <div>
                  <div className="text-sm font-bold text-accent">Task complete & payment released!</div>
                  <div className="text-xs text-[#666] mt-0.5">₹{task.finalAmount?.toLocaleString('en-IN')} has been sent to the tasker.</div>
                </div>
              </motion.div>
            )}

            {(isPoster || isAssigned) && ['assigned', 'in_progress', 'pending_review'].includes(task.status) && (
              <Link to={`/chat/${task._id}`} className="w-full flex items-center justify-center gap-2 border border-[#222] hover:border-accent text-[#ccc] hover:text-accent font-medium py-4 rounded-xl transition-all">
                <MessageSquare className="w-5 h-5" /> Open Chat
              </Link>
            )}

            {/* Bids list (poster only) */}
            {isPoster && bids.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#161616] border border-[#222] rounded-2xl p-6">
                <h3 className="font-head font-bold text-lg mb-5">Bids ({bids.length})</h3>
                <div className="space-y-4">
                  {bids.map((bid, index) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                      key={bid._id} className={`border rounded-xl p-4 transition-colors ${
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
                            <div className="flex items-center text-xs text-[#555]">
                              <Star className="w-3 h-3 text-yellow-500 mr-1" />
                              {bid.bidder?.rating?.toFixed(1) || 'New'} · {bid.bidder?.tasksDone} tasks done
                            </div>
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
                      {bid.status === 'accepted' && <span className="mt-2 flex items-center text-xs font-bold text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</span>}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Poster card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#161616] border border-[#222] rounded-2xl p-5">
              <h3 className="text-xs font-bold text-[#555] uppercase tracking-wider mb-4">Posted by</h3>
              <Link to={`/profile/${task.poster?._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                  {task.poster?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{task.poster?.name}</div>
                  <div className="flex items-center text-xs text-[#555]">
                    <Star className="w-3 h-3 text-yellow-500 mr-1" />
                    {task.poster?.rating?.toFixed(1) || 'New'} · {task.poster?.tasksPosted} tasks posted
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Assigned to */}
            {task.assignedTo && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#161616] border border-green-500/25 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-4">Assigned to</h3>
                <Link to={`/profile/${task.assignedTo?._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-lg">
                    {task.assignedTo?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{task.assignedTo?.name}</div>
                    <div className="flex items-center text-xs text-[#555]">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      {task.assignedTo?.rating?.toFixed(1) || 'New'}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Final amount */}
            {task.finalAmount && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-[#161616] border border-[#222] rounded-2xl p-5 text-center">
                <div className="text-xs text-[#555] uppercase tracking-wider mb-1">Agreed Price</div>
                <div className="font-head font-extrabold text-3xl text-accent">₹{task.finalAmount?.toLocaleString('en-IN')}</div>
                <div className="text-xs text-[#444] mt-1">Held in escrow</div>
              </motion.div>
            )}

            {/* Safety note */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
              <div className="flex items-center text-xs font-bold text-[#555] uppercase tracking-wider mb-3">
                <Lock className="w-4 h-4 mr-1.5" /> Safe & Secure
              </div>
              <ul className="space-y-2 text-xs text-[#555]">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Payment held in escrow</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> No phone number sharing</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Both sides rated after task</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Dispute resolution available</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
