import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ReleaseButton({ task, onReleased }) {
  const [loading, setLoading] = useState(false);

  const handleRelease = async () => {
    const confirmed = window.confirm(
      `Release ₹${task.finalAmount?.toLocaleString('en-IN')} to the tasker?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const { data } = await api.post('/payments/release', { taskId: task._id });
      toast.success('💸 Payment released to the tasker!');
      onReleased(data.task);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRelease}
      disabled={loading}
      className="w-full bg-accent text-black font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 text-base"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          Releasing...
        </>
      ) : (
        `💸 Release ₹${task.finalAmount?.toLocaleString('en-IN')} to Tasker`
      )}
    </button>
  );
}
