import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Package, BookOpen, Laptop, Sparkles, GraduationCap, Car, PartyPopper, Wand2, MapPin, Zap, CheckCircle2, Lock, Shield, PhoneOff, AlertTriangle, Star } from 'lucide-react';

const CATEGORIES = [
  { icon: <Package className="w-8 h-8 text-green-400" />, name: 'Delivery', desc: 'Pickup, drop, errands', count: '340+', hot: true },
  { icon: <BookOpen className="w-8 h-8 text-indigo-400" />, name: 'Academic', desc: 'Notes, PPT, assignments', count: '210+', hot: true },
  { icon: <Laptop className="w-8 h-8 text-amber-400" />, name: 'Tech', desc: 'Code, design, resume', count: '180+', pay: 'High Pay' },
  { icon: <Sparkles className="w-8 h-8 text-orange-400" />, name: 'Household', desc: 'Cleaning, laundry', count: '150+' },
  { icon: <GraduationCap className="w-8 h-8 text-pink-400" />, name: 'Tutoring', desc: 'Teaching, coaching', count: '90+' },
  { icon: <Car className="w-8 h-8 text-sky-400" />, name: 'Transport', desc: 'Rides, shifting', count: '120+' },
  { icon: <PartyPopper className="w-8 h-8 text-purple-400" />, name: 'Events', desc: 'Gigs, photography', count: '60+' },
  { icon: <Wand2 className="w-8 h-8 text-yellow-400" />, name: 'Custom', desc: 'Post anything', count: '∞', flex: true },
];

const STEPS = [
  { num: '01', icon: <MapPin className="w-6 h-6 text-accent" />, title: 'Post your task', desc: 'Describe what you need, set your budget and deadline. Takes under 2 minutes.' },
  { num: '02', icon: <Zap className="w-6 h-6 text-accent" />, title: 'Get offers instantly', desc: 'Nearby taskers see your post and bid. Pick who to work with based on ratings.' },
  { num: '03', icon: <CheckCircle2 className="w-6 h-6 text-accent" />, title: 'Pay & review', desc: 'Task done? Release payment securely and leave a rating. Both sides build reputation.' },
];

