import React, { useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../store/mockDb';

const NotificationManager = () => {
  const [nextClass, setNextClass] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [timetable, setTimetable] = useState(null);
  const checkedClasses = useRef(new Set()); // Keep track of classes we already notified for

  const loadTimetableFromLocal = () => {
    let userId = 'guest';
    const userStr = localStorage.getItem('deksa_user');
    if (userStr) {
      try { userId = JSON.parse(userStr).id || 'guest'; } catch (e) {}
    }
    
    const saved = localStorage.getItem(`deksa_timetable_${userId}`);
    if (saved) {
      try {
        setTimetable(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cached timetable', e);
      }
    }
  };

  useEffect(() => {
    // 1. Initial Load
    loadTimetableFromLocal();

    // 2. Listen for timetable updates from MyTimetable.jsx
    window.addEventListener('timetable-updated', loadTimetableFromLocal);

    // 3. Keep a backup fetch from Supabase in case this component loads before MyTimetable
    const fetchTimetableFallback = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('exam_app_timetables')
          .select('timetable')
          .eq('id', user.id)
          .single();
          
        if (data && data.timetable) {
          setTimetable(data.timetable);
          // Don't overwrite localStorage here, let MyTimetable handle it to avoid loops
        }
      } catch (err) {
        console.error('Failed to fetch timetable for notifications', err);
      }
    };
    fetchTimetableFallback();

    return () => {
      window.removeEventListener('timetable-updated', loadTimetableFromLocal);
    };
  }, []);

  useEffect(() => {
    if (!timetable) return;

    // Check every minute
    const interval = setInterval(() => {
      checkNextClass(timetable);
    }, 60000);

    // Initial check
    checkNextClass(timetable);

    return () => clearInterval(interval);
  }, [timetable]);

  const checkNextClass = (tt) => {
    const now = new Date();
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const currentDay = dayNames[now.getDay()];
    
    if (!tt[currentDay]) return;

    const classesToday = tt[currentDay];
    
    for (const c of classesToday) {
      if (!c.startTime) continue;
      
      const [startHour, startMin] = c.startTime.split(':').map(Number);
      
      // Calculate minutes from midnight
      const startTotalMins = startHour * 60 + startMin;
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();
      
      const diffMins = startTotalMins - currentTotalMins;
      
      // If class starts in exactly 10 minutes (or between 0-10 mins) and we haven't notified yet
      if (diffMins > 0 && diffMins <= 10 && !checkedClasses.current.has(c.id)) {
        checkedClasses.current.add(c.id);
        setNextClass({ ...c, startsIn: diffMins });
        setShowBanner(true);
        
        // Try to show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('เตรียมตัวเรียน!', {
            body: `วิชา ${c.name} กำลังจะเริ่มในอีก ${diffMins} นาที${c.room ? ` ที่ห้อง ${c.room}` : ''}`,
            icon: '/vite.svg'
          });
        }
      }
    }
  };

  useEffect(() => {
    // Request notification permission if not asked
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!showBanner || !nextClass) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(59, 130, 246, 0.95)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 9999,
      animation: 'slideDown 0.3s ease-out forwards'
    }}>
      <style>{`
        @keyframes slideDown {
          from { top: -100px; opacity: 0; }
          to { top: 20px; opacity: 1; }
        }
      `}</style>
      
      <div style={{ background: 'white', color: '#3b82f6', borderRadius: '50%', padding: '0.5rem', display: 'flex' }}>
        <Bell size={24} />
      </div>
      
      <div style={{ flex: 1, minWidth: '200px' }}>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>เตรียมตัวเรียน!</h4>
        <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
          วิชา <strong>{nextClass.name}</strong> จะเริ่มในอีก {nextClass.startsIn} นาที
          {nextClass.room && <span> (ห้อง {nextClass.room})</span>}
        </p>
      </div>
      
      <button 
        onClick={() => setShowBanner(false)}
        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', display: 'flex', opacity: 0.8 }}
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default NotificationManager;
