const socketIO = require('socket.io');

// Map to store user socket connections
const userSockets = new Map();

// Initialize Socket.IO
const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins their personal room
    socket.on('join', (userId) => {
      socket.join(`user-${userId}`);
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} joined their room`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.broadcast.emit('user-typing', data);
    });

    socket.on('stop-typing', (data) => {
      socket.broadcast.emit('user-stopped-typing', data);
    });
  });

  return io;
};

// Send notification to specific user
const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user-${userId}`).emit('notification', {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    timestamp: new Date(),
  });

  console.log(`Notification sent to user ${userId}: ${notification.type}`);
};

// Send notifications to multiple users
const sendNotificationsToUsers = (io, userIds, notification) => {
  userIds.forEach((userId) => {
    sendNotificationToUser(io, userId, notification);
  });
};

// Broadcast to all connected users
const broadcastNotification = (io, notification) => {
  io.emit('notification', {
    ...notification,
    timestamp: new Date(),
  });

  console.log(`Broadcast notification: ${notification.type}`);
};

// Send application received notification
const sendApplicationNotification = (io, recruiterId, jobTitle, candidateName) => {
  sendNotificationToUser(io, recruiterId, {
    type: 'application_received',
    title: 'New Application',
    message: `${candidateName} applied for ${jobTitle}`,
    data: {
      jobTitle,
      candidateName,
    },
  });
};

// Send application status update notification
const sendApplicationStatusNotification = (
  io,
  candidateId,
  jobTitle,
  status
) => {
  sendNotificationToUser(io, candidateId, {
    type: 'application_status',
    title: `Application ${status}`,
    message: `Your application for ${jobTitle} has been ${status}`,
    data: {
      jobTitle,
      status,
    },
  });
};

// Send interview scheduled notification
const sendInterviewNotification = (io, candidateId, jobTitle, interviewTime) => {
  sendNotificationToUser(io, candidateId, {
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `Your interview for ${jobTitle} is scheduled`,
    data: {
      jobTitle,
      interviewTime,
    },
  });
};

// Send real-time update for job posting
const broadcastJobPosting = (io, job) => {
  broadcastNotification(io, {
    type: 'new_job',
    title: 'New Job Posted',
    message: `${job.company} is hiring for ${job.title}`,
    data: job,
  });
};

// Send chat message notification
const sendChatNotification = (io, userId, message) => {
  sendNotificationToUser(io, userId, {
    type: 'chat_message',
    title: 'New Message',
    message: message.content,
    data: message,
  });
};

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  sendNotificationsToUsers,
  broadcastNotification,
  sendApplicationNotification,
  sendApplicationStatusNotification,
  sendInterviewNotification,
  broadcastJobPosting,
  sendChatNotification,
};
