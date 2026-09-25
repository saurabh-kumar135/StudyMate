const express = require('express');
const router = express.Router();
const { getActiveRooms } = require('../services/studyRoomSignaling');

// GET /api/study-rooms/active
router.get('/active', (req, res) => {
  const rooms = getActiveRooms();
  res.json({
    success: true,
    count: rooms.length,
    rooms
  });
});

// GET /api/study-rooms/config - Returns public STUN servers for WebRTC
router.get('/config', (req, res) => {
  res.json({
    success: true,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.relay.metered.ca:80' }
    ]
  });
});

// POST /api/study-rooms/create - Generate a new study room
router.post('/create', (req, res) => {
  const { title, topic, creatorName } = req.body;
  const uniqueCode = 'room_' + Math.random().toString(36).substr(2, 6);
  res.json({
    success: true,
    roomId: uniqueCode,
    title: title || 'Collaborative Study Session',
    topic: topic || 'General Learning',
    creator: creatorName || 'Host'
  });
});

// POST /api/study-rooms/summarize-transcript - AI-powered session summarizer
router.post('/summarize-transcript', async (req, res) => {
  try {
    const { transcriptText, topic } = req.body;
    if (!transcriptText || !transcriptText.trim()) {
      return res.status(400).json({ success: false, message: 'Transcript text is required' });
    }
    const { summarizeStudySession } = require('../utils/geminiService');
    const result = await summarizeStudySession(transcriptText, topic);
    res.json(result);
  } catch (err) {
    console.error('Transcript summary endpoint error:', err);
    res.status(500).json({ success: false, error: 'Failed to summarize transcript' });
  }
});

module.exports = router;
