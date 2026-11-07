import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mic, MicOff, Video, VideoOff, SkipForward, Square, Send,
  Users, Settings, X, Headphones, Volume2, VolumeX, RefreshCw, MessageSquare,
  Sparkles, AlertCircle, CheckCircle, Shield, Radio, Camera, Volume1,
  MessageCircle
} from 'lucide-react';

const WS_URL =
  import.meta.env.VITE_OMI_WS ||
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/omi-ws`;

const buildIceServers = () => {
  const servers = [{ urls: 'stun:stun.l.google.com:19302' }];
  const turn = import.meta.env.VITE_TURN_URL;
  if (turn) {
    servers.push({
      urls: turn,
      username: import.meta.env.VITE_TURN_USER || 'omi',
      credential: import.meta.env.VITE_TURN_PASS || 'omipass',
    });
  }
  return servers;
};

// Play pleasant synthesized harmonic chimes
const playChime = (type = 'match') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'match') {
      [587.33, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.3);
      });
      setTimeout(() => ctx.close().catch(() => {}), 600);
    } else if (type === 'test') {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.14);
        gain.gain.setValueAtTime(0, now + i * 0.14);
        gain.gain.linearRampToValueAtTime(0.22, now + i * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.35);
      });
      setTimeout(() => ctx.close().catch(() => {}), 900);
    } else if (type === 'leave') {
      [440, 349.23].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.22);
      });
      setTimeout(() => ctx.close().catch(() => {}), 500);
    }
  } catch {
    // ignore
  }
};

const Omi = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | searching | connected
  const [online, setOnline] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  // UI Organization & Display States
  const [showChat, setShowChat] = useState(true); // desktop toggleable chat
  const [showMobileChat, setShowMobileChat] = useState(false); // mobile drawer
  const [unreadCount, setUnreadCount] = useState(0);

  // Settings & Devices
  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState({ mics: [], cams: [], speakers: [] });
  const [sel, setSel] = useState({ mic: '', cam: '', speaker: '' });
  const [volume, setVolume] = useState(100);
  const [micLevel, setMicLevel] = useState(0);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [facingMode, setFacingMode] = useState('user');

  const canPickSpeaker = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
  const isInsecureContext = typeof window !== 'undefined' && (
    window.isSecureContext === false &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.endsWith('.localhost')
  );

  // Refs
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const previewVideo = useRef(null);
  const chatEnd = useRef(null);
  const statusRef = useRef('idle');

  const setSt = (s) => {
    statusRef.current = s;
    setStatus(s);
  };

  const closePeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
  }, []);

  const send = (obj) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  };

  const createPeer = useCallback(() => {
    closePeer();
    const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
    streamRef.current?.getTracks().forEach((t) => pc.addTrack(t, streamRef.current));
    pc.ontrack = (e) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = e.streams[0];
        remoteVideo.current.volume = volume / 100;
      }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) send({ type: 'signal', data: { candidate: e.candidate } });
    };
    pcRef.current = pc;
    return pc;
  }, [closePeer, volume]);

  const handleSignal = useCallback(async (data) => {
    const pc = pcRef.current || createPeer();
    try {
      if (data.sdp) {
        await pc.setRemoteDescription(data.sdp);
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ type: 'signal', data: { sdp: pc.localDescription } });
        }
      } else if (data.candidate) {
        await pc.addIceCandidate(data.candidate);
      }
    } catch (err) {
      console.warn('signal error', err);
    }
  }, [createPeer]);

  const connectWs = useCallback(() => new Promise((resolve, reject) => {
    if (wsRef.current && wsRef.current.readyState === 1) return resolve();
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error('เชื่อมต่อเซิร์ฟเวอร์ Omi ไม่ได้ กรุณาลองใหม่อีกครั้ง'));
    ws.onclose = () => {
      if (statusRef.current !== 'idle') {
        closePeer();
        setSt('idle');
      }
    };
    ws.onmessage = async (ev) => {
      const m = JSON.parse(ev.data);
      if (m.type === 'online') {
        setOnline(m.count);
      } else if (m.type === 'waiting') {
        setSt('searching');
      } else if (m.type === 'matched') {
        playChime('match');
        setMessages([{ sys: true, text: '🎉 เชื่อมต่อกับคนแปลกหน้าแล้ว ทักทายกันได้เลย!' }]);
        setSt('connected');
        const pc = createPeer();
        if (m.initiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send({ type: 'signal', data: { sdp: pc.localDescription } });
        }
      } else if (m.type === 'signal') {
        handleSignal(m.data);
      } else if (m.type === 'chat') {
        setMessages((p) => [...p, { them: true, text: m.text }]);
        if (!showChat && !showMobileChat) setUnreadCount((c) => c + 1);
      } else if (m.type === 'partner-left') {
        playChime('leave');
        closePeer();
        setMessages((p) => [...p, { sys: true, text: '👋 คู่สนทนาออกไปแล้ว กำลังสุ่มคนใหม่...' }]);
        setSt('searching');
        send({ type: 'find' });
      }
    };
  }), [closePeer, createPeer, handleSignal, showChat, showMobileChat]);

  // Safe WebRTC getUserMedia wrapper with Insecure Context & Mobile In-App browser detection
  const safeGetUserMedia = useCallback(async (constraints) => {
    // 1. Check if insecure context (HTTP on mobile/network IP)
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.localhost')
    );
    const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || isLocalhost);

    if (!isSecure) {
      throw new Error('เบราว์เซอร์บล็อกการเปิดกล้องผ่าน HTTP (ต้องเข้าผ่าน HTTPS หรือ http://localhost เท่านั้น)');
    }

    // 2. Standard navigator.mediaDevices.getUserMedia
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      return await navigator.mediaDevices.getUserMedia(constraints);
    }

    // 3. Fallback for legacy webkit / moz / ms
    const legacyGUM = typeof navigator !== 'undefined' && (
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
    if (legacyGUM) {
      return new Promise((resolve, reject) => {
        legacyGUM.call(navigator, constraints, resolve, reject);
      });
    }

    // 4. In-app browser detection (LINE, Facebook, etc.)
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    if (/Line|FBAN|FBAV|Instagram|Messenger/i.test(ua)) {
      throw new Error('แอป LINE/Facebook ไม่อนุญาตให้เปิดกล้อง กรุณากดปุ่ม 3 จุดที่มุมจอ แล้วเลือก "เปิดด้วย Safari หรือ Chrome"');
    }

    throw new Error('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องหรือไม่มีอุปกรณ์กล้อง/ไมโครโฟน (กรุณาอนุญาตสิทธิ์กล้องในเบราว์เซอร์)');
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return;
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        mics: list.filter((d) => d.kind === 'audioinput'),
        cams: list.filter((d) => d.kind === 'videoinput'),
        speakers: list.filter((d) => d.kind === 'audiooutput'),
      });
      const s = streamRef.current;
      if (s) {
        setSel((p) => ({
          ...p,
          mic: s.getAudioTracks()[0]?.getSettings().deviceId || p.mic,
          cam: s.getVideoTracks()[0]?.getSettings().deviceId || p.cam,
        }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const ensureStream = async () => {
    if (!streamRef.current) {
      streamRef.current = await safeGetUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      if (localVideo.current) localVideo.current.srcObject = streamRef.current;
      if (previewVideo.current) previewVideo.current.srcObject = streamRef.current;
    }
    await refreshDevices();
  };

  const openSettings = () => {
    setError('');
    setShowSettings(true);
    refreshDevices();
    // Non-blocking stream activation so camera preview and mic meter can start if permissions allowed
    if (!streamRef.current) {
      safeGetUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
        .then((s) => {
          streamRef.current = s;
          if (localVideo.current) localVideo.current.srcObject = s;
          if (previewVideo.current) previewVideo.current.srcObject = s;
          refreshDevices();
        })
        .catch(() => {
          // If not permitted yet, popup stays open and user can still test headphones, select output, adjust volume!
        });
    }
  };

  const swapTrack = async (kind, deviceId) => {
    try {
      const ns = await safeGetUserMedia(
        kind === 'audio'
          ? { audio: { deviceId: { exact: deviceId } } }
          : { video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } }
      );
      const nt = ns.getTracks()[0];
      const s = streamRef.current;
      const old = kind === 'audio' ? s.getAudioTracks()[0] : s.getVideoTracks()[0];
      nt.enabled = old ? old.enabled : true;
      if (old) {
        s.removeTrack(old);
        old.stop();
      }
      s.addTrack(nt);
      const sender = pcRef.current?.getSenders().find((x) => x.track && x.track.kind === kind);
      if (sender) await sender.replaceTrack(nt);
      if (kind === 'video') {
        if (localVideo.current) localVideo.current.srcObject = s;
        if (previewVideo.current) previewVideo.current.srcObject = s;
      }
      setSel((p) => ({ ...p, [kind === 'audio' ? 'mic' : 'cam']: deviceId }));
    } catch (e) {
      setError(e.message || 'เปลี่ยนอุปกรณ์ไม่สำเร็จ');
    }
  };

  const changeSpeaker = async (deviceId) => {
    try {
      if (remoteVideo.current?.setSinkId) await remoteVideo.current.setSinkId(deviceId);
      setSel((p) => ({ ...p, speaker: deviceId }));
    } catch (e) {
      setError(e.message || 'เปลี่ยนลำโพง/หูฟังไม่สำเร็จ');
    }
  };

  const flipCameraMobile = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    try {
      const ns = await safeGetUserMedia({
        video: { facingMode: { ideal: nextMode } },
        audio: false
      });
      const nt = ns.getVideoTracks()[0];
      const s = streamRef.current;
      if (s) {
        const old = s.getVideoTracks()[0];
        if (old) {
          s.removeTrack(old);
          old.stop();
        }
        s.addTrack(nt);
        const sender = pcRef.current?.getSenders().find((x) => x.track && x.track.kind === 'video');
        if (sender) await sender.replaceTrack(nt);
        if (localVideo.current) localVideo.current.srcObject = s;
      }
    } catch (e) {
      setError(e.message || 'ไม่สามารถสลับกล้องได้');
    }
  };

  const handleTestHeadphones = () => {
    setIsTestingAudio(true);
    playChime('test');
    setTimeout(() => setIsTestingAudio(false), 900);
  };

  // Live microphone level visualizer in Settings
  useEffect(() => {
    if (!showSettings || !streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;

    let animId;
    let audioCtx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const level = Math.min(100, Math.round((avg / 110) * 100));
        setMicLevel(level);
        animId = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err) {
      console.warn('Audio meter err', err);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, [showSettings]);

  useEffect(() => {
    if (showSettings && previewVideo.current && streamRef.current) {
      previewVideo.current.srcObject = streamRef.current;
    }
  }, [showSettings]);

  useEffect(() => {
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
    if (!md?.addEventListener) return undefined;
    md.addEventListener('devicechange', refreshDevices);
    return () => md.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  const start = async () => {
    setError('');
    try {
      await ensureStream();
      await connectWs();
      setSt('searching');
      setMessages([]);
      send({ type: 'find' });
    } catch (e) {
      setError(e.message || 'ไม่สามารถเปิดกล้อง/ไมค์ได้ (กรุณาอนุญาตสิทธิ์ในเบราว์เซอร์)');
    }
  };

  const next = () => {
    closePeer();
    setMessages([]);
    setSt('searching');
    send({ type: 'find' });
  };

  const stop = () => {
    send({ type: 'leave' });
    closePeer();
    setSt('idle');
    setMessages([]);
  };

  const toggle = (kind) => {
    const tracks = kind === 'audio' ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks();
    tracks?.forEach((t) => {
      t.enabled = !t.enabled;
    });
    if (kind === 'audio') setMicOn((v) => !v);
    else setCamOn((v) => !v);
  };

  const sendChat = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || statusRef.current !== 'connected') return;
    send({ type: 'chat', text });
    setMessages((p) => [...p, { me: true, text }]);
    setInput('');
  };

  const sendQuickReaction = (emoji) => {
    if (statusRef.current !== 'connected') return;
    send({ type: 'chat', text: emoji });
    setMessages((p) => [...p, { me: true, text: emoji }]);
  };

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    statusRef.current = 'idle';
    closePeer();
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [closePeer]);

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (remoteVideo.current) {
      remoteVideo.current.volume = newVol / 100;
    }
  };

  const actionsRef = useRef({ start, next, stop });
  actionsRef.current = { start, next, stop };

  // Keyboard navigation: Space/Enter = Start or Next, Esc = Stop
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when user is typing in chat input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (statusRef.current === 'idle') actionsRef.current.start();
        else if (statusRef.current === 'connected' || statusRef.current === 'searching') actionsRef.current.next();
      } else if (e.code === 'Escape') {
        if (statusRef.current !== 'idle') actionsRef.current.stop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="omi-page">
      {/* 1. Header Bar: Refined, balanced & elegant */}
      <header className="omi-top-header">
        <div className="header-left">
          <button className="back-link-btn" onClick={() => navigate('/games')}>
            <ArrowLeft size={17} />
            <span>กลับรวมเกม</span>
          </button>
          <div className="header-divider" />
          <div className="brand-pill">
            <span className="brand-name">Omi</span>
            <span className="live-pill">LIVE</span>
            <span className="brand-tag">Dek SA</span>
          </div>
        </div>

        <div className="header-center">
          <div className={`status-capsule ${status}`}>
            <span className="status-orb" />
            <span className="status-text">
              {status === 'connected' ? 'กำลังสนทนา (Live)' : status === 'searching' ? 'กำลังสุ่มค้นหาเพื่อน...' : 'พร้อมสุ่มจับคู่ 1 ต่อ 1'}
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="online-chip">
            <Users size={14} />
            <span>{online} ออนไลน์</span>
          </div>

          <button
            className={`header-tool-btn ${showChat ? 'active' : ''}`}
            onClick={() => {
              setShowChat(!showChat);
              setUnreadCount(0);
            }}
            title={showChat ? 'ซ่อนแชทเพื่อขยายจอ' : 'แสดงกล่องแชท'}
          >
            <MessageSquare size={16} />
            <span className="tool-btn-label">แชท</span>
            {unreadCount > 0 && <span className="header-unread-dot" />}
          </button>

          <button className="header-tool-btn" onClick={openSettings} title="ตั้งค่าไมค์ กล้อง หูฟัง">
            <Settings size={16} />
            <span className="tool-btn-label">ตั้งค่า</span>
          </button>
        </div>
      </header>
 
      {/* Insecure Context Warning for mobile over HTTP */}
      {isInsecureContext && (
        <div style={{
          background: 'linear-gradient(90deg, #991b1b, #dc2626)',
          color: '#ffffff',
          padding: '0.65rem 1.25rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.15)'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>แจ้งเตือน:</strong> เบราว์เซอร์บนมือถือ (iOS/Android) บล็อกการเปิดกล้องผ่าน HTTP ({typeof window !== 'undefined' ? window.location.hostname : ''}) กรุณาเปิดผ่าน <strong>HTTPS</strong> หรือเปิดผ่านคอมพิวเตอร์ที่ <code>http://localhost:5173/omi</code>
          </span>
        </div>
      )}

      {/* 2. Main Content Area: Proportional, Centered & Clean */}
      <main className={`omi-main-content ${showChat ? 'with-chat' : 'full-stage'}`}>
        <div className="omi-stage-wrapper">
          {/* Dual Video Grid: Perfectly Symmetrical 16:9 widescreen boxes */}
          <div className="omi-screen-duo">
            {/* Box 1: Remote Stranger Video */}
            <div className={`video-frame remote-frame ${status === 'connected' ? 'is-active' : ''}`}>
              <div className="frame-header-chip stranger-chip">
                <Radio size={13} className={status === 'connected' ? 'pulse-live' : ''} />
                <span>คู่สนทนา (Stranger)</span>
                {status === 'connected' && <span className="live-indicator-chip">CONNECTED</span>}
              </div>

              <video ref={remoteVideo} autoPlay playsInline />

              {/* Volume status pill */}
              {status === 'connected' && (
                <div className="frame-vol-chip">
                  {volume === 0 ? <VolumeX size={13} color="#f87171" /> : <Volume2 size={13} />}
                  <span>{volume}%</span>
                </div>
              )}

              {/* Overlays when not connected */}
              {status !== 'connected' && (
                <div className="frame-empty-curtain">
                  {status === 'searching' ? (
                    <div className="searching-card">
                      <div className="radar-spinner-wrap">
                        <div className="pulse-wave w1" />
                        <div className="pulse-wave w2" />
                        <div className="radar-core">
                          <Users size={26} color="#fff" />
                        </div>
                      </div>
                      <h3>กำลังค้นหาคู่สนทนา...</h3>
                      <p>ระบบกำลังจับคู่คนที่กำลังออนไลน์ให้คุณ</p>
                      <button className="cancel-search-btn" onClick={stop}>
                        <Square size={13} />
                        <span>ยกเลิกการค้นหา</span>
                      </button>
                    </div>
                  ) : (
                    <div className="idle-welcome-card">
                      <div className="idle-avatar-circle">
                        <Sparkles size={32} color="#4287f5" />
                      </div>
                      <h3>พร้อมเริ่มคุยกับคนใหม่หรือยัง?</h3>
                      <p>กดปุ่ม <strong>START</strong> เพื่อเริ่มสุ่มคุยวิดีโอกับเพื่อนใหม่แบบ 1 ต่อ 1</p>
                      <button type="button" className="idle-quick-start-btn" onClick={start}>
                        <Sparkles size={16} />
                        <span>เริ่มค้นหาเพื่อนคุยทันที</span>
                      </button>
                      <div className="safe-space-note">
                        <Shield size={13} color="#60a5fa" />
                        <span>พื้นที่สร้างสรรค์และปลอดภัยสำหรับชาว Dek SA</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Box 2: Local User Video */}
            <div className="video-frame local-frame">
              <div className="frame-header-chip you-chip">
                <span className="you-status-dot" />
                <span>ตัวคุณ (You)</span>
                {!micOn && <span className="warning-chip"><MicOff size={11} /> ไมค์ปิด</span>}
                {!camOn && <span className="warning-chip"><VideoOff size={11} /> กล้องปิด</span>}
              </div>

              <video ref={localVideo} autoPlay playsInline muted />

              {/* Perfectly Centered Placeholder when stream is off */}
              {!streamRef.current && (
                <div className="local-cam-placeholder">
                  <div className="cam-avatar-circle">
                    <Camera size={30} color="#94a3b8" />
                  </div>
                  <h4>กล้องของคุณจะแสดงที่นี่</h4>
                  <p>กดปุ่ม START เพื่อเริ่มเปิดกล้องใช้งาน</p>
                </div>
              )}

              {/* Mobile Flip Camera Action */}
              <button
                className="cam-flip-chip-btn"
                onClick={flipCameraMobile}
                title="สลับกล้องหน้า/กล้องหลัง"
                aria-label="สลับกล้อง"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Right Chat Sidebar (Clean, Organized & Toggleable) */}
        {showChat && (
          <aside className={`omi-chat-sidebar ${showMobileChat ? 'mobile-visible' : ''}`}>
            <div className="chat-sidebar-header">
              <div className="chat-heading">
                <MessageCircle size={17} color="#4287f5" />
                <span>ห้องแชทข้อความ</span>
              </div>
              <div className="chat-actions">
                {status === 'connected' && <span className="chat-live-badge">เชื่อมต่อแล้ว</span>}
                <button
                  className="chat-close-btn"
                  onClick={() => {
                    setShowChat(false);
                    setShowMobileChat(false);
                  }}
                  title="ปิดแชท"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="chat-messages-container">
              {messages.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="empty-bubble-icon">
                    <MessageSquare size={26} color="#64748b" />
                  </div>
                  <p>ข้อความแชทจะปรากฏที่นี่</p>
                  <span>เมื่อจับคู่สำเร็จ สามารถพิมพ์ทักทายหรือส่งอิโมจิได้ทันที</span>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.sys ? 'sys' : m.me ? 'me' : 'them'}`}>
                    {m.text}
                  </div>
                ))
              )}
              <div ref={chatEnd} />
            </div>

            {/* Quick Reactions Bar */}
            {status === 'connected' && (
              <div className="quick-emojis-bar">
                {['👋', '😄', '❤️', '🔥', '👏', '🐱'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="emoji-chip"
                    onClick={() => sendQuickReaction(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Bar */}
            <form className="chat-input-bar" onSubmit={sendChat}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder={status === 'connected' ? 'พิมพ์ข้อความแล้วกด Enter...' : 'รอเชื่อมต่อคู่สนทนา...'}
                disabled={status !== 'connected'}
              />
              <button
                type="submit"
                disabled={status !== 'connected' || !input.trim()}
                className="send-msg-btn"
                aria-label="ส่งข้อความ"
              >
                <Send size={15} />
              </button>
            </form>
          </aside>
        )}
      </main>

      {/* Error Notification Bar */}
      {error && (
        <div className="error-toast">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      {/* 4. Bottom Balanced Control Dock (Center Island) */}
      <footer className="omi-bottom-dock">
        <div className="dock-floating-island">
          {/* Main Action Group: START / NEXT / STOP */}
          <div className="dock-primary-group">
            {status === 'idle' ? (
              <button className="dock-btn-main btn-start" onClick={start}>
                <Sparkles size={18} />
                <span>START เริ่มคุย</span>
              </button>
            ) : (
              <>
                <button className="dock-btn-main btn-stop" onClick={stop} title="หยุดพัก (Esc)">
                  <Square size={15} fill="currentColor" />
                  <span>STOP พัก</span>
                </button>
                <button className="dock-btn-main btn-next" onClick={next} title="ข้ามไปคนถัดไป (Space/Enter)">
                  <span>NEXT ถัดไป</span>
                  <SkipForward size={17} />
                </button>
              </>
            )}
          </div>

          <div className="dock-separator" />

          {/* Media & Tool Controls Group */}
          <div className="dock-secondary-group">
            <button
              className={`dock-tool-btn ${!micOn ? 'is-muted' : ''}`}
              onClick={() => toggle('audio')}
              disabled={!streamRef.current}
              title={micOn ? 'ปิดไมค์' : 'เปิดไมค์'}
            >
              {micOn ? <Mic size={19} /> : <MicOff size={19} />}
              <span className="dock-btn-subtext">{micOn ? 'ไมค์' : 'ปิดอยู่'}</span>
            </button>

            <button
              className={`dock-tool-btn ${!camOn ? 'is-muted' : ''}`}
              onClick={() => toggle('video')}
              disabled={!streamRef.current}
              title={camOn ? 'ปิดกล้อง' : 'เปิดกล้อง'}
            >
              {camOn ? <Video size={19} /> : <VideoOff size={19} />}
              <span className="dock-btn-subtext">{camOn ? 'กล้อง' : 'ปิดอยู่'}</span>
            </button>

            {/* Mobile Chat Toggle Button */}
            <button
              className="dock-tool-btn mobile-only-chat-btn"
              onClick={() => {
                setShowMobileChat(!showMobileChat);
                setUnreadCount(0);
              }}
              title="เปิดแชท"
            >
              <MessageSquare size={19} />
              {unreadCount > 0 && <span className="mobile-unread-bubble">{unreadCount}</span>}
              <span className="dock-btn-subtext">แชท</span>
            </button>

            <button
              className="dock-tool-btn"
              onClick={openSettings}
              title="ตั้งค่าไมค์ กล้อง และหูฟัง"
            >
              <Settings size={19} />
              <span className="dock-btn-subtext">ตั้งค่า</span>
            </button>
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="keyboard-shortcuts-hint">
          <span>กด <strong>Space</strong> หรือ <strong>Enter</strong> เพื่อเปลี่ยนคนถัดไป • กด <strong>Esc</strong> เพื่อหยุดพัก</span>
        </div>
      </footer>

      {/* 5. Audio & Headphone Settings Modal */}
      {showSettings && (
        <div className="settings-backdrop" onClick={() => setShowSettings(false)}>
          <div className="settings-dialog" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="dialog-header">
              <div className="dialog-title-wrap">
                <div className="dialog-icon-badge">
                  <Settings size={20} color="#4287f5" />
                </div>
                <div>
                  <h3>ตั้งค่าอุปกรณ์และเสียง</h3>
                  <p>ปรับไมค์ หูฟัง/ลำโพง และตรวจสอบกล้องของคุณ</p>
                </div>
              </div>
              <button className="dialog-close-btn" onClick={() => setShowSettings(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="dialog-content">
              {/* Card 1: Microphone */}
              <div className="settings-card">
                <div className="card-heading">
                  <Mic size={16} color="#4287f5" />
                  <span>ไมโครโฟน (Microphone)</span>
                </div>
                <select
                  className="modern-select"
                  value={sel.mic}
                  onChange={(e) => swapTrack('audio', e.target.value)}
                >
                  {devices.mics.length === 0 && <option value="">ไมโครโฟนเริ่มต้น</option>}
                  {devices.mics.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `ไมโครโฟน ${i + 1}`}
                    </option>
                  ))}
                </select>

                {/* Live Mic Meter */}
                <div className="mic-live-meter-card">
                  <div className="meter-label-row">
                    <span>มาตรวัดเสียงไมค์สด (พูดเพื่อทดสอบ):</span>
                    <span className="meter-percentage">{micLevel}%</span>
                  </div>
                  <div className="meter-groove">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${micLevel}%`,
                        backgroundColor: micLevel > 75 ? '#ef4444' : micLevel > 35 ? '#4287f5' : '#10b981'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Headphones & Speaker */}
              <div className="settings-card">
                <div className="card-heading">
                  <Headphones size={16} color="#4287f5" />
                  <span>หูฟัง / ลำโพง (Headphones & Speaker)</span>
                </div>
                <select
                  className="modern-select"
                  value={sel.speaker}
                  onChange={(e) => changeSpeaker(e.target.value)}
                  disabled={!canPickSpeaker || devices.speakers.length === 0}
                >
                  {devices.speakers.length === 0 && <option value="">ลำโพง/หูฟังเริ่มต้นของระบบ</option>}
                  {devices.speakers.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `ลำโพง ${i + 1}`}
                    </option>
                  ))}
                </select>

                <div className="audio-tune-row">
                  <button
                    type="button"
                    className={`sound-test-btn ${isTestingAudio ? 'testing' : ''}`}
                    onClick={handleTestHeadphones}
                  >
                    <Volume2 size={16} />
                    <span>{isTestingAudio ? 'กำลังเล่นเสียง...' : 'กดทดสอบเสียงหูฟัง'}</span>
                  </button>

                  <div className="vol-slider-box">
                    <div className="vol-info">
                      <Volume1 size={14} />
                      <span>ระดับเสียงคู่สนทนา: {volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="styled-range-input"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Camera */}
              <div className="settings-card">
                <div className="card-heading">
                  <Video size={16} color="#4287f5" />
                  <span>กล้อง (Camera)</span>
                </div>
                <select
                  className="modern-select"
                  value={sel.cam}
                  onChange={(e) => swapTrack('video', e.target.value)}
                >
                  {devices.cams.length === 0 && <option value="">กล้องเริ่มต้น</option>}
                  {devices.cams.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `กล้อง ${i + 1}`}
                    </option>
                  ))}
                </select>

                <div className="camera-live-preview-box">
                  <video
                    ref={previewVideo}
                    autoPlay
                    playsInline
                    muted
                    style={{ display: streamRef.current ? 'block' : 'none' }}
                  />
                  {!streamRef.current && (
                    <div className="cam-preview-empty-state">
                      <Camera size={26} color="#64748b" />
                      <span>ยังไม่ได้เปิดสิทธิ์กล้อง</span>
                      <button
                        type="button"
                        className="cam-preview-activate-btn"
                        onClick={ensureStream}
                      >
                        กดอนุญาตและเปิดพรีวิว
                      </button>
                    </div>
                  )}
                  {streamRef.current && <span className="cam-preview-badge">พรีวิวกล้องสด</span>}
                </div>
              </div>
            </div>

            <div className="dialog-footer">
              <button className="dialog-save-btn" onClick={() => setShowSettings(false)}>
                <CheckCircle size={16} />
                <span>บันทึกและปิด</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Architecture */}
      <style>{`
        .omi-page {
          --bg: #090a0f;
          --panel: #12131a;
          --panel-soft: #171922;
          --border: rgba(255, 255, 255, 0.08);
          --accent: #4287f5;
          --accent-hover: #2b75eb;
          --accent-glow: rgba(66, 135, 245, 0.28);
          --text: #f8fafc;
          --muted: #94a3b8;
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          color: var(--text);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          user-select: none;
        }

        /* 1. Header Bar */
        .omi-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 28px;
          border-bottom: 1px solid var(--border);
          background: rgba(14, 15, 20, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 50;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .back-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 0.84rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .back-link-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.16);
        }

        .header-divider {
          width: 1px;
          height: 22px;
          background: var(--border);
        }

        .brand-pill {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-name {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .live-pill {
          background: #ef4444;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 5px;
          letter-spacing: 0.04em;
        }

        .brand-tag {
          font-size: 0.78rem;
          color: var(--muted);
        }

        .header-center {
          display: flex;
          align-items: center;
        }

        .status-capsule {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 0.8rem;
          color: var(--muted);
          transition: all 0.2s ease;
        }

        .status-capsule.connected {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.35);
          color: #34d399;
        }

        .status-capsule.searching {
          background: rgba(66, 135, 245, 0.1);
          border-color: rgba(66, 135, 245, 0.35);
          color: #60a5fa;
        }

        .status-orb {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #94a3b8;
        }

        .status-capsule.connected .status-orb {
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: orbPulse 1.8s infinite;
        }

        .status-capsule.searching .status-orb {
          background: #4287f5;
          box-shadow: 0 0 8px #4287f5;
          animation: orbPulse 1.2s infinite;
        }

        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .online-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          font-size: 0.8rem;
          color: var(--muted);
        }

        .header-tool-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 0.82rem;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
        }

        .header-tool-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .header-tool-btn.active {
          background: rgba(66, 135, 245, 0.12);
          border-color: rgba(66, 135, 245, 0.4);
          color: var(--accent);
        }

        .header-unread-dot {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 6px #ef4444;
        }

        /* 2. Main Content Area */
        .omi-main-content {
          flex: 1;
          display: grid;
          padding: 16px 28px;
          gap: 20px;
          max-width: 1720px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          min-height: 0;
          align-items: center;
        }

        .omi-main-content.with-chat {
          grid-template-columns: 1fr 340px;
        }

        .omi-main-content.full-stage {
          grid-template-columns: 1fr;
        }

        .omi-stage-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        .omi-screen-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          width: 100%;
          max-height: 580px;
          aspect-ratio: 16 / 9;
          min-height: 380px;
        }

        /* Video Frames */
        .video-frame {
          position: relative;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .video-frame.is-active {
          border-color: rgba(66, 135, 245, 0.45);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(66, 135, 245, 0.25);
        }

        .video-frame video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .local-frame video {
          transform: scaleX(-1);
        }

        /* Frame Header Chips */
        .frame-header-chip {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          background: rgba(14, 15, 22, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #fff;
          z-index: 10;
        }

        .pulse-live {
          color: #ef4444;
          animation: orbPulse 1.5s infinite;
        }

        .live-indicator-chip {
          background: #ef4444;
          color: #fff;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 4px;
        }

        .you-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .warning-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 1px 6px;
          border-radius: 5px;
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          font-size: 0.68rem;
        }

        .cam-flip-chip-btn {
          position: absolute;
          bottom: 14px;
          right: 14px;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(14, 15, 22, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: transform 0.15s ease;
        }

        .cam-flip-chip-btn:hover {
          transform: rotate(90deg);
        }

        .frame-vol-chip {
          position: absolute;
          bottom: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(14, 15, 22, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.72rem;
          color: var(--muted);
          z-index: 10;
        }

        /* Perfectly Centered Local Camera Placeholder */
        .local-cam-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: radial-gradient(circle at center, #161822 0%, #0d0e14 100%);
          color: var(--muted);
          z-index: 4;
          pointer-events: none;
          text-align: center;
          padding: 20px;
        }

        .cam-avatar-circle {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .local-cam-placeholder h4 {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }

        .local-cam-placeholder p {
          font-size: 0.82rem;
          color: var(--muted);
          margin: 0;
        }

        /* Stranger Frame Overlays */
        .frame-empty-curtain {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #161822 0%, #0d0e14 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          z-index: 5;
        }

        .idle-welcome-card {
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .idle-avatar-circle {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: rgba(66, 135, 245, 0.12);
          border: 1px solid rgba(66, 135, 245, 0.3);
          box-shadow: 0 8px 24px rgba(66, 135, 245, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .idle-welcome-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .idle-welcome-card p {
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.5;
          margin: 0;
        }

        .idle-quick-start-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 4px;
          box-shadow: 0 4px 16px var(--accent-glow);
          transition: all 0.15s ease;
        }

        .idle-quick-start-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 22px var(--accent-glow);
        }

        .safe-space-note {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          padding: 5px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.74rem;
          color: #94a3b8;
        }

        /* Radar Searching Animation */
        .searching-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .radar-spinner-wrap {
          position: relative;
          width: 86px;
          height: 86px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-wave {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid var(--accent);
          opacity: 0;
          animation: wavePulse 2s infinite ease-out;
        }

        .w2 {
          animation-delay: 1s;
        }

        @keyframes wavePulse {
          0% { transform: scale(0.35); opacity: 0.85; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .radar-core {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px var(--accent-glow);
          z-index: 2;
        }

        .searching-card h3 {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
        }

        .searching-card p {
          font-size: 0.84rem;
          color: var(--muted);
          margin: 0;
        }

        .cancel-search-btn {
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .cancel-search-btn:hover {
          background: rgba(239, 68, 68, 0.22);
        }

        /* 3. Right Chat Sidebar */
        .omi-chat-sidebar {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
          height: 100%;
          max-height: 580px;
        }

        .chat-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
        }

        .chat-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .chat-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chat-live-badge {
          font-size: 0.68rem;
          padding: 2px 7px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border-radius: 10px;
          font-weight: 500;
        }

        .chat-close-btn {
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-close-btn:hover {
          color: var(--text);
        }

        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
        }

        .chat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 10px;
          color: var(--muted);
          text-align: center;
          padding: 20px;
        }

        .empty-bubble-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-empty-state p {
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text);
          margin: 0;
        }

        .chat-empty-state span {
          font-size: 0.76rem;
          line-height: 1.4;
          opacity: 0.75;
        }

        .chat-bubble {
          max-width: 84%;
          padding: 9px 13px;
          border-radius: 14px;
          font-size: 0.86rem;
          line-height: 1.4;
          word-break: break-word;
        }

        .chat-bubble.me {
          align-self: flex-end;
          background: var(--accent);
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .chat-bubble.them {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.07);
          color: var(--text);
          border-bottom-left-radius: 4px;
        }

        .chat-bubble.sys {
          align-self: center;
          font-size: 0.74rem;
          color: var(--muted);
          background: rgba(255, 255, 255, 0.03);
          padding: 4px 10px;
          border-radius: 8px;
          text-align: center;
        }

        .quick-emojis-bar {
          display: flex;
          gap: 6px;
          padding: 8px 14px;
          border-top: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.015);
          overflow-x: auto;
        }

        .emoji-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 1.05rem;
          padding: 4px 8px;
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .emoji-chip:hover {
          transform: scale(1.2);
          background: rgba(255, 255, 255, 0.1);
        }

        .chat-input-bar {
          display: flex;
          gap: 8px;
          padding: 12px 14px;
          border-top: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
        }

        .chat-input-bar input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          color: #fff;
          font-size: 0.86rem;
          outline: none;
          transition: border-color 0.15s;
        }

        .chat-input-bar input:focus {
          border-color: var(--accent);
        }

        .send-msg-btn {
          width: 40px;
          border: none;
          border-radius: 10px;
          background: var(--accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .send-msg-btn:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .send-msg-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* Error Toast */
        .error-toast {
          margin: 0 auto 12px;
          max-width: 600px;
          width: calc(100% - 40px);
          padding: 10px 16px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.84rem;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .error-toast button {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #fca5a5;
          cursor: pointer;
        }

        /* 4. Bottom Dock: Center Island Design */
        .omi-bottom-dock {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 24px 18px;
          gap: 8px;
        }

        .dock-floating-island {
          display: inline-flex;
          align-items: center;
          background: rgba(18, 19, 26, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 8px 16px;
          gap: 14px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.04);
        }

        .dock-primary-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dock-btn-main {
          height: 46px;
          border-radius: 12px;
          font-size: 0.94rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          transition: all 0.15s ease;
        }

        .dock-btn-main.btn-start {
          background: var(--accent);
          color: #fff;
          padding: 0 36px;
          box-shadow: 0 4px 16px var(--accent-glow);
        }

        .dock-btn-main.btn-start:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--accent-glow);
        }

        .dock-btn-main.btn-next {
          background: var(--accent);
          color: #fff;
          padding: 0 24px;
          box-shadow: 0 4px 14px var(--accent-glow);
        }

        .dock-btn-main.btn-next:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
        }

        .dock-btn-main.btn-stop {
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          padding: 0 20px;
        }

        .dock-btn-main.btn-stop:hover {
          background: rgba(239, 68, 68, 0.24);
        }

        .dock-separator {
          width: 1px;
          height: 28px;
          background: var(--border);
        }

        .dock-secondary-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dock-tool-btn {
          min-width: 48px;
          height: 46px;
          padding: 0 10px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          color: var(--text);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
        }

        .dock-tool-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.09);
          transform: translateY(-1px);
        }

        .dock-tool-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .dock-tool-btn.is-muted {
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .dock-btn-subtext {
          font-size: 0.62rem;
          color: var(--muted);
        }

        .mobile-only-chat-btn {
          display: none;
        }

        .mobile-unread-bubble {
          position: absolute;
          top: -3px;
          right: -3px;
          background: #ef4444;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .keyboard-shortcuts-hint {
          font-size: 0.72rem;
          color: #64748b;
        }

        .keyboard-shortcuts-hint strong {
          color: #94a3b8;
          font-weight: 600;
        }

        /* 5. Settings Modal */
        .settings-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0, 0, 0, 0.76);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          animation: modalFadeIn 0.18s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .settings-dialog {
          width: 100%;
          max-width: 500px;
          background: #14151e;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 22px;
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(66, 135, 245, 0.2);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: modalPopUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center center;
        }

        @keyframes modalPopUp {
          0% { transform: scale(0.9) translateY(18px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        .dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
        }

        .dialog-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dialog-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: rgba(66, 135, 245, 0.12);
          border: 1px solid rgba(66, 135, 245, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dialog-title-wrap h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
        }

        .dialog-title-wrap p {
          margin: 2px 0 0;
          font-size: 0.76rem;
          color: var(--muted);
        }

        .dialog-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .dialog-content {
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .settings-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-heading {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.86rem;
          font-weight: 600;
          color: #e2e8f0;
        }

        .modern-select {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: #fff;
          padding: 0 12px;
          font-size: 0.86rem;
          outline: none;
          transition: border-color 0.15s;
        }

        .modern-select:focus {
          border-color: var(--accent);
        }

        .modern-select option {
          background: #13141b;
          color: #fff;
        }

        .modern-select:disabled {
          opacity: 0.5;
        }

        .mic-live-meter-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 9px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .meter-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.74rem;
          color: var(--muted);
        }

        .meter-percentage {
          font-weight: 600;
          color: var(--accent);
        }

        .meter-groove {
          width: 100%;
          height: 7px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 5px;
          overflow: hidden;
        }

        .meter-fill {
          height: 100%;
          width: 0%;
          border-radius: 5px;
          transition: width 0.08s ease-out;
        }

        .audio-tune-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: center;
        }

        .sound-test-btn {
          height: 42px;
          border-radius: 10px;
          background: rgba(66, 135, 245, 0.12);
          border: 1px solid rgba(66, 135, 245, 0.35);
          color: var(--accent);
          font-size: 0.82rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sound-test-btn:hover {
          background: rgba(66, 135, 245, 0.22);
        }

        .sound-test-btn.testing {
          background: var(--accent);
          color: #fff;
        }

        .vol-slider-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 7px 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .vol-info {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: var(--muted);
        }

        .styled-range-input {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.12);
          outline: none;
        }

        .styled-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 0 6px var(--accent-glow);
        }

        .camera-live-preview-box {
          width: 100%;
          height: 125px;
          background: #000;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          border: 1px solid var(--border);
        }

        .camera-live-preview-box video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .cam-preview-badge {
          position: absolute;
          bottom: 7px;
          left: 7px;
          background: rgba(0, 0, 0, 0.65);
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 0.68rem;
          color: #fff;
        }

        .cam-preview-empty-state {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #0f1017;
          color: var(--muted);
          font-size: 0.78rem;
        }

        .cam-preview-activate-btn {
          margin-top: 4px;
          padding: 5px 12px;
          background: rgba(66, 135, 245, 0.15);
          border: 1px solid rgba(66, 135, 245, 0.4);
          color: var(--accent);
          border-radius: 7px;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .cam-preview-activate-btn:hover {
          background: rgba(66, 135, 245, 0.25);
        }

        .dialog-footer {
          padding: 14px 22px;
          border-top: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          justify-content: flex-end;
        }

        .dialog-save-btn {
          height: 40px;
          padding: 0 22px;
          border-radius: 10px;
          background: var(--accent);
          border: none;
          color: #fff;
          font-weight: 600;
          font-size: 0.86rem;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        .dialog-save-btn:hover {
          background: var(--accent-hover);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .omi-main-content.with-chat {
            grid-template-columns: 1fr 300px;
          }
          .brand-tag {
            display: none;
          }
        }

        /* Mobile Screens */
        @media (max-width: 768px) {
          .omi-page {
            height: 100dvh;
            overflow: hidden;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }

          .omi-top-header {
            padding: 10px 14px;
          }

          .back-link-btn span {
            display: none;
          }

          .header-center {
            display: none;
          }

          .tool-btn-label {
            display: none;
          }

          .omi-main-content {
            grid-template-columns: 1fr !important;
            padding: 8px 12px;
            height: calc(100dvh - 145px);
          }

          .omi-screen-duo {
            grid-template-columns: 1fr;
            grid-template-rows: 1.15fr 1fr;
            aspect-ratio: auto;
            max-height: 100%;
            height: 100%;
            gap: 10px;
          }

          .video-frame {
            border-radius: 16px;
          }

          .idle-welcome-card h3 {
            font-size: 1.05rem;
          }

          .idle-welcome-card p {
            font-size: 0.78rem;
          }

          .mobile-only-chat-btn {
            display: flex;
          }

          .omi-chat-sidebar {
            position: fixed;
            inset: 0;
            z-index: 5000;
            border-radius: 0;
            max-height: 100dvh;
            transform: translateY(100%);
            transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .omi-chat-sidebar.mobile-visible {
            transform: translateY(0);
          }

          .omi-bottom-dock {
            padding: 6px 12px calc(8px + env(safe-area-inset-bottom, 0px));
          }

          .dock-floating-island {
            width: 100%;
            justify-content: space-between;
            padding: 8px 12px;
            border-radius: 16px;
          }

          .dock-btn-main {
            height: 42px;
            font-size: 0.88rem;
          }

          .dock-btn-main.btn-start {
            padding: 0 20px;
          }

          .dock-btn-main.btn-next {
            padding: 0 16px;
          }

          .dock-btn-main.btn-stop {
            padding: 0 14px;
          }

          .dock-tool-btn {
            min-width: 42px;
            height: 42px;
            padding: 0 6px;
          }

          .keyboard-shortcuts-hint {
            display: none;
          }

          .audio-tune-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Omi;