/** 3-D tilt card — follows the mouse cursor */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -10;
    const rotateY = ((x - cx) / cx) * 10;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.04)`;
  };

  const handleMouseLeave = () => {
    if (ref.current)
      ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`tilt-card ${className}`}
      style={{ transition: 'transform 0.15s ease, box-shadow 0.3s ease' }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="pt-16">
      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">

        {/* 3D floating orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Large central glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-[120px]" />
          {/* Orb 1 – amber top-left */}
          <div className="float-slow absolute top-16 left-[10%] w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, #f5a623, transparent 70%)', filter: 'blur(40px)' }} />
          {/* Orb 2 – orange bottom-right */}
          <div className="float-medium absolute bottom-20 right-[8%] w-80 h-80 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle at 70% 70%, #ff6b35, transparent 70%)', filter: 'blur(50px)', animationDelay: '-2s' }} />
          {/* Orb 3 – indigo top-right */}
          <div className="float-fast absolute top-32 right-[15%] w-48 h-48 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle at 50% 50%, #6366f1, transparent 70%)', filter: 'blur(35px)', animationDelay: '-4s' }} />
          {/* Orb 4 – teal bottom-left */}
          <div className="float-slow absolute bottom-32 left-[12%] w-56 h-56 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle at 40% 60%, #14b8a6, transparent 70%)', filter: 'blur(40px)', animationDelay: '-6s' }} />

          {/* 3D rotating ring */}
          <div className="spin-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
            style={{ border: '1px solid #f5a623', boxShadow: '0 0 60px rgba(245,166,35,0.2)' }} />
          <div className="spin-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full opacity-[0.06]"
            style={{ border: '1px solid #ff6b35', boxShadow: '0 0 40px rgba(255,107,53,0.15)', animationDirection: 'reverse' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 rounded-full px-4 py-1.5 text-xs font-bold text-accent uppercase tracking-wider mb-8 relative z-10"
        >
          <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          Now live in Jaipur & beyond
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="font-head font-extrabold text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight max-w-4xl relative z-10"
        >
          Get <span className="gradient-text-shimmer">anything</span> done.<br />
          Earn on <span className="gradient-text">your terms.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
          className="text-[#888] text-lg md:text-xl font-light max-w-lg mt-8 mb-12 relative z-10"
        >
          Post a task, find help instantly. Or accept tasks near you and start earning today — no office, no boss.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap gap-4 justify-center relative z-10"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link to="/post"
              className="glow-accent bg-accent text-black font-bold text-base px-8 py-4 rounded-xl hover:opacity-95 transition-all shadow-[0_8px_32px_rgba(245,166,35,0.35)] inline-block"
            >
              Post a Task →
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link to="/browse"
              className="border border-[#333] text-white font-medium text-base px-8 py-4 rounded-xl hover:border-accent hover:text-accent transition-all inline-block"
            >
              Browse Tasks Near Me
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <div className="border-y border-[#222] bg-[#111]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[['12K+', 'Tasks Completed'], ['4.8★', 'Avg Rating'], ['₹85L+', 'Earned by Taskers'], ['6 Cities', '& Growing']].map(([num, label]) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-center py-8 border-r border-[#222] last:border-r-0"
            >
              <div className="font-head font-extrabold text-3xl text-accent">{num}</div>
              <div className="text-[11px] text-[#555] uppercase tracking-wider mt-1">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-xs font-bold text-accent uppercase tracking-widest mb-4">How it works</div>
        <h2 className="font-head font-extrabold text-4xl md:text-5xl leading-tight tracking-tight mb-16">
          Three steps.<br /><span className="gradient-text">Zero friction.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-px bg-[#222] rounded-2xl overflow-hidden">
          {STEPS.map((s, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
              key={s.num}
            >
              <TiltCard className="h-full">
                <div className="bg-[#161616] p-10 relative hover:bg-[#1a1a1a] transition-colors h-full">
                  <div className="font-head font-extrabold text-6xl text-accent/10 absolute top-4 right-6 leading-none">{s.num}</div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">{s.icon}</div>
                  <h3 className="font-head font-bold text-lg mb-3">{s.title}</h3>
                  <p className="text-[#666] text-[14px] leading-relaxed">{s.desc}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-xs font-bold text-accent uppercase tracking-widest mb-4">Task Categories</div>
        <h2 className="font-head font-extrabold text-4xl md:text-5xl leading-tight tracking-tight mb-12">
          Any task.<br /><span className="gradient-text">Every need.</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: index * 0.07, type: 'spring', stiffness: 200 }}
              key={cat.name}
            >
              <TiltCard className="h-full">
                <Link to={`/browse?category=${cat.name.toLowerCase()}`}
                  className="block h-full bg-[#161616] border border-[#222] rounded-2xl p-6 hover:border-accent/40 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                  <div className="font-head font-bold text-[15px] mb-1">{cat.name}</div>
                  <div className="text-[12px] text-[#555] mb-2">{cat.count} active tasks</div>
                  {cat.hot  && <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">Hot</span>}
                  {cat.pay  && <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase">High Pay</span>}
                  {cat.flex && <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full uppercase">Flexible</span>}
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-xs font-bold text-accent uppercase tracking-widest mb-4">Trust & Safety</div>
        <h2 className="font-head font-extrabold text-4xl leading-tight tracking-tight mb-12">
          Built on trust.<br /><span className="gradient-text">Designed for safety.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            [<Lock key="lock" className="w-6 h-6 text-accent" />, 'Escrow Payments', 'Money is held securely until the task is marked complete. No pay before work.'],
            [<CheckCircle2 key="check" className="w-6 h-6 text-green-400" />, 'Verified Profiles', 'ID and phone verification with skill badges build credibility for every user.'],
            [<Star key="star" className="w-6 h-6 text-yellow-400" />, 'Two-Way Ratings', 'Posters and taskers both get rated. Bad actors are flagged and removed.'],
            [<Shield key="shield" className="w-6 h-6 text-indigo-400" />, 'Dispute Resolution', 'Our team reviews chat history and evidence before any decision.'],
            [<PhoneOff key="phone" className="w-6 h-6 text-rose-400" />, 'No Number Sharing', 'Communication stays inside the app. Your number is never exposed.'],
            [<AlertTriangle key="alert" className="w-6 h-6 text-red-500" />, 'Report & Block', 'One-tap report on any user or message, investigated within 24 hours.'],
          ].map(([icon, title, desc], index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
              key={title}
            >
              <TiltCard className="h-full">
                <div className="bg-[#161616] border border-[#222] rounded-2xl p-7 hover:border-accent/30 transition-colors h-full">
                  <div className="mb-4">{icon}</div>
                  <h3 className="font-head font-bold text-base mb-2">{title}</h3>
                  <p className="text-[#555] text-[13px] leading-relaxed">{desc}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-[#161616] border border-[#222] rounded-3xl p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,166,35,0.1)_0%,transparent_65%)] pointer-events-none" />
          {/* Floating orb inside CTA */}
          <div className="float-medium absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #f5a623, transparent 70%)', filter: 'blur(40px)' }} />
          <h2 className="font-head font-extrabold text-4xl md:text-5xl tracking-tight mb-4 relative z-10">
            Ready to post your <span className="gradient-text">first task?</span>
          </h2>
          <p className="text-[#666] text-base mb-10 relative z-10">Join thousands of people getting help and earning — right in their city.</p>
          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link to={user ? '/post' : '/register'}
                className="glow-accent bg-accent text-black font-bold text-base px-8 py-4 rounded-xl hover:opacity-95 transition-all inline-block"
              >
                Post a Task — It's Free
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link to="/browse"
                className="border border-[#333] text-white font-medium text-base px-8 py-4 rounded-xl hover:border-accent hover:text-accent transition-all inline-block"
              >
                Start Earning as a Tasker
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#222] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-head font-extrabold text-lg">Task<span className="text-accent">Mate</span></div>
          <p className="text-[#444] text-sm">© 2026 TaskMate · Built for the hustle generation</p>
          <p className="text-[#444] text-xs">Jaipur · Delhi · Pune · Bangalore</p>
        </div>
      </footer>
    </div>
  );
}
