export const setupSocket = (io) => {
  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Register user as online
    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // Join a task's chat room
    socket.on('chat:join', (taskId) => {
      socket.join(`task:${taskId}`);
    });

    // Send a message to a task chat room
    socket.on('chat:message', (data) => {
      // data: { taskId, message (already saved to DB by REST call) }
      io.to(`task:${data.taskId}`).emit('chat:message', data.message);
    });

    // Notify when task status changes
    socket.on('task:statusChange', (data) => {
      io.to(`task:${data.taskId}`).emit('task:updated', data);
    });

    socket.on('disconnect', () => {
      for (const [userId, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
};
