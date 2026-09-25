/**
 * WebRTC Signaling and Real-Time Study Room Service
 * Manages peer discovery, WebRTC SDP offer/answer relay, ICE candidates,
 * synchronized Pomodoro study timer, and in-call live chat.
 */

const rooms = new Map(); // roomId -> { participants: Map(socketId -> userInfo), timer: {} }

function initStudyRoomSignaling(io) {
  io.on('connection', (socket) => {
    console.log('🔌 Client connected for Study Room:', socket.id);

    // Join a study room
    socket.on('join-room', ({ roomId, user }) => {
      if (!roomId) return;

      socket.join(roomId);
      socket.roomId = roomId;
      socket.user = user || { name: 'Student ' + socket.id.slice(0, 4), role: 'student' };

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          participants: new Map(),
          timer: { timeLeft: 25 * 60, isRunning: false, mode: 'study' },
          whiteboardStrokes: []
        });
      }

      const roomData = rooms.get(roomId);
      roomData.participants.set(socket.id, {
        socketId: socket.id,
        user: socket.user,
        joinedAt: Date.now(),
        audioEnabled: true,
        videoEnabled: true
      });

      console.log('User ' + socket.user.name + ' joined Study Room: ' + roomId + ' (Total: ' + roomData.participants.size + ')');

      // Send current participants list and existing whiteboard strokes to the joining user
      const existingParticipants = Array.from(roomData.participants.values())
        .filter(p => p.socketId !== socket.id);

      socket.emit('room-joined', {
        roomId,
        participants: existingParticipants,
        timer: roomData.timer,
        whiteboardStrokes: roomData.whiteboardStrokes || []
      });

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        user: socket.user
      });
    });

    // Relay WebRTC Offer
    socket.on('signal-offer', ({ to, offer }) => {
      io.to(to).emit('signal-offer', {
        from: socket.id,
        offer,
        user: socket.user
      });
    });

    // Relay WebRTC Answer
    socket.on('signal-answer', ({ to, answer }) => {
      io.to(to).emit('signal-answer', {
        from: socket.id,
        answer
      });
    });

    // Relay ICE Candidate
    socket.on('signal-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('signal-ice-candidate', {
        from: socket.id,
        candidate
      });
    });

    // In-call live chat
    socket.on('send-chat-message', ({ roomId, message }) => {
      if (!roomId || !message) return;
      const chatItem = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        sender: socket.user?.name || 'Anonymous',
        senderId: socket.id,
        role: socket.user?.role || 'student',
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.in(roomId).emit('chat-message', chatItem);
    });

    // Real-time speech transcript and closed captions relay
    socket.on('send-transcript-speech', ({ roomId, text, isFinal }) => {
      if (!roomId || !text) return;
      const transcriptItem = {
        id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        speaker: socket.user?.name || 'Anonymous',
        role: socket.user?.role || 'student',
        senderId: socket.id,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFinal: !!isFinal
      };
      io.in(roomId).emit('transcript-entry', transcriptItem);
    });

    // Toggle Camera / Mic status notification
    socket.on('toggle-media-status', ({ roomId, type, enabled }) => {
      const roomData = rooms.get(roomId);
      if (roomData && roomData.participants.has(socket.id)) {
        const participant = roomData.participants.get(socket.id);
        if (type === 'audio') participant.audioEnabled = enabled;
        if (type === 'video') participant.videoEnabled = enabled;
      }
      socket.to(roomId).emit('peer-media-toggled', {
        socketId: socket.id,
        type,
        enabled
      });
    });

    // Synchronized Pomodoro Study Timer
    socket.on('sync-study-timer', ({ roomId, action, timeLeft, mode }) => {
      const roomData = rooms.get(roomId);
      if (roomData) {
        if (action === 'start') roomData.timer.isRunning = true;
        if (action === 'pause') roomData.timer.isRunning = false;
        if (action === 'reset') {
          roomData.timer.isRunning = false;
          roomData.timer.timeLeft = (mode === 'break' ? 5 : 25) * 60;
        }
        if (timeLeft !== undefined) roomData.timer.timeLeft = timeLeft;
        if (mode !== undefined) roomData.timer.mode = mode;

        io.in(roomId).emit('timer-updated', roomData.timer);
      }
    });

    // Screen sharing indicator
    socket.on('screen-sharing-status', ({ roomId, isSharing }) => {
      socket.to(roomId).emit('peer-screen-sharing', {
        socketId: socket.id,
        isSharing
      });
    });

    // Collaborative Real-Time Whiteboard
    socket.on('whiteboard-draw', ({ roomId, stroke }) => {
      if (!roomId || !stroke) return;
      const roomData = rooms.get(roomId);
      if (roomData) {
        if (!roomData.whiteboardStrokes) roomData.whiteboardStrokes = [];
        roomData.whiteboardStrokes.push(stroke);
        if (roomData.whiteboardStrokes.length > 5000) {
          roomData.whiteboardStrokes.shift();
        }
      }
      socket.to(roomId).emit('whiteboard-draw', stroke);
    });

    socket.on('whiteboard-clear', ({ roomId }) => {
      if (!roomId) return;
      const roomData = rooms.get(roomId);
      if (roomData) {
        roomData.whiteboardStrokes = [];
      }
      io.in(roomId).emit('whiteboard-clear');
    });

    // Disconnect cleanup
    const handleLeave = () => {
      const roomId = socket.roomId;
      if (roomId && rooms.has(roomId)) {
        const roomData = rooms.get(roomId);
        roomData.participants.delete(socket.id);
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userName: socket.user?.name || 'A student'
        });

        if (roomData.participants.size === 0) {
          rooms.delete(roomId);
          console.log('🧹 Cleaned up empty Study Room:', roomId);
        }
      }
    };

    socket.on('leave-room', handleLeave);
    socket.on('disconnect', handleLeave);
  });
}

function getActiveRooms() {
  const active = [];
  for (const [roomId, data] of rooms.entries()) {
    active.push({
      roomId,
      participantCount: data.participants.size,
      participants: Array.from(data.participants.values()).map(p => ({
        name: p.user?.name,
        role: p.user?.role
      }))
    });
  }
  return active;
}

module.exports = {
  initStudyRoomSignaling,
  getActiveRooms
};
