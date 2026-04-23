import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Package, BookOpen, Laptop, Sparkles, GraduationCap, Car, PartyPopper, User, Wand2, Zap, MapPin, Clock, MessageCircle, Star } from 'lucide-react';

const CATEGORY_ICONS = {
  delivery: <Package className="w-3.5 h-3.5 inline mr-1" />, 
  academic: <BookOpen className="w-3.5 h-3.5 inline mr-1" />, 
  tech: <Laptop className="w-3.5 h-3.5 inline mr-1" />,
  household: <Sparkles className="w-3.5 h-3.5 inline mr-1" />, 
  tutoring: <GraduationCap className="w-3.5 h-3.5 inline mr-1" />, 
  transport: <Car className="w-3.5 h-3.5 inline mr-1" />,
  events: <PartyPopper className="w-3.5 h-3.5 inline mr-1" />, 
  personal: <User className="w-3.5 h-3.5 inline mr-1" />, 
  other: <Wand2 className="w-3.5 h-3.5 inline mr-1" />,
};

export default function TaskCard({ task }) {
  const cardRef = useRef(null);
  const timeAgo = formatDistanceToNow(new Date(task.createdAt), { addSuffix: true });
  const deadlineDate = new Date(task.deadline);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current)
      cardRef.current.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
  };
  const isExpiringSoon = (deadlineDate - new Date()) < 86400000 * 2; // 2 days

  return (
    <Link to={`/tasks/${task._id}`} className="group block h-full" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div ref={cardRef} className="tilt-card bg-[#161616] border border-[#222] rounded-2xl p-5 hover:border-accent/40 relative overflow-hidden h-full flex flex-col" style={{ transition: 'transform 0.12s ease, box-shadow 0.3s ease' }}>
        {/* Urgent badge */}
        {task.isUrgent && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`pill-${task.category} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex-shrink-0 flex items-center`}>
            {CATEGORY_ICONS[task.category]}
            {task.category}
          </span>
          {task.isUrgent && (
            <span className="flex items-center text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3 mr-1" /> Urgent
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-head font-bold text-[15px] leading-snug mb-2 text-white group-hover:text-accent transition-colors line-clamp-2">
          {task.title}
        </h3>

        {/* Description */}
        <p className="text-[#777] text-[13px] leading-relaxed line-clamp-2 mb-4 flex-grow">
          {task.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#555] mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {task.location?.isRemote ? 'Remote' : (task.location?.city || 'Nearby')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className={`w-3.5 h-3.5 ${isExpiringSoon ? 'text-orange-400' : ''}`} />
            {isExpiringSoon
              ? <span className="text-orange-400">Expires soon</span>
              : deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {task.bidsCount} bids
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1e1e1e] mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
              {task.poster?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-[12px] text-[#888]">{task.poster?.name}</div>
              <div className="flex items-center text-[11px] text-[#555]">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                {task.poster?.rating?.toFixed(1) || 'New'}
              </div>
            </div>
          </div>
          <div className="font-head font-extrabold text-xl text-accent">
            ₹{task.budget.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </Link>
  );
}
