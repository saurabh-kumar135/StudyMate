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

// Helper to extract [[WikiLinks]] from text
const extractWikiLinks = (text = '') => {
  if (!text) return [];
  const regex = /\[\[([^\]]+)\]\]/g;
  const links = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (raw && !links.includes(raw)) {
      links.push(raw);
    }
  }
  return links;
};

// Default high-value computer science & AI knowledge seed graph (shown when user has few notes)
const DEFAULT_OBSIDIAN_SEEDS = [
  {
    title: 'Data Structures & Algorithms',
    category: 'Computer Science',
    tags: ['dsa', 'fundamentals', 'programming'],
    folder: 'Core Concepts',
    content: '# Data Structures & Algorithms\nCore foundations of software engineering.\nConnects directly to [[Graph Theory]] and [[Dynamic Programming]].\n\n- [x] Master array & pointer operations\n- [ ] Tree traversals (DFS/BFS)\n- [ ] Shortest path algorithms',
    summary: 'Core foundations of algorithmic problem solving, time complexity, and memory management.',
    color: '#3b82f6'
  },
  {
    title: 'Graph Theory',
    category: 'Computer Science',
    tags: ['graphs', 'algorithms', 'networking'],
    folder: 'Algorithms',
    content: '# Graph Theory\nMathematical structures modeling pairwise relations between objects.\nEssential for [[WebRTC Protocols]] topology and [[Neural Networks]] computational graphs.\n\nKey Concepts:\n- Vertices and Edges\n- Adjacency Matrices\n- Dijkstra & A* search',
    summary: 'Graph structures, traversals, connectivity, and shortest path algorithms.',
    color: '#10b981'
  },
  {
    title: 'Dynamic Programming',
    category: 'Computer Science',
    tags: ['algorithms', 'optimization', 'math'],
    folder: 'Algorithms',
    content: '# Dynamic Programming\nAlgorithmic paradigm that solves complex problems by breaking them down into simpler subproblems.\nFrequently applies to [[Data Structures & Algorithms]] optimization and [[Neural Networks]] loss backpropagation.\n\nMemoization vs Tabulation: Always identify optimal substructure!',
    summary: 'Overlapping subproblems, memoization, tabulation, and state transitions.',
    color: '#8b5cf6'
  },
  {
    title: 'Neural Networks & Deep Learning',
    category: 'Machine Learning',
    tags: ['ai', 'deep-learning', 'math'],
    folder: 'AI & ML',
    content: '# Neural Networks & Deep Learning\nComputational models inspired by biological neural networks.\nRelies heavily on [[Linear Algebra]] and [[Dynamic Programming]] principles for reverse-mode automatic differentiation.\n\n> [!NOTE]\n> Transformers and Attention mechanisms extend these basic feedforward layers into sequence understanding.',
    summary: 'Perceptrons, backpropagation, activation functions, and deep representations.',
    color: '#ec4899'
  },
  {
    title: 'WebRTC Protocols',
    category: 'Networking',
    tags: ['webrtc', 'p2p', 'realtime'],
    folder: 'Networking',
    content: '# WebRTC Protocols\nReal-time peer-to-peer audio, video, and data communication across the web.\nImplements [[Graph Theory]] mesh topologies and interacts with [[System Design]] signaling servers.\n\n- ICE, STUN, TURN discovery\n- SDP offer/answer exchange\n- SRTP encryption',
    summary: 'Peer-to-peer media streaming, ICE candidates, SDP negotiation, and NAT traversal.',
    color: '#f59e0b'
  },
  {
    title: 'System Design & Scalability',
    category: 'Engineering',
    tags: ['architecture', 'backend', 'scalability'],
    folder: 'Architecture',
    content: '# System Design & Scalability\nArchitecting distributed systems that scale to millions of concurrent users.\nDirectly utilizes [[Database Indexing]] and [[WebRTC Protocols]] for real-time applications.\n\nCore Principles:\n- Horizontal vs Vertical scaling\n- Load balancing and reverse proxies\n- Caching strategies (Redis/Memcached)',
    summary: 'High availability, load balancing, caching, microservices, and distributed architecture.',
    color: '#06b6d4'
  },
  {
    title: 'Database Indexing & Optimization',
    category: 'Engineering',
    tags: ['database', 'mongodb', 'performance'],
    folder: 'Databases',
    content: '# Database Indexing & Optimization\nTechniques for accelerating data retrieval and query execution.\nUses [[Data Structures & Algorithms]] such as B-Trees, LSM trees, and inverted indexes to optimize [[System Design & Scalability]].\n\n```sql\n-- Indexing syntax\nCREATE INDEX idx_user_created ON users(created_at);\n```',
    summary: 'B-Trees, inverted indexes, query planners, and read/write trade-offs in SQL and NoSQL.',
    color: '#6366f1'
  }
];

