import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../config/api';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Timer, Copy, Check, Users,
  Play, Pause, RotateCcw, Sparkles, BookOpen, ShieldCheck,
  Send, X, FileText, Download, Subtitles, Loader2, Award
} from 'lucide-react';

export default function StudyRoom() {
  const { roomId: routeRoomId } = useParams();
  const navigate = useNavigate();

  // Room state
  const [roomId, setRoomId] = useState(routeRoomId || '');
  const [inCall, setInCall] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('student');
  const [roomTopic, setRoomTopic] = useState('DSA & System Design');
  const [activeRooms, setActiveRooms] = useState([]);

  // Media states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerScreenSharing, setPeerScreenSharing] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState('Study Partner');
  const [copied, setCopied] = useState(false);

  // Chat & Timer
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' | 'transcript'
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatToast, setChatToast] = useState(null);
  const [timerOpen, setTimerOpen] = useState(true);
  const [timerState, setTimerState] = useState({ timeLeft: 25 * 60, isRunning: false, mode: 'study' });

  // Live Transcription & AI Notes
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [transcriptDrawerOpen, setTranscriptDrawerOpen] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState([]);
  const [currentCaption, setCurrentCaption] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const socketRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptBottomRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const chatBottomRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const iceServersRef = useRef([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' }
  ]);

  // Ensure video elements get streams attached upon mounting
  useEffect(() => {
    if (inCall && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch((e) => console.log('local play error:', e));
    }
    if (inCall && remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch((e) => console.log('remote play error:', e));
    }
  }, [inCall]);

  // Live Speech Recognition Engine (Web Speech API)
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (inCall && captionsEnabled) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              if (transcript.trim() && socketRef.current) {
                socketRef.current.emit('send-transcript-speech', {
                  roomId,
                  text: transcript.trim(),
                  isFinal: true
                });
              }
            } else {
              interimText += transcript;
            }
          }
          if (interimText.trim() && socketRef.current) {
            socketRef.current.emit('send-transcript-speech', {
              roomId,
              text: interimText.trim(),
              isFinal: false
            });
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition warning:', event.error);
        };

        recognition.onend = () => {
          if (inCall && captionsEnabled && recognitionRef.current) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, [inCall, captionsEnabled, roomId]);

  // Auto-dismiss floating live subtitle after 5 seconds of silence
  useEffect(() => {
    if (currentCaption) {
      const timer = setTimeout(() => {
        setCurrentCaption(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentCaption]);

  // Load user info from localStorage or defaults
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserName(parsed.firstName ? (parsed.firstName + ' ' + (parsed.lastName || '')).trim() : 'Student');
        setUserRole(parsed.userType || 'student');
      } catch (e) {
        setUserName('Student');
      }
    } else {
      setUserName('Student_' + Math.floor(1000 + Math.random() * 9000));
    }

    // Fetch active rooms & STUN config
    fetchRoomData();
  }, []);

  const fetchRoomData = async () => {
    try {
      const [roomsRes, configRes] = await Promise.allSettled([
        axios.get(API_URL + '/api/study-rooms/active'),
        axios.get(API_URL + '/api/study-rooms/config')
      ]);
      if (roomsRes.status === 'fulfilled' && roomsRes.value.data.success) {
        setActiveRooms(roomsRes.value.data.rooms || []);
      }
      if (configRes.status === 'fulfilled' && configRes.value.data.iceServers) {
        iceServersRef.current = configRes.value.data.iceServers;
      }
    } catch (err) {
      console.warn('Could not fetch room metadata:', err.message);
    }
  };

  // Process any ICE candidates that arrived before setRemoteDescription was completed
  const processQueuedCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription) return;
    while (iceCandidatesQueueRef.current.length > 0) {
      const cand = iceCandidatesQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn('Error adding queued ICE candidate:', err);
      }
    }
  };

  // Helper: Get user media with responsive fallbacks and echo cancellation
  const getMediaStream = async () => {
    const audioConfig = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: audioConfig
      });
    } catch (err1) {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: audioConfig });
      } catch (err2) {
        try {
          return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (err) {
          console.warn('Physical camera/mic unavailable. Generating synthetic media stream:', err.name);
          // Create animated canvas stream for headless/testing environments
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          let frame = 0;
          const draw = () => {
            frame++;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('StudyMate Live Room', 320, 200);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '20px sans-serif';
            ctx.fillText(userName || 'Student', 320, 240);
            ctx.beginPath();
            ctx.arc(320, 310, 40 + Math.sin(frame * 0.05) * 6, 0, Math.PI * 2);
            ctx.fillStyle = '#2563eb';
            ctx.fill();
            requestAnimationFrame(draw);
          };
          draw();
          const canvasStream = canvas.captureStream(30);

          // Create completely silent audio track using zero-gain node (no tone/oscillation)
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const dst = audioCtx.createMediaStreamDestination();
            const gain = audioCtx.createGain();
            gain.gain.value = 0;
            gain.connect(dst);
            const silentAudioTrack = dst.stream.getAudioTracks()[0];
            if (silentAudioTrack) {
              silentAudioTrack.enabled = false;
              canvasStream.addTrack(silentAudioTrack);
            }
          } catch (audioErr) {
            console.warn('Silent audio creation skipped:', audioErr);
          }
          return canvasStream;
        }
      }
    }
  };

  // Join Call
  const handleJoinCall = async (targetRoomId) => {
    const finalRoomId = (targetRoomId || roomId || '').trim();
    if (!finalRoomId) return;

    setRoomId(finalRoomId);
    const stream = await getMediaStream();
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Connect Socket.io signaling
    const socket = io(API_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to StudyMate signaling server:', socket.id);
      socket.emit('join-room', {
        roomId: finalRoomId,
        user: { name: userName, role: userRole }
      });
    });

    socket.on('room-joined', async ({ participants, timer }) => {
      if (timer) setTimerState(timer);
      if (participants && participants.length > 0) {
        const peer = participants[0];
        setRemoteUserName(peer.user?.name || 'Study Partner');
        // Initiate WebRTC offer as the joining caller
        initiatePeerConnection(peer.socketId, true);
      }
    });

    socket.on('user-joined', async ({ socketId, user }) => {
      console.log('Peer joined room:', user.name);
      setRemoteUserName(user.name);
      // Existing user creates peer connection to receive offer
      initiatePeerConnection(socketId, false);
    });

    socket.on('signal-offer', async ({ from, offer, user }) => {
      if (user) setRemoteUserName(user.name);
      const pc = peerConnectionRef.current || initiatePeerConnection(from, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processQueuedCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal-answer', { to: from, answer });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    socket.on('signal-answer', async ({ answer }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          await processQueuedCandidates(peerConnectionRef.current);
        } catch (err) {
          console.error('Error handling WebRTC answer:', err);
        }
      }
    });

    socket.on('signal-ice-candidate', async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate directly:', e);
        }
      } else {
        iceCandidatesQueueRef.current.push(candidate);
      }
    });

    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setUnreadChatCount(prev => prev + 1);
      setChatToast(msg);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setChatToast(null), 5000);
    });

    socket.on('transcript-entry', (entry) => {
      if (entry.isFinal) {
        setTranscriptEntries(prev => [...prev, entry]);
        setTimeout(() => transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      setCurrentCaption(entry);
    });

    socket.on('peer-media-toggled', ({ type, enabled }) => {
      console.log('Peer toggled ' + type + ':', enabled);
    });

    socket.on('peer-screen-sharing', ({ isSharing }) => {
      setPeerScreenSharing(isSharing);
    });

    socket.on('timer-updated', (newTimer) => {
      setTimerState(newTimer);
    });

    socket.on('user-left', ({ userName: leftUser }) => {
      setRemoteConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setChatMessages(prev => [...prev, {
        id: 'system_' + Date.now(),
        sender: 'System',
        message: (leftUser || 'Partner') + ' has left the study room.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    });

    setInCall(true);
  };

  // WebRTC Peer Connection Setup
  const initiatePeerConnection = (targetSocketId, isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });
    peerConnectionRef.current = pc;

    // Add local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote media track
    pc.ontrack = (event) => {
      console.log('Received remote video/audio track:', event.track.kind);
      if (event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch((e) => console.log('remote play error:', e));
        }
        setRemoteConnected(true);
      }
    };

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal-ice-candidate', {
          to: targetSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setRemoteConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteConnected(false);
      }
    };

    // If caller, create and send SDP offer with audio/video media descriptions
    if (isInitiator) {
      pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      .then(async (offer) => {
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('signal-offer', {
          to: targetSocketId,
          offer
        });
      })
      .catch((err) => console.error('Error creating SDP offer:', err));
    }

    return pc;
  };

  // Toggle Mute Audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
        socketRef.current?.emit('toggle-media-status', {
          roomId,
          type: 'audio',
          enabled: audioTrack.enabled
        });
      }
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        socketRef.current?.emit('toggle-media-status', {
          roomId,
          type: 'video',
          enabled: videoTrack.enabled
        });
      }
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in peer connection
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
        socketRef.current?.emit('screen-sharing-status', { roomId, isSharing: true });
      } catch (err) {
        console.warn('Screen share canceled or not supported:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (peerConnectionRef.current && cameraTrack) {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(cameraTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setIsScreenSharing(false);
    socketRef.current?.emit('screen-sharing-status', { roomId, isSharing: false });
  };

  // Leave Call
  const handleLeaveCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.emit('leave-room');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setInCall(false);
    setRemoteConnected(false);
    remoteStreamRef.current = null;
    iceCandidatesQueueRef.current = [];
    navigate('/study-room');
  };

  // Send Chat Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send-chat-message', {
      roomId,
      message: chatInput
    });
    setChatInput('');
  };

  // Summarize Transcript with Gemini AI
  const handleSummarizeSession = async () => {
    if (transcriptEntries.length === 0) {
      alert('No speech recorded yet. Turn on captions (CC) and speak into the call to generate a transcript first!');
      return;
    }
    setIsSummarizing(true);
    setSummaryModalOpen(true);
    try {
      const fullTranscript = transcriptEntries
        .map(e => '[' + e.timestamp + '] ' + e.speaker + ' (' + e.role + '): ' + e.text)
        .join('\n');

      const res = await axios.post(API_URL + '/api/study-rooms/summarize-transcript', {
        transcriptText: fullTranscript,
        topic: roomTopic
      });

      if (res.data && res.data.success && res.data.data) {
        setAiSummaryData(res.data.data);
      } else {
        alert(res.data.error || 'Failed to generate study summary.');
      }
    } catch (err) {
      console.error('Error generating AI study summary:', err);
      alert('Could not generate AI summary at this time.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Download Transcript as text file
  const handleDownloadTranscript = () => {
    if (transcriptEntries.length === 0) return;
    const header = 'StudyMate Virtual Study Session Transcript\n' +
      'Topic: ' + roomTopic + '\n' +
      'Room Code: ' + roomId + '\n' +
      'Date: ' + new Date().toLocaleString() + '\n' +
      '------------------------------------------------------------\n\n';
    const lines = transcriptEntries.map(e => '[' + e.timestamp + '] ' + e.speaker + ' (' + e.role + '):\n' + e.text + '\n');
    const content = header + lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'StudyMate_' + roomId + '_Transcript.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Timer controls
  const handleTimerAction = (action) => {
    socketRef.current?.emit('sync-study-timer', {
      roomId,
      action
    });
  };

  // Local timer decrement interval
  useEffect(() => {
    let interval = null;
    if (inCall && timerState.isRunning && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeLeft <= 1) {
            return { ...prev, timeLeft: 0, isRunning: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inCall, timerState.isRunning]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  const copyRoomLink = () => {
    const url = window.location.origin + '/study-room/' + roomId;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // RENDER: LOBBY SCREEN
  // ==========================================
  if (!inCall) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-4 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Peer-to-Peer Study Network
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Virtual Study Rooms
            </h1>
            <p className="mt-3 text-base text-slate-400 max-w-xl mx-auto">
              Real-time WebRTC audio/video calling, synchronized Pomodoro focus timer, and instant screen sharing between students and educators.
            </p>
          </div>

          {routeRoomId ? (
            /* Dedicated Direct-Join Card for Shared Links */
            <div className="max-w-md mx-auto bg-slate-900/90 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Join Study Room</h2>
                  <p className="text-xs text-purple-300 font-mono mt-0.5">Code: {routeRoomId}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="student">Student / Learner</option>
                    <option value="teacher">Teacher / Mentor</option>
                  </select>
                </div>

                <button
                  onClick={() => handleJoinCall(routeRoomId)}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 text-base"
                >
                  <Video className="w-5 h-5" /> Join Room Now
                </button>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Want to create a different room?</span>
                <button
                  onClick={() => navigate('/study-room')}
                  className="text-purple-400 hover:underline font-medium"
                >
                  Create New
                </button>
              </div>
            </div>
          ) : (
            /* Normal Dual-Card Lobby */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Create Room Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Create New Session</h2>
                    <p className="text-xs text-slate-400">Launch a private study call and invite your peers</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Role
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="student">Student / Learner</option>
                      <option value="teacher">Teacher / Mentor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Study Topic
                    </label>
                    <input
                      type="text"
                      value={roomTopic}
                      onChange={(e) => setRoomTopic(e.target.value)}
                      placeholder="e.g. Graph Algorithms, Machine Learning"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const newId = 'study_' + Math.random().toString(36).substr(2, 6);
                      handleJoinCall(newId);
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Video className="w-5 h-5" /> Start New Room
                  </button>
                </div>
              </div>

              {/* Join Existing Room Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Join by Room Code</h2>
                      <p className="text-xs text-slate-400">Enter a 6-digit code or link shared by your partner</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Room Code
                      </label>
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="e.g. study_9x2b3f"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono transition-colors"
                      />
                    </div>

                    <button
                      disabled={!roomId.trim()}
                      onClick={() => handleJoinCall(roomId)}
                      className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <BookOpen className="w-5 h-5 text-purple-400" /> Join Call
                    </button>
                  </div>
                </div>

                {/* Security info */}
                <div className="mt-8 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-200 font-medium">Direct Peer-to-Peer Encrypted</span>:
                    Media streams route directly between devices with zero intermediary recording.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 mt-12">
          StudyMate Real-Time Video Collaboration Platform · WebRTC & Socket.io
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ACTIVE VIDEO CALL SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden">
      {/* Top Bar: Room Info & Synchronized Timer */}
      <header className="h-16 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{roomTopic || 'Live Study Room'}</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {roomId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {remoteConnected ? 'Connected with ' + remoteUserName : 'Waiting for study partner...'}
            </p>
          </div>
        </div>

        {/* Synchronized Pomodoro Study Timer */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-full">
          <Timer className="w-4 h-4 text-blue-400" />
          <span className="font-mono font-bold text-sm tracking-wider text-blue-300">
            {formatTimer(timerState.timeLeft)}
          </span>
          <button
            onClick={() => handleTimerAction(timerState.isRunning ? 'pause' : 'start')}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-300 transition-colors"
          >
            {timerState.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleTimerAction('reset')}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={copyRoomLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Share Link'}
        </button>
      </header>

      {/* Main Video Stage & Chat Drawer */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Video Canvas Stage */}
        <main className="flex-1 p-4 flex flex-col items-center justify-center gap-4">
          <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
            {/* Remote Peer Stream */}
            <div className="relative w-full h-full min-h-[300px] max-h-[560px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!remoteConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
                    <Users className="w-8 h-8 text-slate-400 animate-pulse" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">Waiting for peer to connect</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Share your room code (<span className="text-blue-400 font-mono">{roomId}</span>) with your classmate or teacher to begin.
                  </p>
                  <button
                    onClick={copyRoomLink}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Invite Code
                  </button>
                </div>
              )}
              {remoteConnected && (
                <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-slate-300 border border-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  {remoteUserName}
                </div>
              )}
            </div>

            {/* Local User Stream */}
            <div className="relative w-full h-full min-h-[300px] max-h-[560px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                  <VideoOff className="w-12 h-12 text-slate-600 mb-2" />
                  <span className="text-xs font-medium">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-slate-300 border border-slate-800 flex items-center gap-2">
                <span className="text-blue-400 font-bold">{userName}</span> (You)
                {isAudioMuted && <MicOff className="w-3.5 h-3.5 text-red-400 ml-1" />}
              </div>
            </div>
          </div>
        </main>

        {/* Floating Closed Captions Overlay (Google Meet Style) */}
        {captionsEnabled && currentCaption && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 max-w-2xl px-5 py-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 shadow-2xl flex items-center gap-3 z-30 transition-all">
            <span className="text-xs font-bold text-blue-400 shrink-0">
              {currentCaption.speaker} ({currentCaption.role}):
            </span>
            <span className="text-sm text-white font-medium">
              "{currentCaption.text}"
            </span>
          </div>
        )}

        {/* Floating Chat Notification Toast */}
        {chatToast && (!chatOpen || sidebarTab !== 'chat') && (
          <div
            onClick={() => {
              setChatOpen(true);
              setSidebarTab('chat');
              setUnreadChatCount(0);
              setChatToast(null);
            }}
            className="absolute top-4 right-4 max-w-xs bg-slate-900/95 border border-indigo-500/60 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl cursor-pointer hover:border-indigo-400 z-40 transition-all animate-bounce"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-indigo-400">{chatToast.sender}</span>
              <span className="text-[10px] text-slate-500">{chatToast.timestamp}</span>
            </div>
            <p className="text-xs text-slate-200 line-clamp-2">{chatToast.message}</p>
          </div>
        )}

        {/* Right Collaboration Drawer (Chat + Live Transcript) */}
        {chatOpen && (
          <aside className="w-80 md:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col z-20 shadow-2xl">
            {/* Drawer Header with Dual Tabs */}
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSidebarTab('chat');
                    setUnreadChatCount(0);
                  }}
                  className={'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ' + (sidebarTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white')}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                  {unreadChatCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  )}
                </button>
                <button
                  onClick={() => setSidebarTab('transcript')}
                  className={'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ' + (sidebarTab === 'transcript' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white')}
                >
                  <FileText className="w-3.5 h-3.5" /> Transcript
                  {transcriptEntries.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-purple-900/80 rounded-full text-purple-200">
                      {transcriptEntries.length}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: In-Call Live Chat */}
            {sidebarTab === 'chat' && (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 py-12">
                      No messages yet. Ask questions or share reference notes here!
                    </div>
                  ) : (
                    chatMessages.map((m) => (
                      <div key={m.id} className="text-xs">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-bold text-blue-400">{m.sender}</span>
                          <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                        </div>
                        <div className="bg-slate-800/70 rounded-xl p-2.5 text-slate-200 leading-relaxed border border-slate-700/40">
                          {m.message}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* TAB 2: Live Conversation Transcript & AI Notes */}
            {sidebarTab === 'transcript' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Actions Toolbar */}
                <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
                  <button
                    onClick={handleSummarizeSession}
                    disabled={transcriptEntries.length === 0 || isSummarizing}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20"
                  >
                    {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    {isSummarizing ? 'Analyzing...' : 'AI Study Notes'}
                  </button>
                  <button
                    onClick={handleDownloadTranscript}
                    disabled={transcriptEntries.length === 0}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1"
                    title="Export transcript to file"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>

                {/* Transcript Stream Timeline */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {transcriptEntries.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 py-12">
                      <p className="mb-2 font-medium text-slate-400">No transcript recorded yet</p>
                      <p className="text-[11px] max-w-xs mx-auto">
                        Make sure Captions (<span className="text-purple-400 font-semibold">CC</span>) are turned on at the bottom. Spoken words will transcribe here in real time.
                      </p>
                    </div>
                  ) : (
                    transcriptEntries.map((t) => (
                      <div key={t.id} className="text-xs">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-bold text-purple-400">{t.speaker} <span className="text-[10px] text-slate-500 font-normal">({t.role})</span></span>
                          <span className="text-[10px] text-slate-500">{t.timestamp}</span>
                        </div>
                        <div className="bg-slate-800/40 rounded-xl p-2.5 text-slate-200 leading-relaxed border border-slate-700/30">
                          {t.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={transcriptBottomRef} />
                </div>

                {/* Live Speech Status Indicator */}
                <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className={'w-2 h-2 rounded-full ' + (captionsEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-600')}></span>
                    <span>{captionsEnabled ? 'Live speech listening...' : 'Captions paused (Click CC to enable)'}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* AI Summary Modal Dialog */}
      {summaryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-base font-bold text-white">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Study Notes & Lecture Digest
              </div>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm">
              {isSummarizing && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                  <p className="text-white font-semibold">Gemini is synthesizing your session notes...</p>
                  <p className="text-xs text-slate-400 mt-1">Analyzing speaker discussion, extracting key definitions, and drafting flashcards.</p>
                </div>
              )}

              {!isSummarizing && aiSummaryData && (
                <>
                  {/* Executive Summary */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                      Session Summary
                    </h3>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      {aiSummaryData.summary}
                    </p>
                  </div>

                  {/* Key Concepts */}
                  {aiSummaryData.keyConcepts && aiSummaryData.keyConcepts.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                        Key Concepts Covered
                      </h3>
                      <ul className="space-y-2">
                        {aiSummaryData.keyConcepts.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {aiSummaryData.actionItems && aiSummaryData.actionItems.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                        Action Items & Follow-Ups
                      </h3>
                      <ul className="space-y-2">
                        {aiSummaryData.actionItems.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                            <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Revision Flashcards */}
                  {aiSummaryData.flashcards && aiSummaryData.flashcards.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                        Quick Revision Flashcards
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {aiSummaryData.flashcards.map((f, i) => (
                          <div key={i} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                            <div className="font-semibold text-xs text-white mb-1">Q: {f.question}</div>
                            <div className="text-xs text-slate-400">A: {f.answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Close Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Dock */}
      <footer className="h-20 border-t border-slate-800/80 px-4 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          {/* Mute Mic */}
          <button
            onClick={toggleAudio}
            className={'p-3.5 rounded-2xl transition-all shadow-lg ' + (isAudioMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700')}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera On/Off */}
          <button
            onClick={toggleVideo}
            className={'p-3.5 rounded-2xl transition-all shadow-lg ' + (isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700')}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={'p-3.5 rounded-2xl transition-all shadow-lg ' + (isScreenSharing ? 'bg-blue-600 text-white border border-blue-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700')}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>

          {/* Toggle Closed Captions / Speech Recognition */}
          <button
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={'p-3.5 rounded-2xl transition-all shadow-lg ' + (captionsEnabled ? 'bg-purple-600 text-white border border-purple-400 ring-2 ring-purple-500/40' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700')}
            title={captionsEnabled ? 'Turn Off Closed Captions' : 'Turn On Live Speech Captions (CC)'}
          >
            <Subtitles className="w-5 h-5" />
          </button>

          {/* Toggle In-Call Chat */}
          <button
            onClick={() => {
              if (chatOpen && sidebarTab === 'chat') {
                setChatOpen(false);
              } else {
                setChatOpen(true);
                setSidebarTab('chat');
                setUnreadChatCount(0);
              }
            }}
            className={'relative p-3.5 rounded-2xl transition-all shadow-lg ' + (chatOpen && sidebarTab === 'chat' ? 'bg-blue-600 text-white border border-blue-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700')}
            title="Toggle In-Call Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Toggle Live Transcript Drawer */}
          <button
            onClick={() => {
              if (chatOpen && sidebarTab === 'transcript') {
                setChatOpen(false);
              } else {
                setChatOpen(true);
                setSidebarTab('transcript');
              }
            }}
            className={'p-3.5 rounded-2xl transition-all shadow-lg ' + (chatOpen && sidebarTab === 'transcript' ? 'bg-purple-600 text-white border border-purple-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700')}
            title="Open Live Conversation Transcript & AI Notes"
          >
            <FileText className="w-5 h-5" />
          </button>

          {/* Leave Call */}
          <button
            onClick={handleLeaveCall}
            className="px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
          >
            <PhoneOff className="w-5 h-5" /> End Call
          </button>
        </div>
      </footer>
    </div>
  );
}
