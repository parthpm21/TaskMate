import Task from '../models/Task.js';
import Bid from '../models/Bid.js';
import Chat from '../models/Chat.js';

/**
 * Runs periodically to find tasks whose deadline has passed
 * while still in an 'open' or 'assigned' status, and deletes
 * them along with their associated bids and chats.
 *
 * Safe statuses that are NEVER touched:
 *   - in_progress  (work has started — must not auto-delete)
 *   - completed    (historical record)
 *   - disputed     (awaiting manual resolution)
 *   - cancelled    (already handled)
 */
const EXPIRY_INTERVAL_MS = 60 * 60 * 1000; // run every 1 hour

export function startTaskExpiryJob(io) {
  console.log('⏰ Task expiry job started (runs every 1 hour)');

  const run = async () => {
    try {
      const now = new Date();

      // Find expired tasks that can be safely auto-deleted
      const expiredTasks = await Task.find({
        deadline: { $lt: now },
        status: { $in: ['open', 'assigned'] },
      }).select('_id title poster status');

      if (expiredTasks.length === 0) return;

      const expiredIds = expiredTasks.map((t) => t._id);

      // Clean up related bids and chats first (referential integrity)
      await Promise.all([
        Bid.deleteMany({ task: { $in: expiredIds } }),
        Chat.deleteMany({ task: { $in: expiredIds } }),
      ]);

      // Delete the tasks themselves
      await Task.deleteMany({ _id: { $in: expiredIds } });

      console.log(
        `🗑️  Auto-deleted ${expiredTasks.length} expired task(s):`,
        expiredTasks.map((t) => `"${t.title}" [${t._id}]`).join(', ')
      );

      // Notify any connected clients so their UI can update in real-time
      expiredIds.forEach((taskId) => {
        io.to(`task:${taskId}`).emit('task:expired', { taskId });
      });

      // Broadcast to the global room so the browse/dashboard feed refreshes
      io.emit('tasks:expired', { expiredIds });
    } catch (err) {
      console.error('❌ Task expiry job error:', err.message);
    }
  };

  // Run immediately on startup to catch any tasks that expired during downtime
  run();

  // Then repeat on the defined interval
  const intervalHandle = setInterval(run, EXPIRY_INTERVAL_MS);

  // Return a cleanup function so the job can be stopped gracefully
  return () => clearInterval(intervalHandle);
}