// ==========================================
// OBSIDIAN GRAPH ENDPOINTS
// ==========================================

// Get complete knowledge graph data for user (Nodes, Edges, Tags, Folders)
router.get('/graph/data', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    let notebooks = await Notebook.find({ user: userId }).sort({ createdAt: -1 });

    // If user has no notebooks yet, generate initial knowledge vault notes for them
    if (notebooks.length === 0) {
      const createdSeedNotes = [];
      for (const seed of DEFAULT_OBSIDIAN_SEEDS) {
        const nb = new Notebook({
          user: userId,
          title: seed.title,
          category: seed.category,
          tags: seed.tags,
          folder: seed.folder,
          originalText: seed.content,
          content: seed.content,
          summary: seed.summary,
          color: seed.color,
          links: extractWikiLinks(seed.content).map(targetTitle => ({ targetTitle }))
        });
        await nb.save();
        createdSeedNotes.push(nb);
      }
      notebooks = createdSeedNotes;
    }

    // Build title-to-ID lookup map
    const titleToIdMap = new Map();
    const idToNoteMap = new Map();
    notebooks.forEach(nb => {
      titleToIdMap.set(nb.title.toLowerCase().trim(), nb._id.toString());
      idToNoteMap.set(nb._id.toString(), nb);
    });

    const nodes = [];
    const links = [];
    const linkSet = new Set();
    const categoriesSet = new Set();
    const tagsSet = new Set();
    const foldersSet = new Set();

    // Color palette for auto-assigning categories
    const categoryColors = {
      'Computer Science': '#3b82f6',
      'Machine Learning': '#ec4899',
      'Networking': '#f59e0b',
      'Engineering': '#06b6d4',
      'Databases': '#6366f1',
      'Algorithms': '#10b981',
      'General': '#8b5cf6'
    };

    // 1. Create Nodes
    notebooks.forEach(nb => {
      const id = nb._id.toString();
      const cat = nb.category || 'General';
      categoriesSet.add(cat);
      const folderName = nb.folder || 'Notes';
      foldersSet.add(folderName);
      (nb.tags || []).forEach(t => tagsSet.add(t));

      const noteContent = nb.content || nb.originalText || nb.summary || '';
      const explicitLinks = extractWikiLinks(noteContent);

      nodes.push({
        id,
        label: nb.title,
        title: nb.title,
        category: cat,
        folder: nb.folder || 'Notes',
        tags: nb.tags || [],
        color: nb.color || categoryColors[cat] || '#3b82f6',
        summary: (nb.summary || noteContent).substring(0, 200),
        content: noteContent,
        wordCount: noteContent.split(/\s+/).filter(Boolean).length,
        createdAt: nb.createdAt,
        updatedAt: nb.updatedAt,
        degree: explicitLinks.length
      });
    });

    // 2. Create Explicit [[WikiLink]] Edges
    notebooks.forEach(nb => {
      const sourceId = nb._id.toString();
      const noteContent = nb.content || nb.originalText || nb.summary || '';
      const explicitLinks = extractWikiLinks(noteContent);

      explicitLinks.forEach(targetTitle => {
        const targetLower = targetTitle.toLowerCase().trim();
        const targetId = titleToIdMap.get(targetLower);

        if (targetId && targetId !== sourceId) {
          const edgeKey = [sourceId, targetId].sort().join('--');
          if (!linkSet.has(edgeKey)) {
            linkSet.add(edgeKey);
            links.push({
              source: sourceId,
              target: targetId,
              label: 'links to',
              type: 'explicit',
              color: '#3b82f6',
              weight: 2
            });
          }
        } else if (!targetId) {
          // Unresolved / placeholder link (Obsidian ghost node)
          const ghostId = `ghost_${targetLower.replace(/\s+/g, '_')}`;
          if (!nodes.find(n => n.id === ghostId)) {
            nodes.push({
              id: ghostId,
              label: targetTitle,
              title: targetTitle,
              category: 'Uncreated',
              folder: 'Unresolved',
              tags: ['unresolved'],
              color: '#6b7280',
              isGhost: true,
              summary: 'This note has not been created yet. Click to create it in your vault!',
              content: `# ${targetTitle}\n\nStart writing here...`,
              degree: 1
            });
          }
          const edgeKey = [sourceId, ghostId].sort().join('--');
          if (!linkSet.has(edgeKey)) {
            linkSet.add(edgeKey);
            links.push({
              source: sourceId,
              target: ghostId,
              label: 'mentions',
              type: 'unresolved',
              color: '#6b7280',
              weight: 1
            });
          }
        }
      });
    });

    // 3. Create Semantic / Tag-based secondary edges
    for (let i = 0; i < notebooks.length; i++) {
      for (let j = i + 1; j < notebooks.length; j++) {
        const n1 = notebooks[i];
        const n2 = notebooks[j];
        const id1 = n1._id.toString();
        const id2 = n2._id.toString();
        const edgeKey = [id1, id2].sort().join('--');

        if (!linkSet.has(edgeKey)) {
          // Check shared tags
          const tags1 = new Set(n1.tags || []);
          const sharedTags = (n2.tags || []).filter(t => tags1.has(t));

          if (sharedTags.length >= 2) {
            linkSet.add(edgeKey);
            links.push({
              source: id1,
              target: id2,
              label: `shares #${sharedTags[0]}`,
              type: 'tag',
              color: '#8b5cf6',
              weight: 1.2
            });
          } else if (n1.category && n1.category === n2.category && n1.category !== 'General') {
            linkSet.add(edgeKey);
            links.push({
              source: id1,
              target: id2,
              label: n1.category,
              type: 'category',
              color: '#374151',
              weight: 0.8
            });
          }
        }
      }
    }

    res.json({
      success: true,
      nodes,
      links,
      categories: Array.from(categoriesSet),
      tags: Array.from(tagsSet),
      folders: Array.from(foldersSet),
      stats: {
        totalNotes: nodes.filter(n => !n.isGhost).length,
        totalUnresolved: nodes.filter(n => n.isGhost).length,
        totalLinks: links.length
      }
    });
  } catch (error) {
    console.error('Error fetching knowledge graph data:', error);
    res.status(500).json({ success: false, error: 'Failed to compute knowledge graph' });
  }
});

