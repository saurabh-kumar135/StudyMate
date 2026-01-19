const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  lastName: String,
  email: {
    type: String,
    required: function() {
      
      return !this.phoneNumber;
    },
    unique: true,
    sparse: true 
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true 
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: function() {
      
      return this.authProvider === 'local';
    }
  },
  
  googleId: {
    type: String,
    unique: true,
    sparse: true 
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'phone'],
    default: 'local'
  },
  authMethod: {
    type: String,
    enum: ['email', 'phone', 'google'],
    default: 'email'
  },
  profilePicture: {
    type: String 
  },
  userType: {
    type: String,
    enum: ['guest', 'host'],
    default: 'guest'
  },
  favourites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Home'
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: String,
  emailVerificationExpires: Date,
  
  // User Statistics
  stats: {
    // Time spent on platform (in minutes)
    totalTimeMinutes: {
      type: Number,
      default: 0
    },
    // Weekly time tracking
    weeklyTimeMinutes: {
      type: Number,
      default: 0
    },
    weekStartDate: {
      type: Date,
      default: Date.now
    },
    // Daily activity for streak calculation
    activityDates: [{
      type: Date
    }],
    currentStreak: {
      type: Number,
      default: 0
    },
    // Quizzes completed
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    // Materials reviewed (summarized)
    materialsReviewed: {
      type: Number,
      default: 0
    },
    // AI conversations count
    aiConversations: {
      type: Number,
      default: 0
    },
    // Last activity timestamp
    lastActivityAt: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
