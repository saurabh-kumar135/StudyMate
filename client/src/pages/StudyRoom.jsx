import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../config/api';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Timer, Copy, Check, Users,
  Play, Pause, RotateCcw, Sparkles, BookOpen, ShieldCheck,
  Send, X
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
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [timerOpen, setTimerOpen] = useState(true);
  const [timerState, setTimerState] = useState({ timeLeft: 25 * 60, isRunning: false, mode: 'study' });

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const chatBottomRef = useRef(null);
  const iceServersRef = useRef([{ urls: 'stun:stun.l.google.com:19302' }]);

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

  // Helper: Create synthetic stream if no physical camera exists
  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      return stream;
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
        ctx.fillText('🎓 StudyMate Live Room', 320, 200);
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

      // Create silent audio track using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const dst = osc.connect(audioCtx.createMediaStreamDestination());
        osc.start();
        const silentAudioTrack = dst.stream.getAudioTracks()[0];
        silentAudioTrack.enabled = false;
        canvasStream.addTrack(silentAudioTrack);
      } catch (audioErr) {
        console.warn('Silent audio creation skipped:', audioErr);
      }
      return canvasStream;
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
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('signal-answer', { to: from, answer });
    });

    socket.on('signal-answer', async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('signal-ice-candidate', async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    });

    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
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
      console.log('🎬 Received remote video/audio track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
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

    // If caller, create and send SDP offer
    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socketRef.current.emit('signal-offer', {
          to: targetSocketId,
          offer
        });
      });
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
                  <Video className="w-5 h-5" /> Start Study Room
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

        {/* Live In-Call Chat Drawer */}
        {chatOpen && (
          <aside className="w-80 md:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col z-20 shadow-2xl">
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <MessageSquare className="w-4 h-4 text-blue-400" /> Study Room Chat
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
          </aside>
        )}
      </div>

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

          {/* Toggle Chat */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={'p-3.5 rounded-2xl transition-all shadow-lg ' + (chatOpen ? 'bg-indigo-600 text-white border border-indigo-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700')}
            title="Toggle In-Call Chat"
          >
            <MessageSquare className="w-5 h-5" />
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
