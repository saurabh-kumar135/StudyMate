const mongoose = require('mongoose');

const notebookSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  originalText: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  summaryLength: {
    type: String,
    enum: ['short', 'medium', 'long'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'General'
  },
  tags: [{
    type: String
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  sourceType: {
    type: String,
    enum: ['text', 'pdf', 'file'],
    default: 'text'
  },
  sourceFileName: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search
notebookSchema.index({ title: 'text', summary: 'text', category: 'text' });

module.exports = mongoose.model('Notebook', notebookSchema);
