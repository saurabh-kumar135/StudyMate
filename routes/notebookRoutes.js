const express = require('express');
const router = express.Router();
const Notebook = require('../models/notebook');
const User = require('../models/user');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  console.log('Auth check - isLoggedIn:', req.session?.isLoggedIn, 'user:', !!req.session?.user);
  if (!req.session.isLoggedIn || !req.session.user) {
    console.log('Auth failed - returning 401');
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  console.log('Auth passed for user:', req.session.user._id);
  next();
};

// Get all notebooks for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const notebooks = await Notebook.find({ user: req.session.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      notebooks: notebooks.map(nb => ({
        _id: nb._id,
        title: nb.title,
        category: nb.category,
        summaryLength: nb.summaryLength,
        sourceType: nb.sourceType,
        createdAt: nb.createdAt,
        isFeatured: nb.isFeatured
      }))
    });
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notebooks' });
  }
});

// Get recent notebooks (last 10)
router.get('/recent', requireAuth, async (req, res) => {
  try {
    const notebooks = await Notebook.find({ user: req.session.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      notebooks: notebooks.map(nb => ({
        _id: nb._id,
        title: nb.title,
        category: nb.category,
        createdAt: nb.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching recent notebooks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notebooks' });
  }
});

// Get featured notebooks
router.get('/featured', requireAuth, async (req, res) => {
  try {
    const notebooks = await Notebook.find({ 
      user: req.session.user._id,
      isFeatured: true 
    })
      .sort({ createdAt: -1 })
      .limit(6);
    
    res.json({
      success: true,
      notebooks: notebooks.map(nb => ({
        _id: nb._id,
        title: nb.title,
        category: nb.category,
        createdAt: nb.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching featured notebooks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notebooks' });
  }
});

// Search notebooks
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, notebooks: [] });
    }

    const searchQuery = q.trim();
    
    // Search in title, summary, and category using regex (case-insensitive)
    const notebooks = await Notebook.find({
      user: req.session.user._id,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { summary: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      query: searchQuery,
      count: notebooks.length,
      notebooks: notebooks.map(nb => ({
        _id: nb._id,
        title: nb.title,
        summary: nb.summary.substring(0, 200) + '...',
        category: nb.category,
        createdAt: nb.createdAt,
        isFeatured: nb.isFeatured
      }))
    });
  } catch (error) {
    console.error('Error searching notebooks:', error);
    res.status(500).json({ success: false, error: 'Failed to search notebooks' });
  }
});

// Get a single notebook by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ 
      _id: req.params.id,
      user: req.session.user._id 
    });
    
    if (!notebook) {
      return res.status(404).json({ success: false, error: 'Notebook not found' });
    }

    res.json({
      success: true,
      notebook: {
        _id: notebook._id,
        title: notebook.title,
        originalText: notebook.originalText,
        summary: notebook.summary,
        summaryLength: notebook.summaryLength,
        category: notebook.category,
        tags: notebook.tags,
        isFeatured: notebook.isFeatured,
        sourceType: notebook.sourceType,
        sourceFileName: notebook.sourceFileName,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching notebook:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notebook' });
  }
});

// Create a new notebook
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('Creating notebook for user:', req.session.user._id);
    console.log('Request body keys:', Object.keys(req.body));
    
    const { title, originalText, summary, summaryLength, category, tags, sourceType, sourceFileName } = req.body;

    if (!title || !originalText || !summary) {
      console.log('Missing required fields - title:', !!title, 'originalText:', !!originalText, 'summary:', !!summary);
      return res.status(400).json({ success: false, error: 'Title, original text, and summary are required' });
    }

    const notebook = new Notebook({
      user: req.session.user._id,
      title,
      originalText,
      summary,
      summaryLength: summaryLength || 'medium',
      category: category || 'General',
      tags: tags || [],
      sourceType: sourceType || 'text',
      sourceFileName: sourceFileName || null
    });

    await notebook.save();
    console.log('Notebook saved with ID:', notebook._id);

    // Update user stats
    const user = await User.findById(req.session.user._id);
    if (user) {
      if (!user.stats) {
        user.stats = { materialsReviewed: 0 };
      }
      user.stats.materialsReviewed = (user.stats.materialsReviewed || 0) + 1;
      await user.save();
      console.log('User stats updated');
    }

    res.status(201).json({
      success: true,
      notebook: {
        _id: notebook._id,
        title: notebook.title,
        category: notebook.category,
        createdAt: notebook.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating notebook:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to create notebook: ' + error.message });
  }
});

// Update a notebook
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, summary, category, tags, isFeatured } = req.body;

    const notebook = await Notebook.findOneAndUpdate(
      { _id: req.params.id, user: req.session.user._id },
      { 
        $set: { 
          title: title,
          summary: summary,
          category: category,
          tags: tags,
          isFeatured: isFeatured,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!notebook) {
      return res.status(404).json({ success: false, error: 'Notebook not found' });
    }

    res.json({
      success: true,
      notebook: {
        _id: notebook._id,
        title: notebook.title,
        category: notebook.category,
        isFeatured: notebook.isFeatured,
        updatedAt: notebook.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating notebook:', error);
    res.status(500).json({ success: false, error: 'Failed to update notebook' });
  }
});

// Delete a notebook
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const notebook = await Notebook.findOneAndDelete({ 
      _id: req.params.id,
      user: req.session.user._id 
    });

    if (!notebook) {
      return res.status(404).json({ success: false, error: 'Notebook not found' });
    }

    res.json({ success: true, message: 'Notebook deleted successfully' });
  } catch (error) {
    console.error('Error deleting notebook:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notebook' });
  }
});

// Toggle featured status
router.patch('/:id/toggle-featured', requireAuth, async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ 
      _id: req.params.id,
      user: req.session.user._id 
    });

    if (!notebook) {
      return res.status(404).json({ success: false, error: 'Notebook not found' });
    }

    notebook.isFeatured = !notebook.isFeatured;
    await notebook.save();

    res.json({
      success: true,
      isFeatured: notebook.isFeatured
    });
  } catch (error) {
    console.error('Error toggling featured:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle featured status' });
  }
});

module.exports = router;
