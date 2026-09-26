import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  Network, FileText, Folder, FolderPlus, Plus, Search,
  Link2, Sparkles, Maximize2, Minimize2, Eye, Edit3,
  Columns, CheckSquare, Code, Tag, Sliders, ZoomIn, ZoomOut,
  RotateCcw, Compass, Hash, ArrowUpRight, Trash2, Save,
  Check, X, ChevronRight, ChevronDown, Layers, BookOpen,
  ArrowLeft, RefreshCw, HelpCircle, ExternalLink, Calendar,
  Clock, AlignLeft
} from 'lucide-react';

import { API_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';

export default function ObsidianVault() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  // Primary Views: 'editor' | 'graph' | 'split'
  const [viewMode, setViewMode] = useState('editor');
  const [editorTab, setEditorTab] = useState('preview'); // 'edit' | 'preview' | 'split'

  // Vault Notes & Graph Data
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [], categories: [], tags: [], folders: [] });
  const [backlinks, setBacklinks] = useState({ linkedMentions: [], unlinkedMentions: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoLinking, setAutoLinking] = useState(false);

  // Note Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editFolder, setEditFolder] = useState('Notes');
  const [editTags, setEditTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [editColor, setEditColor] = useState('#3b82f6');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [expandedFolders, setExpandedFolders] = useState({ 'Core Concepts': true, 'Notes': true, 'Algorithms': true, 'AI & ML': true });

  // Autocomplete [[WikiLink]] Dropdown State
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const [linkSearchText, setLinkSearchText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // Knowledge Graph Physics & Canvas Controls
  const canvasRef = useRef(null);
  const localCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const simNodesRef = useRef([]);
  const [graphZoom, setGraphZoom] = useState(1);
  const [graphPan, setGraphPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [physicsSettings, setPhysicsSettings] = useState({
    repulsion: 4200,
    linkDistance: 210,
    gravity: 0.008,
    showLabels: true,
    showUnresolved: true,
    nodeSizeScale: 1
  });
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Color map for categories
  const categoryColors = useMemo(() => ({
    'Computer Science': '#3b82f6',
    'Machine Learning': '#ec4899',
    'Networking': '#f59e0b',
    'Engineering': '#06b6d4',
    'Databases': '#6366f1',
    'Algorithms': '#10b981',
    'General': '#8b5cf6',
    'Uncreated': '#6b7280'
  }), []);

  // 1. Fetch Complete Knowledge Graph & Notes on Mount
  const fetchGraphAndNotes = async (selectId = null) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/notebooks/graph/data`, { withCredentials: true });
      if (res.data && res.data.success) {
        setGraphData(res.data);
        const validNotes = res.data.nodes.filter(n => !n.isGhost);
        setNotes(validNotes);

        // Auto-seed starter notes if vault is completely empty
        if (validNotes.length === 0) {
          try {
            const seedRes = await axios.post(`${API_URL}/api/notebooks/graph/seed`, {}, { withCredentials: true });
            if (seedRes.data && seedRes.data.success && seedRes.data.seededCount > 0) {
              const retryRes = await axios.get(`${API_URL}/api/notebooks/graph/data`, { withCredentials: true });
              if (retryRes.data && retryRes.data.success) {
                setGraphData(retryRes.data);
                const retryValid = retryRes.data.nodes.filter(n => !n.isGhost);
                setNotes(retryValid);
                if (retryValid.length > 0) {
                  selectNote(retryValid[0].id, retryValid);
                }
                return;
              }
            }
          } catch (seedErr) {
            console.warn('Auto-seed attempt skipped:', seedErr);
          }
        }

        // Select specific note or default to first note
        const targetId = selectId || activeNoteId || (validNotes.length > 0 ? validNotes[0].id : null);
        if (targetId) {
          selectNote(targetId, validNotes);
        }
      }
    } catch (err) {
      console.error('Error fetching vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Seed Starter Connected Vault manually
  const handleSeedVault = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/notebooks/graph/seed`, {}, { withCredentials: true });
      if (res.data && res.data.success) {
        await fetchGraphAndNotes();
      }
    } catch (err) {
      console.error('Error seeding vault:', err);
      alert('Failed to load starter notes. Please make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphAndNotes();
  }, []);

  // Select and load note details + backlinks
  const selectNote = async (id, noteList = notes) => {
    setActiveNoteId(id);
    const found = noteList.find(n => n.id === id);
    if (found) {
      setActiveNote(found);
      setEditTitle(found.title);
      setEditContent(found.content || found.summary || '');
      setEditCategory(found.category || 'General');
      setEditFolder(found.folder || 'Notes');
      setEditTags(found.tags || []);
      setEditColor(found.color || '#3b82f6');
    }

    // Fetch live backlinks
    if (id && !id.startsWith('ghost_')) {
      try {
        const blRes = await axios.get(`${API_URL}/api/notebooks/${id}/backlinks`, { withCredentials: true });
        if (blRes.data && blRes.data.success) {
          setBacklinks(blRes.data);
        }
      } catch (e) {
        // silent catch
      }
    }
  };

  // 2. Save Note Changes (Content, Title, Tags, Folder)
  const handleSaveNote = async () => {
    if (!activeNoteId || activeNoteId.startsWith('ghost_')) {
      // Create new note
      handleCreateNote(editTitle, editContent);
      return;
    }

    try {
      setSaving(true);
      const res = await axios.put(`${API_URL}/api/notebooks/${activeNoteId}`, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        folder: editFolder,
        tags: editTags,
        color: editColor
      }, { withCredentials: true });

      if (res.data && res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        // Refresh graph without losing active selection
        fetchGraphAndNotes(activeNoteId);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  // 3. Create Brand New Note
  const handleCreateNote = async (title = 'Untitled Note', content = '') => {
    try {
      setSaving(true);
      const initialContent = content || `# ${title}\n\nStart typing your thoughts here...\nUse \`[[Other Note]]\` to create bi-directional concept links.`;
      const res = await axios.post(`${API_URL}/api/notebooks`, {
        title,
        content: initialContent,
        category: editCategory || 'General',
        folder: editFolder || 'Notes',
        tags: editTags || ['concept'],
        color: editColor || '#3b82f6'
      }, { withCredentials: true });

      if (res.data && res.data.success) {
        const newId = res.data.notebook._id;
        await fetchGraphAndNotes(newId);
        setEditorTab('edit');
      }
    } catch (err) {
      console.error('Error creating note:', err);
      alert('Failed to create note');
    } finally {
      setSaving(false);
    }
  };

  // 4. Delete Note
  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this note from your Obsidian Vault?')) return;
    try {
      await axios.delete(`${API_URL}/api/notebooks/${id}`, { withCredentials: true });
      fetchGraphAndNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  // 5. Run AI Auto-Linker across entire Vault
  const handleAutoLinkVault = async () => {
    try {
      setAutoLinking(true);
      const res = await axios.post(`${API_URL}/api/notebooks/graph/auto-link`, {}, { withCredentials: true });
      if (res.data && res.data.success) {
        alert(`Obsidian Auto-Link Complete! Linked ${res.data.newlyLinkedCount} concept mentions across ${res.data.updatedNotes.length} notes.`);
        fetchGraphAndNotes(activeNoteId);
      }
    } catch (err) {
      console.error('Auto-link error:', err);
      alert('Failed to run auto-linking.');
    } finally {
      setAutoLinking(false);
    }
  };

  // 6. Link an Unlinked Mention directly into the other note
  const handleLinkUnlinkedMention = async (mentionNoteId, mentionNoteTitle) => {
    try {
      // Fetch mention note
      const res = await axios.get(`${API_URL}/api/notebooks/${mentionNoteId}`, { withCredentials: true });
      if (res.data && res.data.success) {
        const nb = res.data.notebook;
        const currentTitle = activeNote.title.trim();
        const escaped = currentTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?<!\\[\\[)\\b(${escaped})\\b(?!\\]\\])`, 'gi');
        const updatedContent = (nb.content || nb.originalText || '').replace(pattern, `[[$1]]`);

        await axios.put(`${API_URL}/api/notebooks/${mentionNoteId}`, {
          content: updatedContent
        }, { withCredentials: true });

        // Refresh backlinks
        selectNote(activeNoteId);
        fetchGraphAndNotes(activeNoteId);
      }
    } catch (err) {
      console.error('Error linking mention:', err);
    }
  };

  // 7. Textarea WikiLink Autocomplete detection
  const handleContentChange = (e) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setEditContent(value);
    setCursorPosition(pos);

    // Look back from cursor to see if user just typed [[
    const textBeforeCursor = value.substring(0, pos);
    const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');
    const lastClosingBracket = textBeforeCursor.lastIndexOf(']]');

    if (lastDoubleBracket !== -1 && lastDoubleBracket > lastClosingBracket) {
      const query = textBeforeCursor.substring(lastDoubleBracket + 2);
      if (!query.includes('\n') && query.length < 30) {
        setLinkSearchText(query.toLowerCase());
        setShowLinkDropdown(true);
        return;
      }
    }
    setShowLinkDropdown(false);
  };

  // Insert selected note as [[WikiLink]]
  const insertWikiLink = (noteTitle) => {
    const textBeforeCursor = editContent.substring(0, cursorPosition);
    const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');
    if (lastDoubleBracket !== -1) {
      const prefix = editContent.substring(0, lastDoubleBracket);
      const suffix = editContent.substring(cursorPosition);
      const newText = `${prefix}[[${noteTitle}]]${suffix}`;
      setEditContent(newText);
      setShowLinkDropdown(false);
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = prefix.length + noteTitle.length + 4;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 50);
    }
  };

  // Filter notes for the [[ autocomplete dropdown
  const filteredDropdownNotes = useMemo(() => {
    if (!linkSearchText) return notes.slice(0, 8);
    return notes.filter(n => n.title.toLowerCase().includes(linkSearchText)).slice(0, 8);
  }, [notes, linkSearchText]);

  // Insert Markdown formatting snippet at cursor
  const insertFormatting = (prefix, suffix = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || 'text';
    const replacement = `${prefix}${selectedText}${suffix}`;

    setEditContent(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  // Filtered notes in File Explorer Sidebar
  const filteredVaultNotes = useMemo(() => {
    return notes.filter(note => {
      const matchSearch = !searchQuery || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTag = !selectedTagFilter || (note.tags && note.tags.includes(selectedTagFilter));
      const matchCategory = !selectedCategoryFilter || note.category === selectedCategoryFilter;
      const matchFolder = selectedFolder === 'all' || (note.folder || 'Notes') === selectedFolder;
      return matchSearch && matchTag && matchCategory && matchFolder;
    });
  }, [notes, searchQuery, selectedTagFilter, selectedCategoryFilter, selectedFolder]);

  // Folder groups
  const folderTree = useMemo(() => {
    const map = {};
    notes.forEach(note => {
      const f = note.folder || 'Notes';
      if (!map[f]) map[f] = [];
      map[f].push(note);
    });
    return map;
  }, [notes]);

  // Custom WikiLink Markdown Component Renderer
  const renderMarkdownWithWikiLinks = (rawText) => {
    if (!rawText) return null;

    // Custom regex replacer for [[Note Title]]
    // We convert [[Topic]] into custom HTML tags for click handling
    const parts = [];
    const wikiRegex = /\[\[([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = wikiRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(rawText.substring(lastIndex, match.index));
      }
      const title = match[1].trim();
      const targetNote = notes.find(n => n.title.toLowerCase() === title.toLowerCase());

      parts.push(
        <button
          key={`wikilink-${match.index}`}
          type="button"
          onClick={() => {
            if (targetNote) {
              selectNote(targetNote.id);
            } else {
              if (window.confirm(`Note "${title}" does not exist yet. Create it now in your vault?`)) {
                handleCreateNote(title);
              }
            }
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-md text-xs font-semibold transition border ${
            targetNote
              ? 'bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-[#3b82f6] border-[#3b82f6]/30'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-dashed border-amber-500/40'
          }`}
          title={targetNote ? `Jump to note: ${title}` : `Create unresolved note: ${title}`}
        >
          <Link2 className="w-3 h-3 shrink-0" />
          <span>{title}</span>
          {!targetNote && <span className="text-[10px] text-amber-300 font-mono">(new)</span>}
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < rawText.length) {
      parts.push(rawText.substring(lastIndex));
    }

    return parts;
  };

  // =========================================================================
  // INTERACTIVE FORCE-DIRECTED 2D KNOWLEDGE GRAPH SIMULATION (CANVAS)
  // =========================================================================
  useEffect(() => {
    if (viewMode !== 'graph') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.parentElement.clientWidth;
    let height = canvas.parentElement.clientHeight || 600;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initialize physical node positions
    const nodes = graphData.nodes.map((n, i) => {
      const angle = (i / graphData.nodes.length) * Math.PI * 2;
      const radius = 120 + Math.random() * 150;
      return {
        ...n,
        x: n.x || width / 2 + Math.cos(angle) * radius,
        y: n.y || height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: Math.max(7, Math.min(22, 9 + (n.degree || 1) * 2)) * physicsSettings.nodeSizeScale
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    simNodesRef.current = nodes;

    // Construct valid edges with node references
    const links = graphData.links.map(l => ({
      ...l,
      sourceNode: nodeMap.get(l.source),
      targetNode: nodeMap.get(l.target)
    })).filter(l => l.sourceNode && l.targetNode);

    let isRunning = true;

    // Simulation Step Function
    const stepPhysics = () => {
      // 1. Hard Collision Avoidance + Coulomb Repulsion (Obsidian Engine)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);

          // Hard collision constraint: nodes + labels never collapse or overlap
          const minDist = n1.radius + n2.radius + 75;
          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) * 0.5;
            const nx = (dx / dist) * overlap;
            const ny = (dy / dist) * overlap;
            if (draggedNode?.id !== n1.id) {
              n1.x -= nx;
              n1.y -= ny;
            }
            if (draggedNode?.id !== n2.id) {
              n2.x += nx;
              n2.y += ny;
            }
          }

          // Broad dispersion repulsion
          const force = (physicsSettings.repulsion / (distSq + 250));
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (draggedNode?.id !== n1.id) {
            n1.vx -= fx;
            n1.vy -= fy;
          }
          if (draggedNode?.id !== n2.id) {
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Hooke's Spring Attraction along edges with relaxed elasticity
      links.forEach(l => {
        const s = l.sourceNode;
        const t = l.targetNode;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - physicsSettings.linkDistance;
        const force = displacement * 0.02; // Soft spring prevents clumping

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (draggedNode?.id !== s.id) {
          s.vx += fx;
          s.vy += fy;
        }
        if (draggedNode?.id !== t.id) {
          t.vx -= fx;
          t.vy -= fy;
        }
      });

      // 3. Gentle Central Gravity (keeps graph centered without crushing nodes together)
      nodes.forEach(n => {
        if (draggedNode?.id === n.id) return;
        const dx = width / 2 - n.x;
        const dy = height / 2 - n.y;
        n.vx += dx * physicsSettings.gravity;
        n.vy += dy * physicsSettings.gravity;

        // Smooth damping
        n.vx *= 0.82;
        n.vy *= 0.82;

        n.x += n.vx;
        n.y += n.vy;
      });

      // Render Frame
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Apply Zoom & Pan Transform
      ctx.translate(graphPan.x, graphPan.y);
      ctx.translate(width / 2, height / 2);
      ctx.scale(graphZoom, graphZoom);
      ctx.translate(-width / 2, -height / 2);

      // Render Links
      const hasFocus = Boolean(hoveredNode || activeNoteId);
      links.forEach(l => {
        const isHovered = hoveredNode && (l.sourceNode.id === hoveredNode.id || l.targetNode.id === hoveredNode.id);
        const isActive = activeNoteId && (l.sourceNode.id === activeNoteId || l.targetNode.id === activeNoteId);
        const isConnected = isHovered || isActive;

        ctx.save();
        if (hasFocus && !isConnected) {
          ctx.globalAlpha = 0.12;
        }

        ctx.beginPath();
        ctx.moveTo(l.sourceNode.x, l.sourceNode.y);
        ctx.lineTo(l.targetNode.x, l.targetNode.y);

        if (isConnected) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2.5;
        } else if (l.type === 'explicit') {
          ctx.strokeStyle = theme === 'light' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.45)';
          ctx.lineWidth = 1.4;
        } else {
          ctx.strokeStyle = theme === 'light' ? 'rgba(156, 163, 175, 0.25)' : 'rgba(75, 85, 99, 0.3)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 3]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // Render Nodes
      nodes.forEach(n => {
        if (!physicsSettings.showUnresolved && n.isGhost) return;

        const isHovered = hoveredNode?.id === n.id;
        const isActive = activeNoteId === n.id;
        const isConnectedToHover = hoveredNode && links.some(l => 
          (l.sourceNode.id === hoveredNode.id && l.targetNode.id === n.id) ||
          (l.targetNode.id === hoveredNode.id && l.sourceNode.id === n.id)
        );
        const isConnectedToActive = activeNoteId && links.some(l => 
          (l.sourceNode.id === activeNoteId && l.targetNode.id === n.id) ||
          (l.targetNode.id === activeNoteId && l.sourceNode.id === n.id)
        );
        const isFocused = isHovered || isActive || isConnectedToHover || isConnectedToActive;

        ctx.save();
        if (hasFocus && !isFocused) {
          ctx.globalAlpha = 0.25;
        }

        // Node Glow Ring for Active/Hovered
        if (isHovered || isActive) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)';
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color || '#3b82f6';
        if (n.isGhost) {
          ctx.fillStyle = '#4b5563';
        }
        ctx.fill();

        // Node Border
        ctx.lineWidth = isActive ? 3 : (isHovered ? 2.5 : 1.5);
        ctx.strokeStyle = isActive ? '#ffffff' : (n.isGhost ? '#9ca3af' : 'rgba(255, 255, 255, 0.6)');
        if (n.isGhost) ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Scale-Adaptive Obsidian Node Labels & Annotations
        const shouldShowLabel = 
          isHovered || 
          isActive || 
          isConnectedToHover || 
          (physicsSettings.showLabels && (
            graphZoom >= 0.55 || 
            (graphZoom >= 0.35 && (n.degree > 0 || n.radius >= 11)) ||
            (graphZoom < 0.35 && (n.degree >= 2 || n.radius >= 14))
          ));

        if (shouldShowLabel) {
          // Counter-scale font so it stays perfectly legible across all zoom levels
          const baseScreenSize = (isActive || isHovered) ? 12.5 : 11;
          const canvasFontSize = baseScreenSize / graphZoom;
          const fontWeight = (isActive || isHovered) ? '600 ' : '500 ';
          ctx.font = fontWeight + canvasFontSize.toFixed(1) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Constant screen spacing below the node edge
          const labelY = n.y + n.radius + (9 / graphZoom);
          const rawLabel = n.label || n.title || 'Untitled';
          const labelText = (!isHovered && !isActive && graphZoom < 0.7 && rawLabel.length > 20) 
            ? rawLabel.slice(0, 18) + '..' 
            : rawLabel;

          // High-Contrast Text Halo (Obsidian-style outline to prevent edge collision)
          ctx.save();
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.lineWidth = Math.max(2.5, 4 / graphZoom);
          ctx.strokeStyle = theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(13, 17, 23, 0.95)';
          ctx.strokeText(labelText, n.x, labelY);

          // Text Fill
          ctx.fillStyle = (isActive || isHovered)
            ? (theme === 'light' ? '#2563eb' : '#60a5fa')
            : (n.isGhost ? '#9ca3af' : (theme === 'light' ? '#111827' : '#f3f4f6'));
          ctx.fillText(labelText, n.x, labelY);
          ctx.restore();

          // Sub-annotation Pill: Category & Link count when hovered, active, or zoomed close
          const showSubAnnotation = isHovered || isActive || (graphZoom >= 1.25 && (n.category || n.degree > 0));
          if (showSubAnnotation) {
            const annotationText = n.category 
              ? (n.degree > 0 ? n.category + ' • ' + n.degree + ' links' : n.category)
              : (n.degree > 0 ? n.degree + ' links' : (n.folder || 'Note'));

            const subCanvasFontSize = 9.5 / graphZoom;
            ctx.save();
            ctx.font = '500 ' + subCanvasFontSize.toFixed(1) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const subY = labelY + canvasFontSize + (4 / graphZoom);
            const textMetrics = ctx.measureText(annotationText);
            const pillPadX = 6 / graphZoom;
            const pillPadY = 2 / graphZoom;
            const pillWidth = textMetrics.width + (pillPadX * 2);
            const pillHeight = subCanvasFontSize + (pillPadY * 2);
            const pillX = n.x - (pillWidth / 2);
            const pillRadius = 4 / graphZoom;

            // Pill Background
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(pillX, subY - pillPadY, pillWidth, pillHeight, pillRadius);
            } else {
              ctx.rect(pillX, subY - pillPadY, pillWidth, pillHeight);
            }
            ctx.fillStyle = theme === 'light' ? 'rgba(241, 245, 249, 0.92)' : 'rgba(30, 41, 59, 0.92)';
            ctx.fill();
            ctx.lineWidth = 1 / graphZoom;
            ctx.strokeStyle = isHovered ? 'rgba(96, 165, 250, 0.6)' : (theme === 'light' ? 'rgba(203, 213, 225, 0.8)' : 'rgba(71, 85, 105, 0.8)');
            ctx.stroke();

            // Pill Text
            ctx.fillStyle = isHovered ? '#60a5fa' : (theme === 'light' ? '#475569' : '#94a3b8');
            ctx.fillText(annotationText, n.x, subY);
            ctx.restore();
          }
        }
        ctx.restore();
      });

      ctx.restore();

      if (isRunning) {
        animationFrameRef.current = requestAnimationFrame(stepPhysics);
      }
    };

    stepPhysics();

    const handleResize = () => {
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight || 600;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode, graphData, graphZoom, graphPan, draggedNode, hoveredNode, activeNoteId, physicsSettings, theme]);

  // Graph Canvas Mouse Interaction (Pan, Zoom, Drag Node)
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Transform mouse coordinate into simulation space
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const simX = (mouseX - graphPan.x - width / 2) / graphZoom + width / 2;
    const simY = (mouseY - graphPan.y - height / 2) / graphZoom + height / 2;

    // Check if clicked a node
    const candidateNodes = simNodesRef.current.length > 0 ? simNodesRef.current : graphData.nodes;
    const clicked = candidateNodes.find(n => {
      const dx = (n.x || 0) - simX;
      const dy = (n.y || 0) - simY;
      const r = Math.max(10, n.radius || 12);
      return dx * dx + dy * dy <= r * r;
    });

    if (clicked) {
      setDraggedNode(clicked);
      if (clicked.isGhost) {
        if (window.confirm('Create new note "' + clicked.title + '"?')) {
          handleCreateNote(clicked.title);
        }
      } else {
        selectNote(clicked.id);
        const c = canvasRef.current;
        if (c) {
          const w = c.width / window.devicePixelRatio;
          const h = c.height / window.devicePixelRatio;
          setGraphPan({
            x: (w / 2 - (clicked.x || w / 2)) * graphZoom,
            y: (h / 2 - (clicked.y || h / 2)) * graphZoom
          });
        }
      }
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - graphPan.x, y: e.clientY - graphPan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const simX = (mouseX - graphPan.x - width / 2) / graphZoom + width / 2;
    const simY = (mouseY - graphPan.y - height / 2) / graphZoom + height / 2;

    if (draggedNode) {
      draggedNode.x = simX;
      draggedNode.y = simY;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else if (isDraggingCanvas) {
      setGraphPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      // Hover detection
      const activeCandidates = simNodesRef.current.length > 0 ? simNodesRef.current : graphData.nodes;
      const hovered = activeCandidates.find(n => {
        const dx = (n.x || 0) - simX;
        const dy = (n.y || 0) - simY;
        const r = Math.max(12, n.radius || 12);
        return dx * dx + dy * dy <= r * r;
      });
      setHoveredNode(hovered || null);
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedNode(null);
    setIsDraggingCanvas(false);
  };

  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setGraphZoom(prev => Math.min(3.5, Math.max(0.3, prev * zoomFactor)));
  };

  const handleFocusNode = (searchTitle) => {
    const candidates = simNodesRef.current.length > 0 ? simNodesRef.current : (graphData.nodes || []);
    const target = candidates.find(n => (n.title || n.label || '').toLowerCase().includes(searchTitle.toLowerCase()));
    if (target && canvasRef.current) {
      const c = canvasRef.current;
      const w = c.width / window.devicePixelRatio;
      const h = c.height / window.devicePixelRatio;
      selectNote(target.id);
      setHoveredNode(target);
      const targetZoom = 1.45;
      setGraphZoom(targetZoom);
      setGraphPan({
        x: (w / 2 - (target.x || w / 2)) * targetZoom,
        y: (h / 2 - (target.y || h / 2)) * targetZoom
      });
    }
  };

  return (
    <div className="pt-16 sm:pt-20 min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] font-sans flex flex-col">
      {/* ========================================================= */}
      {/* OBSIDIAN TOP BAR & VIEW SWITCHER */}
      {/* ========================================================= */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-16 sm:top-20 z-30">
        {/* Left: Vault Title & Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono">
              <span>Obsidian Vault</span>
              <span>/</span>
              <span className="text-[var(--text-primary)] font-bold">{editFolder || 'Notes'}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold truncate max-w-[200px] sm:max-w-md">
              {activeNote ? activeNote.title : 'Knowledge Graph'}
            </h1>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('editor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'editor'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Notes Editor</span>
          </button>

          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'graph'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span>Knowledge Graph</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {graphData.nodes?.length || 0}
            </span>
          </button>
        </div>

        {/* Right: Actions (Save, Auto-Link, New Note) */}
        <div className="flex items-center gap-2">
          {viewMode === 'editor' && (
            <button
              onClick={handleSaveNote}
              disabled={saving}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Note'}</span>
            </button>
          )}

          <button
            onClick={handleAutoLinkVault}
            disabled={autoLinking}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            title="Automatically scan and bi-directionally link notes across the vault"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{autoLinking ? 'Linking...' : 'Auto-Connect Concepts'}</span>
          </button>

          {notes.length === 0 && (
            <button
              onClick={handleSeedVault}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              title="Load connected starter notes into your vault"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Load Starter Graph</span>
            </button>
          )}

          <button
            onClick={() => handleCreateNote('New Concept')}
            className="px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">New Note</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN VAULT BODY */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-120px)]">
        {/* ========================================== */}
        {/* LEFT SIDEBAR: OBSIDIAN FILE EXPLORER */}
        {/* ========================================== */}
        <aside className="w-72 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col shrink-0 hidden md:flex">
          {/* Vault Search */}
          <div className="p-3 border-b border-[var(--border-color)] space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, #tags, [[links]]..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Folder Filter Pill */}
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold px-1">
              <span>Vault Explorer</span>
              <span className="text-[11px] font-mono">{filteredVaultNotes.length} notes</span>
            </div>
          </div>

          {/* Folder & Notes Tree */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {Object.keys(folderTree).length === 0 && (
              <div className="p-4 text-center space-y-3 mt-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Vault is Empty</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Start by creating a note or load connected CS & AI concepts.
                  </p>
                </div>
                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={handleSeedVault}
                    className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Load Starter Graph</span>
                  </button>
                  <button
                    onClick={() => handleCreateNote('My First Note')}
                    className="w-full py-1.5 px-3 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Note</span>
                  </button>
                </div>
              </div>
            )}
            {Object.keys(folderTree).map(folderName => (
              <div key={folderName} className="mb-2">
                <button
                  onClick={() => setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }))}
                  className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {expandedFolders[folderName] ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                    <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{folderName}</span>
                  </div>
                  <span className="text-[10px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded-full font-mono">
                    {folderTree[folderName].length}
                  </span>
                </button>

                {expandedFolders[folderName] && (
                  <div className="ml-4 pl-2 border-l border-[var(--border-color)] mt-1 space-y-0.5">
                    {folderTree[folderName].map(note => (
                      <button
                        key={note.id}
                        onClick={() => selectNote(note.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between group ${
                          activeNoteId === note.id
                            ? 'bg-blue-600/15 text-blue-500 font-bold border border-blue-500/30'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: note.color || '#3b82f6' }}
                          />
                          <span className="truncate">{note.title}</span>
                        </div>
                        {note.degree > 0 && (
                          <span className="text-[10px] text-[var(--text-secondary)] group-hover:text-blue-400 font-mono">
                            {note.degree}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Vault Stats */}
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Network className="w-3.5 h-3.5 text-purple-400" />
              <span>{graphData.links?.length || 0} Bi-directional Links</span>
            </span>
            <button
              onClick={() => handleCreateNote('Quick Thought')}
              className="p-1 hover:bg-[var(--border-color)] rounded-md text-[var(--text-primary)]"
              title="Quick Add Note"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* CENTER VIEW: EITHER NOTE EDITOR OR FULL KNOWLEDGE GRAPH */}
        {/* ========================================================= */}
        {viewMode === 'editor' ? (
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[var(--bg-primary)]">
            {/* Note Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-[var(--border-color)]">
              {/* Note Header / Meta Bar */}
              <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note Title..."
                    className="text-xl sm:text-2xl font-bold bg-transparent border-none outline-none text-[var(--text-primary)] w-full sm:w-auto flex-1 focus:ring-0"
                  />

                  {/* Mode Toggles: Edit / Preview / Split */}
                  <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-0.5">
                    <button
                      onClick={() => setEditorTab('edit')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        editorTab === 'edit'
                          ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setEditorTab('preview')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        editorTab === 'preview'
                          ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => setEditorTab('split')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold hidden lg:flex items-center gap-1 ${
                        editorTab === 'split'
                          ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Split</span>
                    </button>
                  </div>
                </div>

                {/* Tags and Folder Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <input
                      type="text"
                      value={editFolder}
                      onChange={(e) => setEditFolder(e.target.value)}
                      placeholder="Folder"
                      className="bg-transparent border-none outline-none text-[var(--text-primary)] w-20 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      placeholder="Category"
                      className="bg-transparent border-none outline-none text-[var(--text-primary)] w-24 text-xs"
                    />
                  </div>

                  {/* Tag Chips */}
                  {editTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-mono"
                    >
                      #{tag}
                      <button
                        onClick={() => setEditTags(editTags.filter(t => t !== tag))}
                        className="hover:text-red-400 ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTagInput.trim()) {
                          e.preventDefault();
                          const clean = newTagInput.trim().replace(/^#/, '');
                          if (!editTags.includes(clean)) setEditTags([...editTags, clean]);
                          setNewTagInput('');
                        }
                      }}
                      placeholder="+ Add tag..."
                      className="bg-transparent border border-dashed border-[var(--border-color)] rounded-md px-2 py-0.5 text-xs text-[var(--text-primary)] outline-none w-20"
                    />
                  </div>
                </div>

                {/* Obsidian Markdown Toolbar */}
                {editorTab !== 'preview' && (
                  <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[var(--border-color)]/50 text-[var(--text-secondary)]">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-md hover:text-[var(--text-primary)] font-bold text-xs"
                      title="Bold (**text**)"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-md hover:text-[var(--text-primary)] italic text-xs"
                      title="Italic (*text*)"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('## ')}
                      className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-md hover:text-[var(--text-primary)] font-bold text-xs"
                      title="Heading 2 (## Title)"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('[[', ']]')}
                      className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-md text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center gap-0.5"
                      title="Insert [[WikiLink]]"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>[[ ]]</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('- [ ] ')}
                      className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-md hover:text-[var(--text-primary)] text-xs flex items-center gap-0.5"
                      title="Task list checkbox (- [ ])"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('```javascript\n', '\n```')}
                      className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-md hover:text-[var(--text-primary)] text-xs"
                      title="Code Block"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> [!NOTE]\n> ')}
                      className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-md hover:text-[var(--text-primary)] text-xs text-amber-400 font-mono"
                      title="Obsidian Callout (> [!NOTE])"
                    >
                      [!NOTE]
                    </button>
                  </div>
                )}
              </div>

              {/* Editor Workspace (Raw Editor vs Live Preview) */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* 1. Raw Markdown Textarea */}
                {(editorTab === 'edit' || editorTab === 'split') && (
                  <div className={`flex-1 flex flex-col p-4 overflow-y-auto relative ${editorTab === 'split' ? 'border-r border-[var(--border-color)]' : ''}`}>
                    <textarea
                      ref={textareaRef}
                      value={editContent}
                      onChange={handleContentChange}
                      placeholder="# Your Note Title&#10;&#10;Start typing in markdown... Type [[ to trigger link suggestions!"
                      className="w-full flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed text-[var(--text-primary)] focus:ring-0"
                    />

                    {/* [[WikiLink]] Autocomplete Intellisense Popup */}
                    {showLinkDropdown && (
                      <div className="absolute left-6 bottom-12 w-72 bg-[var(--bg-card)] border border-blue-500/50 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider px-2 py-0.5 flex items-center justify-between">
                          <span>Link to Note</span>
                          <span className="font-mono text-[9px]">type to filter</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                          {filteredDropdownNotes.length === 0 ? (
                            <div className="p-2 text-xs text-[var(--text-secondary)] italic">
                              No matching notes. Press enter to create a new placeholder!
                            </div>
                          ) : (
                            filteredDropdownNotes.map(n => (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => insertWikiLink(n.title)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-600/20 hover:text-blue-400 transition flex items-center justify-between"
                              >
                                <span className="font-semibold truncate">{n.title}</span>
                                <span className="text-[10px] text-[var(--text-secondary)] font-mono">{n.folder}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Rich Live Rendered Preview */}
                {(editorTab === 'preview' || editorTab === 'split') && (
                  <div className="flex-1 p-6 overflow-y-auto prose dark:prose-invert max-w-none text-sm leading-relaxed">
                    {/* Rendered content with interactive [[WikiLinks]] */}
                    <div className="whitespace-pre-wrap font-sans space-y-4">
                      {renderMarkdownWithWikiLinks(editContent)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT SIDEBAR: OBSIDIAN INSPECTOR & LOCAL GRAPH */}
            {/* ========================================================= */}
            <aside className="w-80 bg-[var(--bg-card)] flex flex-col shrink-0 overflow-y-auto p-4 space-y-6">
              {/* Local Graph Widget */}
              <div className="border border-[var(--border-color)] rounded-2xl p-3 bg-[var(--bg-secondary)] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Compass className="w-4 h-4" />
                    <span>Local Graph</span>
                  </div>
                  <button
                    onClick={() => setViewMode('graph')}
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Full Graph</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Mini Visual Graph Indicator */}
                <div className="h-32 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] relative flex items-center justify-center overflow-hidden">
                  {/* Center Node */}
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-lg z-10 animate-pulse">
                    {activeNote?.title ? activeNote.title.charAt(0) : 'N'}
                  </div>

                  {/* Radiating Neighbor Nodes */}
                  {backlinks.linkedMentions?.slice(0, 4).map((m, idx) => {
                    const angle = (idx / Math.min(4, backlinks.linkedMentions.length)) * Math.PI * 2;
                    const x = Math.cos(angle) * 45;
                    const y = Math.sin(angle) * 45;
                    return (
                      <React.Fragment key={m._id}>
                        <div
                          className="absolute w-12 h-0.5 bg-blue-500/40 origin-left"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: `rotate(${angle}rad)`
                          }}
                        />
                        <button
                          onClick={() => selectNote(m._id)}
                          className="absolute w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center shadow-md hover:scale-125 transition"
                          style={{
                            left: `calc(50% + ${x}px - 10px)`,
                            top: `calc(50% + ${y}px - 10px)`
                          }}
                          title={`Linked: ${m.title}`}
                        >
                          {m.title.charAt(0)}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] text-center">
                  {backlinks.linkedMentions?.length || 0} direct links in neighborhood
                </p>
              </div>

              {/* Linked Mentions (Backlinks) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <Link2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Linked Mentions</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/15 text-blue-400 font-mono px-2 py-0.5 rounded-full font-bold">
                    {backlinks.linkedMentions?.length || 0}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {backlinks.linkedMentions?.length === 0 ? (
                    <div className="text-xs text-[var(--text-secondary)] italic p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                      No notes currently link to this concept. Use [[{activeNote?.title || 'This Note'}]] elsewhere!
                    </div>
                  ) : (
                    backlinks.linkedMentions.map(mention => (
                      <div
                        key={mention._id}
                        onClick={() => selectNote(mention._id)}
                        className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-500 transition cursor-pointer text-xs group"
                      >
                        <div className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 flex items-center justify-between">
                          <span>{mention.title}</span>
                          <ArrowUpRight className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-blue-400" />
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2 italic">
                          "{mention.snippet}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Unlinked Mentions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unlinked Mentions</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 font-mono px-2 py-0.5 rounded-full font-bold">
                    {backlinks.unlinkedMentions?.length || 0}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {backlinks.unlinkedMentions?.length === 0 ? (
                    <div className="text-xs text-[var(--text-secondary)] italic p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                      No unlinked text mentions detected.
                    </div>
                  ) : (
                    backlinks.unlinkedMentions.map(mention => (
                      <div
                        key={mention._id}
                        className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs space-y-1.5"
                      >
                        <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
                          <span>{mention.title}</span>
                          <button
                            onClick={() => handleLinkUnlinkedMention(mention._id, mention.title)}
                            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <Link2 className="w-2.5 h-2.5" /> Link
                          </button>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                          "{mention.snippet}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Note Metadata Telemetry */}
              <div className="pt-4 border-t border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AlignLeft className="w-3 h-3" /> Words:
                  </span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {editContent.split(/\s+/).filter(Boolean).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Reading Time:
                  </span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    ~{Math.max(1, Math.ceil(editContent.split(/\s+/).filter(Boolean).length / 200))} min
                  </span>
                </div>
              </div>

              {/* Delete Note Button */}
              {activeNoteId && !activeNoteId.startsWith('ghost_') && (
                <div className="pt-2">
                  <button
                    onClick={() => handleDeleteNote(activeNoteId)}
                    className="w-full py-2 px-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Note</span>
                  </button>
                </div>
              )}
            </aside>
          </main>
        ) : (
          /* ========================================================= */
          /* FULLSCREEN INTERACTIVE KNOWLEDGE GRAPH (OBSIDIAN GRAPH) */
          /* ========================================================= */
          <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0d1117]">
            {/* Graph Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onWheel={handleCanvasWheel}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            />

            {/* Top Graph HUD Controls */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
              <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-2xl px-4 py-2 flex items-center gap-3 text-white shadow-xl">
                <Network className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold">{graphData.nodes?.length || 0} Nodes</span>
                <span className="text-gray-600">|</span>
                <span className="text-xs font-bold text-blue-400">{graphData.links?.length || 0} Edges</span>
              </div>

              {/* Category Quick Filter Chips */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-900/80 backdrop-blur-md p-1 rounded-xl border border-gray-800">
                <button
                  onClick={() => setSelectedCategoryFilter('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedCategoryFilter === '' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                {graphData.categories?.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      selectedCategoryFilter === cat ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColors[cat] || '#8b5cf6' }}
                    />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              {/* Obsidian Quick Focus Topic Pills */}
              <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-md p-1 rounded-xl border border-gray-800 text-xs">
                <span className="text-gray-500 font-mono text-[10px] px-1.5 uppercase">Focus:</span>
                <button
                  onClick={() => handleFocusNode('Data Structures')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Data Structures
                </button>
                <button
                  onClick={() => handleFocusNode('System Design')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  System Design
                </button>
              </div>
            </div>

            {/* Obsidian Node Annotation Inspector HUD (Bottom-Left) */}
            {(hoveredNode || activeNote) && (
              <div className="absolute bottom-6 left-6 z-20 max-w-xs sm:max-w-sm bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-2xl text-white transition-all animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: (hoveredNode || activeNote).color || '#3b82f6' }}
                    />
                    <h4 className="text-sm font-bold truncate">
                      {(hoveredNode || activeNote).title || (hoveredNode || activeNote).label}
                    </h4>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                    {(hoveredNode || activeNote).category || 'General'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 font-mono">
                  <span>{(hoveredNode || activeNote).folder || 'Notes'}</span>
                  <span>•</span>
                  <span className="text-blue-400">
                    {((hoveredNode || activeNote).degree || 0) + ' links'}
                  </span>
                  {Boolean((hoveredNode || activeNote).wordCount) && (
                    <>
                      <span>•</span>
                      <span>{((hoveredNode || activeNote).wordCount || 0) + ' words'}</span>
                    </>
                  )}
                </div>

                {Boolean((hoveredNode || activeNote).summary) && (
                  <p className="text-xs text-gray-300 line-clamp-2 mb-2 leading-relaxed">
                    {(hoveredNode || activeNote).summary}
                  </p>
                )}

                {Boolean((hoveredNode || activeNote).tags && (hoveredNode || activeNote).tags.length > 0) && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(hoveredNode || activeNote).tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                        {'#' + tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-800/60">
                  <span className="italic">
                    {hoveredNode ? (hoveredNode.isGhost ? 'Click node to create note' : 'Click node to open in editor') : 'Currently active note'}
                  </span>
                  <span className="font-mono text-gray-400">
                    {'Zoom: ' + Math.round(graphZoom * 100) + '%'}
                  </span>
                </div>
              </div>
            )}

            {/* Floating Zoom & Physics Control Pill */}
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 bg-gray-900/95 backdrop-blur-lg border border-gray-800 p-2 rounded-2xl shadow-2xl">
              <button
                onClick={() => setGraphZoom(z => Math.min(3.5, z * 1.2))}
                className="p-2 hover:bg-gray-800 text-gray-300 rounded-xl transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGraphZoom(z => Math.max(0.3, z * 0.8))}
                className="p-2 hover:bg-gray-800 text-gray-300 rounded-xl transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setGraphZoom(1);
                  setGraphPan({ x: 0, y: 0 });
                }}
                className="p-2 hover:bg-gray-800 text-gray-300 rounded-xl transition"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className={`p-2 rounded-xl transition ${
                  showSettingsDrawer ? 'bg-purple-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                }`}
                title="Physics & Display Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

            {/* Physics Settings Drawer */}
            {showSettingsDrawer && (
              <div className="absolute bottom-20 right-6 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-2xl z-30 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Graph Physics & Filter</h3>
                  <button onClick={() => setShowSettingsDrawer(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Node Repulsion</span>
                      <span className="font-mono">{physicsSettings.repulsion}</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="4000"
                      step="100"
                      value={physicsSettings.repulsion}
                      onChange={(e) => setPhysicsSettings({ ...physicsSettings, repulsion: Number(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Link Distance</span>
                      <span className="font-mono">{physicsSettings.linkDistance}px</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="250"
                      step="10"
                      value={physicsSettings.linkDistance}
                      onChange={(e) => setPhysicsSettings({ ...physicsSettings, linkDistance: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-800 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={physicsSettings.showLabels}
                        onChange={(e) => setPhysicsSettings({ ...physicsSettings, showLabels: e.target.checked })}
                        className="rounded accent-purple-500"
                      />
                      <span>Always Show Node Labels</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={physicsSettings.showUnresolved}
                        onChange={(e) => setPhysicsSettings({ ...physicsSettings, showUnresolved: e.target.checked })}
                        className="rounded accent-purple-500"
                      />
                      <span>Show Unresolved / Ghost Nodes</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Hovered Node Tooltip Card */}
            {hoveredNode && (
              <div className="absolute top-20 left-6 max-w-xs bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-2xl z-30 text-white space-y-2 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: hoveredNode.color || '#3b82f6' }}
                  />
                  <h4 className="font-bold text-sm truncate">{hoveredNode.title || hoveredNode.label}</h4>
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-2">
                  <span className="font-mono text-purple-400">{hoveredNode.category}</span>
                  <span>•</span>
                  <span>{hoveredNode.folder}</span>
                </div>
                <p className="text-xs text-gray-300 line-clamp-3">
                  {hoveredNode.summary || 'Click node to view full note.'}
                </p>
                <div className="text-[10px] text-blue-400 font-bold">Click node to open in editor &rarr;</div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
