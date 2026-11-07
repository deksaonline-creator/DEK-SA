import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../store/mockDb';
import { Trophy, X, RotateCcw, Sparkles, Monitor, Save, Home } from 'lucide-react';

export default function Popcat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [localScore, setLocalScore] = useState(0); // Score calculated in current session
  const [globalScore, setGlobalScore] = useState(0); // Total score from database
  const [leaderboard, setLeaderboard] = useState([]);
  const [user, setUser] = useState(null);
  const [defaultImg, setDefaultImg] = useState('');
  const [poppingImg, setPoppingImg] = useState('');
  const [pops, setPops] = useState([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  // Track un-synced clicks to batch them to Supabase
  const unsyncedClicks = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Disable pull-to-refresh on mobile for this specific page
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    // Prevent scrolling everywhere EXCEPT inside the leaderboard
    const handleTouchMove = (e) => {
      if (!e.target.closest('.leaderboard-scroll')) {
        if (e.cancelable) e.preventDefault();
      }
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Load current user
    const userData = localStorage.getItem('deksa_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch initial leaderboard and global score
    fetchLeaderboard();

    // Setup periodic sync every 1 second for auto-save
    const syncInterval = setInterval(syncClicks, 1000);

    const handleBeforeUnload = () => {
      if (unsyncedClicks.current > 0) {
        syncClicks();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Revert styles when leaving page
      document.body.style.overscrollBehavior = 'auto';
      document.documentElement.style.overscrollBehavior = 'auto';
      document.removeEventListener('touchmove', handleTouchMove);
      clearInterval(syncInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      syncClicks(); // Final sync on unmount
    };
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('exam_app_popcat')
      .select('*')
      .order('clicks', { ascending: false })
      .limit(10);
      
    if (!error && data) {
      // Fetch user profile pictures
      const userIds = data.map(r => r.id);
      const { data: usersData } = await supabase.from('exam_app_users').select('id, profilePicture').in('id', userIds);
      
      const mergedData = data.map(row => {
         const userProfile = usersData?.find(u => u.id === row.id);
         return { ...row, profilePicture: userProfile?.profilePicture || null };
      });

      setLeaderboard(mergedData);
      // Calculate global score by summing all clicks
      const total = data.reduce((sum, row) => sum + Number(row.clicks), 0);
      setGlobalScore(total);
      
      // Update local score for the current user
      const currentUserData = localStorage.getItem('deksa_user');
      if (currentUserData) {
         const u = JSON.parse(currentUserData);
         // Always fetch their actual score from DB directly so it's not limited to top 10
         const { data: myData } = await supabase.from('exam_app_popcat').select('clicks').eq('id', u.id).maybeSingle();
         if (myData) {
             setLocalScore(Number(myData.clicks));
         } else {
             setLocalScore(0);
         }
      }
    }
  };

  const syncClicks = async () => {
    if (unsyncedClicks.current > 0) {
      const clicksToSync = unsyncedClicks.current;
      unsyncedClicks.current = 0; // Reset immediately to prevent double counting
      
      // Get user from localStorage to avoid stale closure in setInterval
      const currentUserData = localStorage.getItem('deksa_user');
      if (!currentUserData) return;
      
      const u = JSON.parse(currentUserData);
      const userId = u.id;
      const userName = u.name;

      try {
        // 1. Fetch current clicks
        const { data: existing } = await supabase
          .from('exam_app_popcat')
          .select('clicks')
          .eq('id', userId)
          .maybeSingle();

        const currentClicks = existing ? Number(existing.clicks) : 0;
        const newTotal = currentClicks + clicksToSync;

        // 2. Upsert new total
        const { error } = await supabase
          .from('exam_app_popcat')
          .upsert({
            id: userId,
            name: userName,
            clicks: newTotal
          });

        if (!error) {
          fetchLeaderboard(); // Refresh leaderboard after successful sync
        } else {
          console.error('Failed to sync clicks:', error);
          if (error.code === '42501') {
            alert('🚨 บันทึกไม่ได้: คุณลืมปิด RLS (Row Level Security) ใน Supabase ครับ!\nให้ไปที่เว็บ Supabase -> Table Editor -> exam_app_popcat -> กด Disable RLS ที่มุมขวาบนครับ');
            // Drop the clicks to prevent infinite loop
          } else {
            unsyncedClicks.current += clicksToSync;
          }
        }
      } catch (err) {
        console.error('Error in syncClicks:', err);
        // Do not add back clicks on fetch error if it's a structural error
      }
    }
  };

  const handleManualSave = async () => {
    if (unsyncedClicks.current > 0) {
      await syncClicks();
      alert('บันทึกคะแนนเข้าสู่ตารางอันดับเรียบร้อยแล้ว!');
    } else {
      alert('คะแนนของคุณเป็นปัจจุบันแล้ว');
    }
  };

  const playPopSound = () => {
    if (!audioRef.current) {
      // Create a simple pop sound using Web Audio API if no file is provided
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    }
  };

  const handlePointerDown = (e) => {
    // Require login
    if (!user) return;
    
    // Prevent default to avoid selection/zoom on mobile
    if (e.cancelable) e.preventDefault();
    
    setIsOpen(true);
    setLocalScore(prev => prev + 1);
    setGlobalScore(prev => prev + 1); // Optimistic UI update
    unsyncedClicks.current += 1;
    playPopSound();

    // Optimistic Leaderboard update
    if (user) {
      setLeaderboard(prev => {
        let updated = false;
        const newLeaderboard = prev.map(row => {
          if (row.id === user.id) {
            updated = true;
            return { ...row, clicks: Number(row.clicks) + 1 };
          }
          return row;
        });
        
        if (updated) {
           return newLeaderboard.sort((a, b) => Number(b.clicks) - Number(a.clicks));
        }
        return prev;
      });
    }

    // Floating text logic
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    const popId = Date.now() + Math.random();
    setPops(prev => [...prev, { id: popId, x, y }]);
    setTimeout(() => {
      setPops(prev => prev.filter(p => p.id !== popId));
    }, 800);
  };

  const handlePointerUp = (e) => {
    if (e.cancelable) e.preventDefault();
    setIsOpen(false);
  };

  const handleRootPointerDown = (e) => {
    if (e.target.closest('.popcat-ui')) return;
    handlePointerDown(e);
  };

  return (
    <div 
      style={{
        height: '100dvh', 
        background: '#050505',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        userSelect: 'none',
        overflow: 'hidden',
        touchAction: 'manipulation',
        position: 'relative'
      }}
      onPointerDown={handleRootPointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      
      <style>{`
        @keyframes elegantPop {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          15% { transform: translate(-50%, -60px) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -150px) scale(0.9); opacity: 0; }
        }
        .pop-text-new {
          animation: elegantPop 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .glass-panel {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .leaderboard-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .leaderboard-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .leaderboard-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
      `}</style>

      {/* Login Overlay */}
      {!user && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="glass-panel" style={{
            padding: '2rem',
            textAlign: 'center',
            borderRadius: '1rem',
            maxWidth: '90%',
            color: 'white',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 'bold' }}>กรุณาเข้าสู่ระบบ</h2>
            <p style={{ marginBottom: '1.5rem', color: '#ccc', fontSize: '1rem' }}>เพื่อบันทึกคะแนนและแข่งขันในกระดานผู้นำ (1 คน 1 บัญชี)</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate('/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >กลับหน้าหลัก</button>
              <button 
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
                }}
              >ไปที่หน้าล็อกอิน</button>
            </div>
          </div>
        </div>
      )}

      {/* Center Image Element */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        width: '100vw',
        height: 'calc(var(--vh, 1vh) * 100)',
        overflow: 'hidden'
      }}>
        {isOpen ? (
          <img src={poppingImg || '/popcat-open.jpg'} alt="pop" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} draggable="false" />
        ) : (
          <img src={defaultImg || '/popcat-normal.jpg'} alt="normal" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} draggable="false" />
        )}
      </div>

      {/* Floating Texts */}
      {pops.map(pop => (
        <div 
          key={pop.id} 
          className="pop-text-new"
          style={{ 
            position: 'absolute',
            fontSize: '3rem',
            fontWeight: '900',
            color: '#ffffff',
            textShadow: '0 4px 16px rgba(0,0,0,0.5)',
            left: pop.x, 
            top: pop.y, 
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          +1
        </div>
      ))}

      {/* Top Navigation & Score Bar */}
      <div 
        className="popcat-ui glass-panel"
        style={{ 
          position: 'absolute', 
          top: 'env(safe-area-inset-top, 1rem)', 
          marginTop: '1rem',
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '95%',
          maxWidth: '600px',
          padding: '0.5rem 0.75rem',
          borderRadius: '999px',
          zIndex: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        <button 
          onClick={() => navigate('/')}
          onPointerDown={(e) => { e.stopPropagation(); navigate('/'); }}
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none',
            color: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            padding: '0.5rem 0.8rem',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontWeight: 'bold',
            fontSize: '0.85rem'
          }}
        >
          <Home size={16} /> <span className="hide-on-mobile">กลับหน้าหลัก</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color="#eab308" className="hide-on-mobile" />
          <span style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)', fontWeight: '900', letterSpacing: '1px', color: '#fff' }}>
            {localScore.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button 
            onClick={() => setIsLeaderboardOpen(true)}
            onPointerDown={(e) => { e.stopPropagation(); setIsLeaderboardOpen(true); }}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none',
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              padding: '0.5rem 0.8rem',
              borderRadius: '999px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Trophy size={16} color="#eab308" /> <span className="hide-on-mobile">อันดับ</span>
          </button>

          <button 
            onClick={handleManualSave}
            onPointerDown={(e) => { e.stopPropagation(); handleManualSave(); }}
            style={{ 
              background: '#ffffff', 
              border: 'none',
              color: '#000', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              padding: '0.5rem 0.8rem',
              borderRadius: '999px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(255,255,255,0.2)'
            }}
          >
            <Save size={16} /> <span className="hide-on-mobile">เซฟคะแนน</span>
          </button>
        </div>
      </div>

      {/* Floating button removed */}

      {/* Leaderboard Slide Panel */}
      <div 
        className="popcat-ui glass-panel"
        style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          width: '100%', 
          maxWidth: '380px', 
          height: '100dvh', 
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          zIndex: 50,
          transform: isLeaderboardOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
        }}
      >
        {/* Panel Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '2rem 1.5rem 1.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>Leaderboard</h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>อันดับนักรบทั้งหมด</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsLeaderboardOpen(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: '#fff', 
              cursor: 'pointer', 
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel Content (List) */}
        <div className="leaderboard-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          {leaderboard.map((row, index) => {
            let itemStyle = { 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.05)' 
            };
            let rankColor = 'rgba(255,255,255,0.4)';
            
            if (index === 0) {
              itemStyle = { background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)' };
              rankColor = '#eab308';
            } else if (index === 1) {
              itemStyle = { background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)' };
              rankColor = '#94a3b8';
            } else if (index === 2) {
              itemStyle = { background: 'rgba(234, 88, 12, 0.15)', border: '1px solid rgba(234, 88, 12, 0.3)' };
              rankColor = '#ea580c';
            }

            return (
              <div 
                key={row.id}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ 
                  ...itemStyle,
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  borderRadius: '1rem',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ 
                    width: '32px', 
                    fontWeight: '900',
                    color: rankColor,
                    fontSize: '1.1rem',
                    textAlign: 'center'
                  }}>
                    {index === 0 ? '🏆' : `#${index + 1}`}
                  </div>
                  {index < 3 && (
                    <img 
                      src={row.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=random`} 
                      alt={row.name} 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${rankColor}` }}
                    />
                  )}
                  <span style={{ fontWeight: '600', color: '#fff', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {row.name}
                  </span>
                </div>
                <span style={{ fontWeight: '800', color: '#fff', fontSize: '1.2rem', letterSpacing: '0.5px' }}>
                  {Number(row.clicks).toLocaleString()}
                </span>
              </div>
            );
          })}
          {leaderboard.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem 0', fontSize: '0.9rem' }}>ไม่มีข้อมูลผู้เล่น</div>
          )}
        </div>
      </div>
      
      {/* Dim Overlay when Leaderboard is open */}
      {isLeaderboardOpen && (
        <div 
          className="popcat-ui"
          onClick={(e) => { e.stopPropagation(); setIsLeaderboardOpen(false); }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }} 
        />
      )}

      {/* Hide/Show text on mobile for Top Bar */}
      <style>{`
        @media (max-width: 600px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: inline !important; }
        }
      `}</style>

    </div>
  );
}
