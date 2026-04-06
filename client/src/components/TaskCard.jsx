import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_LABELS = {
  delivery: '📦 Delivery', academic: '📚 Academic', tech: '💻 Tech',
  household: '🧹 Household', tutoring: '🧑‍🏫 Tutoring', transport: '🚗 Transport',
  events: '🎉 Events', personal: '🐾 Personal', other: '✨ Other',
};

export default function TaskCard({ task }) {
  const timeAgo = formatDistanceToNow(new Date(task.createdAt), { addSuffix: true });
  const deadlineDate = new Date(task.deadline);
  const isExpiringSoon = (deadlineDate - new Date()) < 86400000 * 2; // 2 days

  return (
    <Link to={`/tasks/${task._id}`} className="group block">
      <div className="bg-[#161616] border border-[#222] rounded-2xl p-5 hover:border-accent/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Urgent badge */}
        {task.isUrgent && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`pill-${task.category} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex-shrink-0`}>
            {CATEGORY_LABELS[task.category] || task.category}
          </span>
          {task.isUrgent && (
            <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">⚡ Urgent</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-head font-bold text-[15px] leading-snug mb-2 text-white group-hover:text-accent transition-colors line-clamp-2">
          {task.title}
        </h3>

        {/* Description */}
        <p className="text-[#777] text-[13px] leading-relaxed line-clamp-2 mb-4">
          {task.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-[12px] text-[#555] mb-4">
          <span className="flex items-center gap-1">
            📍 {task.location?.isRemote ? 'Remote' : (task.location?.city || 'Nearby')}
          </span>
          <span className="flex items-center gap-1">
            ⏰ {isExpiringSoon
              ? <span className="text-orange-400">Expires soon</span>
              : deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <span className="flex items-center gap-1">
            💬 {task.bidsCount} bids
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
              {task.poster?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-[12px] text-[#888]">{task.poster?.name}</div>
              <div className="text-[11px] text-[#555]">⭐ {task.poster?.rating?.toFixed(1) || 'New'}</div>
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