// Auto-link all notes across user vault
router.post('/graph/auto-link', requireAuth, async (req, res) => {
  try {
    const userId = req.session && req.session.user ? req.session.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const notebooks = await Notebook.find({ user: userId });

    let newlyLinkedCount = 0;
    const updatedNotes = [];

    for (const nb of notebooks) {
      let content = nb.content || nb.originalText || nb.summary || '';
      let modified = false;

      for (const other of notebooks) {
        if (!other || !other._id || !other.title) continue;
        if (other._id.toString() === nb._id.toString()) continue;
        const otherTitle = String(other.title).trim();
        if (otherTitle.length < 3) continue;

        // Regex that matches title if not already surrounded by [[ ... ]]
        const escaped = otherTitle.replace(/[.*+?^()|[\]{}\\]/g, (c) => '\\' + c);
        const pattern = new RegExp('(?<!\\[\\[)\\b(' + escaped + ')\\b(?!\\]\\])', 'gi');

        if (pattern.test(content)) {
          content = content.replace(pattern, (match, g1) => '[[' + g1 + ']]');
          modified = true;
          newlyLinkedCount++;
        }
      }

      if (modified) {
        nb.content = content;
        if (!nb.originalText) nb.originalText = content;
        if (!nb.summary) nb.summary = content.substring(0, 200);
        nb.links = extractWikiLinks(content).map(targetTitle => ({ targetTitle }));
        nb.updatedAt = new Date();
        await nb.save();
        updatedNotes.push(nb.title);
      }
    }

    res.json({
      success: true,
      newlyLinkedCount,
      updatedNotes
    });
  } catch (error) {
    console.error('Error auto-linking notes:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to auto-link notes' });
  }
});

// Seed starter connected knowledge vault notes for user
router.post('/graph/seed', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    let seededCount = 0;
    for (const seed of DEFAULT_OBSIDIAN_SEEDS) {
      const existing = await Notebook.findOne({ user: userId, title: seed.title });
      if (!existing) {
        const nb = new Notebook({
          user: userId,
          title: seed.title,
          category: seed.category,
          tags: seed.tags,
          folder: seed.folder,
          originalText: seed.content,
          content: seed.content,
          summary: seed.summary,
          color: seed.color,
          links: extractWikiLinks(seed.content).map(targetTitle => ({ targetTitle }))
        });
        await nb.save();
        seededCount++;
      }
    }

    res.json({
      success: true,
      seededCount,
      message: seededCount > 0 ? `Seeded ${seededCount} connected notes into your knowledge vault.` : 'Knowledge vault already contains starter notes.'
    });
  } catch (error) {
    console.error('Error seeding knowledge graph:', error);
    res.status(500).json({ success: false, error: 'Failed to seed knowledge vault' });
  }
});

