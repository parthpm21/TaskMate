import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { icon: '📦', name: 'Delivery', desc: 'Pickup, drop, errands', count: '340+', hot: true },
  { icon: '📚', name: 'Academic', desc: 'Notes, PPT, assignments', count: '210+', hot: true },
  { icon: '💻', name: 'Tech', desc: 'Code, design, resume', count: '180+', pay: 'High Pay' },
  { icon: '🧹', name: 'Household', desc: 'Cleaning, laundry', count: '150+' },
  { icon: '🧑‍🏫', name: 'Tutoring', desc: 'Teaching, coaching', count: '90+' },
  { icon: '🚗', name: 'Transport', desc: 'Rides, shifting', count: '120+' },
  { icon: '🎉', name: 'Events', desc: 'Gigs, photography', count: '60+' },
  { icon: '✨', name: 'Custom', desc: 'Post anything', count: '∞', flex: true },
];

const STEPS = [
  { num: '01', icon: '📌', title: 'Post your task', desc: 'Describe what you need, set your budget and deadline. Takes under 2 minutes.' },
  { num: '02', icon: '⚡', title: 'Get offers instantly', desc: 'Nearby taskers see your post and bid. Pick who to work with based on ratings.' },
  { num: '03', icon: '✅', title: 'Pay & review', desc: 'Task done? Release payment securely and leave a rating. Both sides build reputation.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="animate-fadeUp" style={{ animationDelay: '0s' }}>
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 rounded-full px-4 py-1.5 text-xs font-bold text-accent uppercase tracking-wider mb-8">
            <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            Now live in Jaipur & beyond
          </div>
        </div>

        <h1 className="font-head font-extrabold text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight max-w-3xl animate-fadeUp" style={{ animationDelay: '0.1s' }}>
          Get <span className="text-accent">anything</span> done.<br />Earn on your terms.
        </h1>

        <p className="text-[#888] text-lg md:text-xl font-light max-w-lg mt-8 mb-12 animate-fadeUp" style={{ animationDelay: '0.2s' }}>
          Post a task, find help instantly. Or accept tasks near you and start earning today — no office, no boss.
        </p>

        <div className="flex flex-wrap gap-4 justify-center animate-fadeUp" style={{ animationDelay: '0.3s' }}>
          <Link to="/post" className="bg-accent text-black font-bold text-base px-8 py-4 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-[0_8px_32px_rgba(245,166,35,0.3)]">
            Post a Task →
          </Link>
          <Link to="/browse" className="border border-[#333] text-white font-medium text-base px-8 py-4 rounded-xl hover:border-accent hover:text-accent transition-all">
            Browse Tasks Near Me
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y border-[#222] bg-[#111]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[['12K+', 'Tasks Completed'], ['4.8★', 'Avg Rating'], ['₹85L+', 'Earned by Taskers'], ['6 Cities', '& Growing']].map(([num, label]) => (
            <div key={label} className="text-center py-8 border-r border-[#222] last:border-r-0">
              <div className="font-head font-extrabold text-3xl text-accent">{num}</div>
              <div className="text-[11px] text-[#555] uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-xs font-bold text-accent uppercase tracking-widest mb-4">How it works</div>
        <h2 className="font-head font-extrabold text-4xl md:text-5xl leading-tight tracking-tight mb-16">Three steps.<br />Zero friction.</h2>
        <div className="grid md:grid-cols-3 gap-px bg-[#222] rounded-2xl overflow-hidden">
          {STEPS.map((s) => (
            <div key={s.num} className="bg-[#161616] p-10 relative hover:bg-[#1a1a1a] transition-colors">
              <div className="font-head font-extrabold text-6xl text-accent/10 absolute top-4 right-6 leading-none">{s.num}</div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl mb-6">{s.icon}</div>
              <h3 className="font-head font-bold text-lg mb-3">{s.title}</h3>
              <p className="text-[#666] text-[14px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-xs font-bold text-accent uppercase tracking-widest mb-4">Task Categories</div>
        <h2 className="font-head font-extrabold text-4xl md:text-5xl leading-tight tracking-tight mb-12">Any task.<br />Every need.</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link to={`/browse?category=${cat.name.toLowerCase()}`} key={cat.name}
              className="bg-[#161616] border border-[#222] rounded-2xl p-6 hover:border-accent/40 hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-3xl mb-3">{cat.icon}</div>
              <div className="font-head font-bold text-[15px] mb-1">{cat.name}</div>
              <div className="text-[12px] text-[#555] mb-2">{cat.count} active tasks</div>
              {cat.hot && <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">Hot</span>}
              {cat.pay && <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase">High Pay</span>}
              {cat.flex && <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full uppercase">Flexible</span>}
            </Link>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-xs font-bold text-accent uppercase tracking-widest mb-4">Trust & Safety</div>
        <h2 className="font-head font-extrabold text-4xl leading-tight tracking-tight mb-12">Built on trust.<br />Designed for safety.</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            ['🔒', 'Escrow Payments', 'Money is held securely until the task is marked complete. No pay before work.'],
            ['✅', 'Verified Profiles', 'ID and phone verification with skill badges build credibility for every user.'],
            ['⭐', 'Two-Way Ratings', 'Posters and taskers both get rated. Bad actors are flagged and removed.'],
            ['🛡️', 'Dispute Resolution', 'Our team reviews chat history and evidence before any decision.'],
            ['📵', 'No Number Sharing', 'Communication stays inside the app. Your number is never exposed.'],
            ['🚨', 'Report & Block', 'One-tap report on any user or message, investigated within 24 hours.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="bg-[#161616] border border-[#222] rounded-2xl p-7 hover:border-accent/30 transition-colors">
              <div className="text-2xl mb-4">{icon}</div>
              <h3 className="font-head font-bold text-base mb-2">{title}</h3>
              <p className="text-[#555] text-[13px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-[#161616] border border-[#222] rounded-3xl p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,166,35,0.07)_0%,transparent_60%)] pointer-events-none" />
          <h2 className="font-head font-extrabold text-4xl md:text-5xl tracking-tight mb-4">Ready to post your first task?</h2>
          <p className="text-[#666] text-base mb-10">Join thousands of people getting help and earning — right in their city.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={user ? '/post' : '/register'} className="bg-accent text-black font-bold text-base px-8 py-4 rounded-xl hover:opacity-90 transition-opacity">
              Post a Task — It's Free
            </Link>
            <Link to="/browse" className="border border-[#333] text-white font-medium text-base px-8 py-4 rounded-xl hover:border-accent hover:text-accent transition-all">
              Start Earning as a Tasker
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
