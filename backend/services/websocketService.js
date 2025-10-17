import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

let io;

// Initialize WebSocket server
export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle WebSocket connections
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected (${socket.user.role})`);

    // Join user-specific room
    socket.join(`${socket.user.role}_${socket.user._id}`);
    
    // Join department room for teachers and students
    if (socket.user.department) {
      socket.join(`department_${socket.user.department}`);
    }

    // Handle teacher location sharing
    socket.on('start_location_sharing', async (data) => {
      if (socket.user.role !== 'teacher') {
        socket.emit('error', { message: 'Only teachers can share location' });
        return;
      }

      const { visitId } = data;
      socket.join(`visit_${visitId}_location`);
      
      console.log(`Teacher ${socket.user.name} started location sharing for visit ${visitId}`);
      
      // Notify student that teacher started location sharing
      socket.to(`visit_${visitId}`).emit('location_sharing_started', {
        teacherId: socket.user._id,
        teacherName: socket.user.name,
        visitId
      });
    });

    // Handle teacher location updates
    socket.on('location_update', async (data) => {
      if (socket.user.role !== 'teacher') {
        socket.emit('error', { message: 'Only teachers can update location' });
        return;
      }

      const { visitId, latitude, longitude, accuracy, address } = data;
      
      // Broadcast location update to students in the visit
      socket.to(`visit_${visitId}`).emit('teacher_location_update', {
        visitId,
        teacherId: socket.user._id,
        location: {
          coordinates: { latitude, longitude },
          accuracy,
          address,
          lastUpdated: new Date()
        }
      });
    });

    // Handle joining visit room (for real-time updates)
    socket.on('join_visit', (data) => {
      const { visitId } = data;
      socket.join(`visit_${visitId}`);
      console.log(`User ${socket.user.name} joined visit ${visitId} room`);
    });

    // Handle leaving visit room
    socket.on('leave_visit', (data) => {
      const { visitId } = data;
      socket.leave(`visit_${visitId}`);
      console.log(`User ${socket.user.name} left visit ${visitId} room`);
    });

    // Handle visit status updates
    socket.on('visit_status_update', (data) => {
      if (socket.user.role !== 'teacher') {
        socket.emit('error', { message: 'Only teachers can update visit status' });
        return;
      }

      const { visitId, status, notes } = data;
      
      // Broadcast status update to all users in the visit
      socket.to(`visit_${visitId}`).emit('visit_status_update', {
        visitId,
        status,
        notes,
        timestamp: new Date(),
        updatedBy: {
          id: socket.user._id,
          name: socket.user.name
        }
      });
    });

    // Handle emergency alerts
    socket.on('emergency_alert', (data) => {
      const { visitId, message, type } = data;
      
      // Broadcast emergency alert to all relevant users
      socket.to(`visit_${visitId}`).emit('emergency_alert', {
        visitId,
        message,
        type,
        timestamp: new Date(),
        from: {
          id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        }
      });

      // Also notify department administrators
      socket.to(`department_${socket.user.department}`).emit('emergency_alert', {
        visitId,
        message,
        type,
        timestamp: new Date(),
        from: {
          id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        }
      });
    });

    // Handle chat messages during assessment
    socket.on('assessment_chat', (data) => {
      const { visitId, message, type } = data;
      
      // Broadcast chat message to visit participants
      socket.to(`visit_${visitId}`).emit('assessment_chat', {
        visitId,
        message,
        type: type || 'text',
        timestamp: new Date(),
        from: {
          id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        }
      });
    });

    // Handle file sharing during assessment
    socket.on('share_file', (data) => {
      const { visitId, attachmentId, fileName, fileType } = data;
      
      // Broadcast file share to visit participants
      socket.to(`visit_${visitId}`).emit('file_shared', {
        visitId,
        attachmentId,
        fileName,
        fileType,
        timestamp: new Date(),
        sharedBy: {
          id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        }
      });
    });

    // Handle assessment completion
    socket.on('assessment_completed', (data) => {
      if (socket.user.role !== 'teacher') {
        socket.emit('error', { message: 'Only teachers can complete assessments' });
        return;
      }

      const { visitId, results } = data;
      
      // Notify student of assessment completion
      socket.to(`visit_${visitId}`).emit('assessment_completed', {
        visitId,
        results,
        timestamp: new Date(),
        completedBy: {
          id: socket.user._id,
          name: socket.user.name
        }
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { visitId } = data;
      socket.to(`visit_${visitId}`).emit('user_typing', {
        visitId,
        user: {
          id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        }
      });
    });

    socket.on('typing_stop', (data) => {
      const { visitId } = data;
      socket.to(`visit_${visitId}`).emit('user_stopped_typing', {
        visitId,
        userId: socket.user._id
      });
    });

    // Handle connection status
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.name} disconnected: ${reason}`);
      
      // Notify relevant rooms about user disconnection
      socket.broadcast.emit('user_disconnected', {
        userId: socket.user._id,
        userName: socket.user.name,
        userRole: socket.user.role,
        timestamp: new Date()
      });
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to assessment tracking system',
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      timestamp: new Date()
    });
  });

  return io;
};

// Helper functions to emit events from controllers
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

export const emitToVisit = (visitId, event, data) => {
  if (io) {
    io.to(`visit_${visitId}`).emit(event, data);
  }
};

export const emitToDepartment = (department, event, data) => {
  if (io) {
    io.to(`department_${department}`).emit(event, data);
  }
};

export const emitToRole = (role, event, data) => {
  if (io) {
    io.to(role).emit(event, data);
  }
};

// Broadcast system-wide notifications
export const broadcastNotification = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Get connected users count
export const getConnectedUsersCount = () => {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
};

// Get users in a specific room
export const getUsersInRoom = async (room) => {
  if (io) {
    const sockets = await io.in(room).fetchSockets();
    return sockets.map(socket => ({
      id: socket.user._id,
      name: socket.user.name,
      role: socket.user.role,
      connected: true
    }));
  }
  return [];
};

export { io };
export default { initializeWebSocket, emitToUser, emitToVisit, emitToDepartment, emitToRole, broadcastNotification };