// Get backlinks and unlinked mentions for a specific notebook
router.get('/:id/backlinks', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const currentNote = await Notebook.findOne({ _id: req.params.id, user: userId });

    if (!currentNote) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const allNotes = await Notebook.find({ user: userId });
    const targetTitle = currentNote.title.trim();
    const targetLower = targetTitle.toLowerCase();

    const linkedMentions = [];
    const unlinkedMentions = [];

    allNotes.forEach(other => {
      if (other._id.toString() === currentNote._id.toString()) return;

      const content = other.content || other.originalText || other.summary || '';
      const explicitLinks = extractWikiLinks(content).map(t => t.toLowerCase());

      if (explicitLinks.includes(targetLower)) {
        // Linked mention
        const idx = content.toLowerCase().indexOf(`[[${targetLower}]]`);
        const snippetStart = Math.max(0, idx - 60);
        const snippetEnd = Math.min(content.length, idx + targetTitle.length + 64);
        const snippet = (snippetStart > 0 ? '...' : '') + content.substring(snippetStart, snippetEnd) + (snippetEnd < content.length ? '...' : '');

        linkedMentions.push({
          _id: other._id,
          title: other.title,
          folder: other.folder || 'Notes',
          snippet: snippet || content.substring(0, 100)
        });
      } else if (content.toLowerCase().includes(targetLower)) {
        // Unlinked mention
        const idx = content.toLowerCase().indexOf(targetLower);
        const snippetStart = Math.max(0, idx - 60);
        const snippetEnd = Math.min(content.length, idx + targetTitle.length + 64);
        const snippet = (snippetStart > 0 ? '...' : '') + content.substring(snippetStart, snippetEnd) + (snippetEnd < content.length ? '...' : '');

        unlinkedMentions.push({
          _id: other._id,
          title: other.title,
          folder: other.folder || 'Notes',
          snippet: snippet || content.substring(0, 100)
        });
      }
    });

    res.json({
      success: true,
      currentNote: {
        _id: currentNote._id,
        title: currentNote.title
      },
      linkedMentions,
      unlinkedMentions
    });
  } catch (error) {
    console.error('Error fetching backlinks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch backlinks' });
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
        content: notebook.content || notebook.originalText || notebook.summary || '',
        summary: notebook.summary,
        summaryLength: notebook.summaryLength,
        category: notebook.category,
        folder: notebook.folder || 'Notes',
        tags: notebook.tags || [],
        links: notebook.links || [],
        color: notebook.color || '#3b82f6',
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
    const { title, originalText, content, summary, summaryLength, category, tags, folder, color, sourceType, sourceFileName } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const noteContent = content || originalText || summary || `# ${title}\n\nStart writing your thoughts here...`;
    const noteSummary = summary || noteContent.substring(0, 200);
    const links = extractWikiLinks(noteContent).map(targetTitle => ({ targetTitle }));

    const notebook = new Notebook({
      user: req.session.user._id,
      title: title.trim(),
      originalText: originalText || noteContent,
      content: noteContent,
      summary: noteSummary,
      summaryLength: summaryLength || 'medium',
      category: category || 'General',
      folder: folder || 'Notes',
      tags: tags || [],
      links,
      color: color || '#3b82f6',
      sourceType: sourceType || 'text',
      sourceFileName: sourceFileName || null
    });

    await notebook.save();

    // Update user stats
    const user = await User.findById(req.session.user._id);
    if (user) {
      if (!user.stats) {
        user.stats = { materialsReviewed: 0 };
      }
      user.stats.materialsReviewed = (user.stats.materialsReviewed || 0) + 1;
      await user.save();
    }

    res.status(201).json({
      success: true,
      notebook: {
        _id: notebook._id,
        title: notebook.title,
        content: notebook.content,
        category: notebook.category,
        folder: notebook.folder,
        tags: notebook.tags,
        links: notebook.links,
        color: notebook.color,
        createdAt: notebook.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating notebook:', error);
    res.status(500).json({ success: false, error: 'Failed to create notebook: ' + error.message });
  }
});

// Update a notebook
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, content, summary, category, folder, tags, color, isFeatured } = req.body;
    const noteContent = content !== undefined ? content : summary;
    const links = noteContent ? extractWikiLinks(noteContent).map(targetTitle => ({ targetTitle })) : undefined;

    const updateFields = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateFields.title = title.trim();
    if (content !== undefined) updateFields.content = content;
    if (summary !== undefined) updateFields.summary = summary;
    if (category !== undefined) updateFields.category = category;
    if (folder !== undefined) updateFields.folder = folder;
    if (tags !== undefined) updateFields.tags = tags;
    if (color !== undefined) updateFields.color = color;
    if (links !== undefined) updateFields.links = links;
    if (isFeatured !== undefined) updateFields.isFeatured = isFeatured;

    const notebook = await Notebook.findOneAndUpdate(
      { _id: req.params.id, user: req.session.user._id },
      { $set: updateFields },
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
        content: notebook.content || notebook.originalText || notebook.summary || '',
        category: notebook.category,
        folder: notebook.folder || 'Notes',
        tags: notebook.tags || [],
        links: notebook.links || [],
        color: notebook.color || '#3b82f6',
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
