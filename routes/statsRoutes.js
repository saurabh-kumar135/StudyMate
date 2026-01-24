const express = require('express');
const router = express.Router();
const User = require('../models/user');


const requireAuth = (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

// Get user stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Initialize stats if not exists
    if (!user.stats) {
      user.stats = {
        totalTimeMinutes: 0,
        weeklyTimeMinutes: 0,
        weekStartDate: new Date(),
        activityDates: [],
        currentStreak: 0,
        quizzesCompleted: 0,
        materialsReviewed: 0,
        aiConversations: 0,
        lastActivityAt: new Date()
      };
      await user.save();
    }

    // Check if we need to reset weekly stats
    const now = new Date();
    const weekStart = user.stats?.weekStartDate ? new Date(user.stats.weekStartDate) : now;
    const daysSinceWeekStart = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24));
    
    if (daysSinceWeekStart >= 7) {
      // Reset weekly stats
      user.stats.weeklyTimeMinutes = 0;
      user.stats.weekStartDate = now;
      await user.save();
    }

    // Calculate current streak
    const currentStreak = calculateStreak(user.stats?.activityDates || []);

    res.json({
      success: true,
      stats: {
        weeklyTimeHours: ((user.stats?.weeklyTimeMinutes || 0) / 60).toFixed(1),
        currentStreak: currentStreak,
        quizzesCompleted: user.stats?.quizzesCompleted || 0,
        materialsReviewed: user.stats?.materialsReviewed || 0,
        aiConversations: user.stats?.aiConversations || 0,
        totalTimeHours: ((user.stats?.totalTimeMinutes || 0) / 60).toFixed(1)
      },
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Track time spent on platform
router.post('/track-time', requireAuth, async (req, res) => {
  try {
    const { minutes } = req.body;
    if (!minutes || minutes < 0) {
      return res.status(400).json({ success: false, error: 'Invalid time value' });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Initialize stats if not exists
    if (!user.stats) {
      user.stats = {
        totalTimeMinutes: 0,
        weeklyTimeMinutes: 0,
        weekStartDate: new Date(),
        activityDates: [],
        currentStreak: 0,
        quizzesCompleted: 0,
        materialsReviewed: 0,
        aiConversations: 0,
        lastActivityAt: new Date()
      };
    }

    // Update time
    user.stats.totalTimeMinutes = (user.stats.totalTimeMinutes || 0) + minutes;
    user.stats.weeklyTimeMinutes = (user.stats.weeklyTimeMinutes || 0) + minutes;
    user.stats.lastActivityAt = new Date();

    // Add today's date to activity dates if not already there
    const today = new Date().toDateString();
    const activityDates = user.stats.activityDates || [];
    const hasTodayActivity = activityDates.some(d => new Date(d).toDateString() === today);
    
    if (!hasTodayActivity) {
      user.stats.activityDates.push(new Date());
      // Keep only last 30 days
      user.stats.activityDates = user.stats.activityDates.slice(-30);
    }

    await user.save();

    res.json({
      success: true,
      stats: {
        weeklyTimeHours: (user.stats.weeklyTimeMinutes / 60).toFixed(1),
        currentStreak: calculateStreak(user.stats.activityDates)
      }
    });
  } catch (error) {
    console.error('Error tracking time:', error);
    res.status(500).json({ success: false, error: 'Failed to track time' });
  }
});

// Increment quiz completed
router.post('/increment-quiz', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.stats) {
      user.stats = { quizzesCompleted: 0 };
    }
    user.stats.quizzesCompleted = (user.stats.quizzesCompleted || 0) + 1;
    user.stats.lastActivityAt = new Date();
    
    // Add today's activity
    const today = new Date().toDateString();
    const activityDates = user.stats.activityDates || [];
    if (!activityDates.some(d => new Date(d).toDateString() === today)) {
      if (!user.stats.activityDates) user.stats.activityDates = [];
      user.stats.activityDates.push(new Date());
    }

    await user.save();

    res.json({
      success: true,
      quizzesCompleted: user.stats.quizzesCompleted
    });
  } catch (error) {
    console.error('Error incrementing quiz:', error);
    res.status(500).json({ success: false, error: 'Failed to update quiz count' });
  }
});

// Increment materials reviewed
router.post('/increment-material', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.stats) {
      user.stats = { materialsReviewed: 0 };
    }
    user.stats.materialsReviewed = (user.stats.materialsReviewed || 0) + 1;
    user.stats.lastActivityAt = new Date();
    
    // Add today's activity
    const today = new Date().toDateString();
    const activityDates = user.stats.activityDates || [];
    if (!activityDates.some(d => new Date(d).toDateString() === today)) {
      if (!user.stats.activityDates) user.stats.activityDates = [];
      user.stats.activityDates.push(new Date());
    }

    await user.save();

    res.json({
      success: true,
      materialsReviewed: user.stats.materialsReviewed
    });
  } catch (error) {
    console.error('Error incrementing material:', error);
    res.status(500).json({ success: false, error: 'Failed to update material count' });
  }
});

// Increment AI conversations
router.post('/increment-conversation', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.stats) {
      user.stats = { aiConversations: 0 };
    }
    user.stats.aiConversations = (user.stats.aiConversations || 0) + 1;
    user.stats.lastActivityAt = new Date();

    await user.save();

    res.json({
      success: true,
      aiConversations: user.stats.aiConversations
    });
  } catch (error) {
    console.error('Error incrementing conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to update conversation count' });
  }
});

function calculateStreak(activityDates) {
  if (!activityDates || activityDates.length === 0) return 0;

  const sortedDates = activityDates
    .map(d => new Date(d).toDateString())
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => new Date(b) - new Date(a));

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Check if user was active today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(sortedDates[0]);

  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(checkDate);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (sortedDates.includes(expectedDate.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

module.exports = router;
