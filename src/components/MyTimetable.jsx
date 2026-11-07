import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Clock, Bell, BellRing, MapPin, Search, 
  Check, Copy, Sparkles, BookOpen, Calendar, AlertCircle, 
  ChevronDown, ChevronUp, Layers, CheckCircle2, RotateCcw,
  Zap, Compass, User, FlaskConical, Calculator, Languages, 
  Landmark, Laptop, Activity, Palette, Users, GraduationCap
} from 'lucide-react';
import { supabase } from '../store/mockDb';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';

// Standard Thai school subject categories with custom badges and themes
const SUBJECT_THEMES = [
  { keywords: ['วิทย์', 'ชีวะ', 'เคมี', 'ฟิสิกส์', 'ดารา', 'sci'], label: 'วิทยาศาสตร์', Icon: FlaskConical, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  { keywords: ['คณิต', 'math', 'คำนวณ', 'แคล'], label: 'คณิตศาสตร์', Icon: Calculator, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
  { keywords: ['อังกฤษ', 'eng', 'inter'], label: 'ภาษาอังกฤษ', Icon: Languages, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)' },
  { keywords: ['ไทย', 'thai', 'วรรณ'], label: 'ภาษาไทย', Icon: BookOpen, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
  { keywords: ['สังคม', 'ประวัติ', 'ภูมิ', 'หน้าที่', 'ศาสนา'], label: 'สังคมศึกษา', Icon: Landmark, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  { keywords: ['คอม', 'เทคโน', 'โปรแกรม', 'โค้ด', 'it', 'cs', 'com'], label: 'เทคโนโลยี', Icon: Laptop, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)' },
  { keywords: ['พละ', 'สุข', 'กีฬา', 'เปตอง', 'บอล', 'บาส'], label: 'สุขศึกษา & พละ', Icon: Activity, color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)', border: 'rgba(132, 204, 22, 0.3)' },
  { keywords: ['ศิลปะ', 'ดนตรี', 'วาด', 'นาฏ'], label: 'ศิลปะ & ดนตรี', Icon: Palette, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)' },
  { keywords: ['แนะแนว', 'ชุมนุม', 'ลูกเสือ', 'เนตร', 'กิจกรรม'], label: 'กิจกรรมพัฒนาผู้เรียน', Icon: Users, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)' },
];

const getSubjectTheme = (name = '') => {
  const lower = name.toLowerCase();
  for (const theme of SUBJECT_THEMES) {
    if (theme.keywords.some(kw => lower.includes(kw))) {
      return theme;
    }
  }
  return { label: 'ทั่วไป', Icon: GraduationCap, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.3)' };
};

// Standard Thai periods for quick addition
const STANDARD_PERIODS = [
  { label: 'คาบ 1', start: '08:30', end: '09:20' },
  { label: 'คาบ 2', start: '09:20', end: '10:10' },
  { label: 'คาบ 3', start: '10:10', end: '11:00' },
  { label: 'คาบ 4', start: '11:00', end: '11:50' },
  { label: 'คาบ 5', start: '12:40', end: '13:30' },
  { label: 'คาบ 6', start: '13:30', end: '14:20' },
  { label: 'คาบ 7', start: '14:20', end: '15:10' },
  { label: 'คาบ 8', start: '15:10', end: '16:00' },
];

// Quick subject preset names
const SUBJECT_PRESETS = [
  'คณิตศาสตร์', 'วิทยาศาสตร์', 'ภาษาอังกฤษ', 'ภาษาไทย', 
  'สังคมศึกษา', 'วิทยาการคำนวณ', 'สุขศึกษา', 'ศิลปะ', 'แนะแนว', 'ชุมนุม'
];

// Days of the week in Thai with respective Thai cultural colors
const DAYS_CONFIG = [
  { key: 'จันทร์', label: 'วันจันทร์', color: '#eab308', glow: 'rgba(234, 179, 8, 0.25)', bg: 'rgba(234, 179, 8, 0.12)' },
  { key: 'อังคาร', label: 'วันอังคาร', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.25)', bg: 'rgba(236, 72, 153, 0.12)' },
  { key: 'พุธ', label: 'วันพุธ', color: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', bg: 'rgba(16, 185, 129, 0.12)' },
  { key: 'พฤหัสบดี', label: 'วันพฤหัสฯ', color: '#f97316', glow: 'rgba(249, 115, 22, 0.25)', bg: 'rgba(249, 115, 22, 0.12)' },
  { key: 'ศุกร์', label: 'วันศุกร์', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.25)', bg: 'rgba(6, 182, 212, 0.12)' },
];

const MyTimetable = () => {
  // Current real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Determine current day of week in Thai
  const todayThai = useMemo(() => {
    const dayIndex = currentTime.getDay(); // 0 is Sun, 1 is Mon... 6 is Sat
    const map = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return map[dayIndex] || 'จันทร์';
  }, [currentTime]);

  const [activeDay, setActiveDay] = useState(() => {
    const dayIndex = new Date().getDay();
    const map = ['จันทร์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'จันทร์'];
    return map[dayIndex] || 'จันทร์';
  });

  const [timetable, setTimetable] = useState(() => {
    let userId = 'guest';
    const userStr = localStorage.getItem('deksa_user');
    if (userStr) {
      try {
        userId = JSON.parse(userStr).id || 'guest';
      } catch (e) {}
    }
    
    const saved = localStorage.getItem(`deksa_timetable_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached timetable');
      }
    }
    return {
      'จันทร์': [], 'อังคาร': [], 'พุธ': [], 'พฤหัสบดี': [], 'ศุกร์': []
    };
  });

  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(''); // 'syncing', 'synced', 'local-only'
  const [showAddForm, setShowAddForm] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // New Class Form
  const [newClass, setNewClass] = useState({ 
    name: '', 
    startTime: '08:30', 
    endTime: '09:20', 
    room: '',
    teacher: ''
  });

  // Keep live time updated every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, []);

  // Sync to localStorage and dispatch event whenever timetable changes
  useEffect(() => {
    let userId = 'guest';
    const userStr = localStorage.getItem('deksa_user');
    if (userStr) {
      try { userId = JSON.parse(userStr).id || 'guest'; } catch (e) {}
    }
    localStorage.setItem(`deksa_timetable_${userId}`, JSON.stringify(timetable));
    window.dispatchEvent(new Event('timetable-updated'));
  }, [timetable]);

  const fetchTimetable = async () => {
    try {
      let targetUserId = null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        targetUserId = user.id;
      } else {
        const userStr = localStorage.getItem('deksa_user');
        if (userStr) {
          try { targetUserId = JSON.parse(userStr).id; } catch (e) {}
        }
      }

      if (!targetUserId || targetUserId === 'guest') {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('exam_app_timetables')
        .select('timetable')
        .eq('id', targetUserId)
        .single();
        
      if (!error && data && data.timetable) {
        setTimetable(data.timetable);
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error('MyTimetable: fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const autoSaveToSupabase = async (newTimetable) => {
    setSyncStatus('syncing');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('exam_app_timetables').upsert({ id: user.id, timetable: newTimetable });
        if (error) throw error;
        setSyncStatus('synced');
      } else {
        setSyncStatus('local-only');
      }
    } catch (err) {
      console.error('Auto-save error:', err);
      setSyncStatus('local-only');
    }
  };

  const addClass = () => {
    if (!newClass.name.trim() || !newClass.startTime || !newClass.endTime) return;

    setTimetable(prev => {
      const currentDayList = prev[activeDay] || [];
      const updatedDay = [...currentDayList, { 
        ...newClass, 
        name: newClass.name.trim(),
        room: newClass.room.trim(),
        teacher: newClass.teacher.trim(),
        id: Date.now().toString() 
      }];
      // Sort by start time
      updatedDay.sort((a, b) => a.startTime.localeCompare(b.startTime));
      const newTimetable = { ...prev, [activeDay]: updatedDay };
      autoSaveToSupabase(newTimetable);
      return newTimetable;
    });

    // Advance to next likely period
    const currentIndex = STANDARD_PERIODS.findIndex(p => p.start === newClass.startTime);
    let nextStart = '09:20';
    let nextEnd = '10:10';
    if (currentIndex >= 0 && currentIndex < STANDARD_PERIODS.length - 1) {
      nextStart = STANDARD_PERIODS[currentIndex + 1].start;
      nextEnd = STANDARD_PERIODS[currentIndex + 1].end;
    } else {
      nextStart = newClass.endTime;
      nextEnd = '';
    }

    setNewClass({ name: '', startTime: nextStart, endTime: nextEnd, room: '', teacher: '' });
  };

  const removeClass = (id) => {
    if (!window.confirm('คุณต้องการลบวิชาเรียนนี้ใช่หรือไม่?')) return;
    setTimetable(prev => {
      const newTimetable = {
        ...prev,
        [activeDay]: (prev[activeDay] || []).filter(c => c.id !== id)
      };
      autoSaveToSupabase(newTimetable);
      return newTimetable;
    });
  };

  const clearDayTimetable = () => {
    if (!window.confirm(`ต้องการล้างวิชาเรียนทั้งหมดในวัน${activeDay} ใช่หรือไม่?`)) return;
    setTimetable(prev => {
      const newTimetable = { ...prev, [activeDay]: [] };
      autoSaveToSupabase(newTimetable);
      return newTimetable;
    });
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      sendNotification('ระบบแจ้งเตือนตารางเรียน Dek SA', {
        body: 'ระบบพร้อมแจ้งเตือนล่วงหน้า 10 นาทีก่อนเริ่มทุกคาบเรียนครับ',
        tag: 'test-notification'
      });
      alert('ส่งการแจ้งเตือนทดสอบแล้ว! ตรวจสอบที่แถบแจ้งเตือนของอุปกรณ์คุณ');
    } else {
      alert('คุณยังไม่ได้อนุญาตให้ระบบส่งการแจ้งเตือน กรุณาเปิดการอนุญาตในตั้งค่าเบราว์เซอร์');
    }
  };

  // Helper to calculate ongoing class and next upcoming class today
  const { ongoingClass, upcomingClass, minutesUntilNext } = useMemo(() => {
    const todayClasses = timetable[todayThai] || [];
    if (todayClasses.length === 0) {
      return { ongoingClass: null, upcomingClass: null, minutesUntilNext: null };
    }

    const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();

    let ongoing = null;
    let upcoming = null;
    let minDiff = Infinity;

    for (const c of todayClasses) {
      if (!c.startTime || !c.endTime) continue;
      const [sh, sm] = c.startTime.split(':').map(Number);
      const [eh, em] = c.endTime.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;

      // Currently ongoing
      if (currentTotalMins >= startMins && currentTotalMins < endMins) {
        ongoing = { ...c, remainingMins: endMins - currentTotalMins };
        break;
      }

      // Upcoming today
      if (startMins > currentTotalMins) {
        const diff = startMins - currentTotalMins;
        if (diff < minDiff) {
          minDiff = diff;
          upcoming = c;
        }
      }
    }

    return { 
      ongoingClass: ongoing, 
      upcomingClass: upcoming, 
      minutesUntilNext: minDiff !== Infinity ? minDiff : null 
    };
  }, [timetable, todayThai, currentTime]);

  const activeDayClasses = timetable[activeDay] || [];

  if (loading) {
    return (
      <div className="timetable-loading-card">
        <div className="timetable-spinner"></div>
        <p>กำลังโหลดตารางเรียนส่วนตัวของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="timetable-wrapper">
      
      {/* 1. Live Class Status Banner */}
      <div className="live-status-card">
        <div className="status-badge-glow">
          <span className="live-pulse-dot"></span>
          <span>{todayThai === activeDay ? `วันนี้วัน${todayThai}` : `วันนี้วัน${todayThai} (กำลังดูวัน${activeDay})`}</span>
          <span className="status-time-chip">
            {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
          </span>
        </div>

        <div className="status-content-row">
          {ongoingClass ? (
            <div className="status-info-box ongoing">
              <div className="status-icon-bubble green">
                <Zap size={22} color="#10b981" />
              </div>
              <div className="status-text-block">
                <div className="status-title-row">
                  <span className="status-tag live">กำลังเรียนอยู่ตอนนี้</span>
                  <span className="status-time-left">เหลือเวลาอีก {ongoingClass.remainingMins} นาที</span>
                </div>
                <h3 className="status-class-title">{ongoingClass.name}</h3>
                <div className="status-sub-row">
                  <span><Clock size={14} /> {ongoingClass.startTime} - {ongoingClass.endTime} น.</span>
                  {ongoingClass.room && <span><MapPin size={14} /> ห้อง {ongoingClass.room}</span>}
                  {ongoingClass.teacher && <span><User size={14} /> อ.{ongoingClass.teacher}</span>}
                </div>
              </div>
            </div>
          ) : upcomingClass ? (
            <div className="status-info-box upcoming">
              <div className="status-icon-bubble blue">
                <Clock size={22} color="#60a5fa" />
              </div>
              <div className="status-text-block">
                <div className="status-title-row">
                  <span className="status-tag upcoming">คาบต่อไปวันนี้</span>
                  <span className="status-time-left blue">อีก {minutesUntilNext} นาที</span>
                </div>
                <h3 className="status-class-title">{upcomingClass.name}</h3>
                <div className="status-sub-row">
                  <span><Clock size={14} /> {upcomingClass.startTime} - {upcomingClass.endTime} น.</span>
                  {upcomingClass.room && <span><MapPin size={14} /> ห้อง {upcomingClass.room}</span>}
                  {upcomingClass.teacher && <span><User size={14} /> อ.{upcomingClass.teacher}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="status-info-box free">
              <div className="status-icon-bubble gray">
                <Sparkles size={22} color="#facc15" />
              </div>
              <div className="status-text-block">
                <h4 className="status-free-title">ไม่มีคาบเรียนในเวลานี้</h4>
                <p className="status-free-desc">
                  {todayThai === 'เสาร์' || todayThai === 'อาทิตย์' 
                    ? 'วันหยุดสุดสัปดาห์ พักผ่อนให้เต็มที่ หรือเตรียมทบทวนบทเรียนล่วงหน้าได้เลย!' 
                    : 'นอกช่วงเวลาเรียนตามตาราง สามารถดูตารางเรียนวันอื่นหรือเพิ่มวิชาได้ที่ด้านล่างครับ'}
                </p>
              </div>
            </div>
          )}

          {/* Quick Notification & Sync Control */}
          <div className="status-side-actions">
            <button 
              className={`notif-btn ${notifGranted ? 'active' : ''}`}
              onClick={handleTestNotification}
              title="ตั้งค่าและทดสอบการแจ้งเตือน"
            >
              {notifGranted ? <BellRing size={16} /> : <Bell size={16} />}
              <span>{notifGranted ? 'เปิดแจ้งเตือนแล้ว' : 'เปิดแจ้งเตือนล่วงหน้า'}</span>
            </button>

            <div className="sync-chip">
              <span className={`sync-dot ${syncStatus}`}></span>
              <span>
                {syncStatus === 'syncing' && 'กำลังซิงค์...'}
                {syncStatus === 'synced' && 'ซิงค์บนคลาวด์แล้ว'}
                {syncStatus === 'local-only' && 'เซฟในเครื่อง (ออฟไลน์)'}
                {!syncStatus && 'พร้อมใช้งาน'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Days of the Week Tabs */}
      <div className="days-segmented-bar">
        {DAYS_CONFIG.map(day => {
          const isSelected = activeDay === day.key;
          const isToday = todayThai === day.key;
          const count = (timetable[day.key] || []).length;

          return (
            <button
              key={day.key}
              className={`day-tab-pill ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => setActiveDay(day.key)}
              style={{
                '--day-color': day.color,
                '--day-glow': day.glow,
                '--day-bg': day.bg,
              }}
            >
              <div className="day-pill-top">
                <span className="day-pill-name">{day.label}</span>
                {isToday && <span className="today-badge">วันนี้</span>}
              </div>
              <span className="day-pill-count">
                {count > 0 ? `${count} คาบ` : 'ว่าง'}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Schedule Content Header & Actions */}
      <div className="day-header-row">
        <div className="day-title-block">
          <h2 className="day-main-heading">
            วิชาเรียน{DAYS_CONFIG.find(d => d.key === activeDay)?.label}
          </h2>
          <span className="day-class-chip">
            {activeDayClasses.length} รายวิชาที่บันทึกไว้
          </span>
        </div>

        <div className="day-controls-group">
          {activeDayClasses.length > 0 && (
            <button 
              className="action-icon-btn danger" 
              onClick={clearDayTimetable}
              title="ล้างวิชาเรียนในวันนี้ทั้งหมด"
            >
              <RotateCcw size={15} />
              <span>ล้างตารางวัน</span>
            </button>
          )}

          <button 
            className={`action-pill-btn add ${showAddForm ? 'open' : ''}`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={17} />
            <span>{showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มวิชาเรียน'}</span>
          </button>
        </div>
      </div>

      {/* 4. Collapsible Add Class Form */}
      {showAddForm && (
        <div className="add-class-panel">
          <div className="panel-header">
            <div className="panel-title-box">
              <Plus size={18} className="panel-icon" />
              <h3 className="panel-title">เพิ่มวิชาเรียนลงในวัน{activeDay}</h3>
            </div>
            <span className="panel-hint">กรอกข้อมูลวิชาและเวลาเริ่ม-จบ</span>
          </div>

          {/* Quick Subject Presets */}
          <div className="presets-block">
            <span className="preset-label">วิชายอดนิยม (แตะเพื่อกรอกอัตโนมัติ):</span>
            <div className="preset-chips-scroll">
              {SUBJECT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => setNewClass({ ...newClass, name: preset })}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Period Presets */}
          <div className="presets-block">
            <span className="preset-label">คาบเรียนมาตรฐาน (แตะเพื่อกำหนดเวลา):</span>
            <div className="preset-chips-scroll">
              {STANDARD_PERIODS.map((period, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip period"
                  onClick={() => setNewClass({ ...newClass, startTime: period.start, endTime: period.end })}
                >
                  <strong>{period.label}</strong> ({period.start}-{period.end})
                </button>
              ))}
            </div>
          </div>

          <div className="form-inputs-grid">
            <div className="input-group full">
              <label className="input-label">ชื่อวิชาเรียน <span className="req">*</span></label>
              <input 
                type="text"
                className="custom-text-input"
                placeholder="เช่น วิทยาการคำนวณ หรือ ฟิสิกส์ 1"
                value={newClass.name}
                onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">ห้องเรียน (ถ้ามี)</label>
              <input 
                type="text"
                className="custom-text-input"
                placeholder="เช่น 142 หรือ Lab 2"
                value={newClass.room}
                onChange={e => setNewClass({ ...newClass, room: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">ครูผู้สอน (ถ้ามี)</label>
              <input 
                type="text"
                className="custom-text-input"
                placeholder="เช่น อ.สมชาย หรือ Teacher John"
                value={newClass.teacher}
                onChange={e => setNewClass({ ...newClass, teacher: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">เวลาเริ่ม <span className="req">*</span></label>
              <input 
                type="time"
                className="custom-text-input time-pick"
                value={newClass.startTime}
                onChange={e => setNewClass({ ...newClass, startTime: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">เวลาจบ <span className="req">*</span></label>
              <input 
                type="time"
                className="custom-text-input time-pick"
                value={newClass.endTime}
                onChange={e => setNewClass({ ...newClass, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="panel-footer">
            <button 
              type="button" 
              className="cancel-form-btn"
              onClick={() => setShowAddForm(false)}
            >
              ยกเลิก
            </button>
            <button 
              type="button" 
              className="submit-form-btn"
              onClick={addClass}
              disabled={!newClass.name.trim() || !newClass.startTime || !newClass.endTime}
            >
              <Plus size={16} />
              <span>บันทึกลงในวัน{activeDay}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Class Timeline List */}
      <div className="classes-timeline-container">
        {activeDayClasses.length === 0 ? (
          <div className="empty-classes-card">
            <div className="empty-icon-circle">
              <Calendar size={36} color="#60a5fa" />
            </div>
            <h3 className="empty-title">ยังไม่มีวิชาเรียนในวัน{activeDay}</h3>
            <p className="empty-desc">
              กดปุ่ม <strong style={{ color: '#60a5fa' }}>"+ เพิ่มวิชาเรียน"</strong> ด้านบนเพื่อจัดตารางเรียนส่วนตัวสำหรับวัน{activeDay} ได้เลยครับ
            </p>
            <button 
              className="empty-cta-btn"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} />
              <span>เพิ่มวิชาแรกของวัน{activeDay}</span>
            </button>
          </div>
        ) : (
          <div className="classes-cards-list">
            {activeDayClasses.map((item, index) => {
              const theme = getSubjectTheme(item.name);
              
              // Check if class is ongoing right now
              const isToday = todayThai === activeDay;
              let isOngoing = false;
              if (isToday && item.startTime && item.endTime) {
                const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                const [sh, sm] = item.startTime.split(':').map(Number);
                const [eh, em] = item.endTime.split(':').map(Number);
                isOngoing = currentTotalMins >= (sh * 60 + sm) && currentTotalMins < (eh * 60 + em);
              }

              return (
                <div 
                  key={item.id || index}
                  className={`class-item-card ${isOngoing ? 'is-ongoing' : ''}`}
                  style={{
                    '--item-color': theme.color,
                    '--item-bg': theme.bg,
                    '--item-border': theme.border,
                  }}
                >
                  {/* Period Badge */}
                  <div className="period-index-badge">
                    <span>คาบที่ {index + 1}</span>
                  </div>

                  {/* Left Color Accent & Icon */}
                  <div className="class-icon-box">
                    <theme.Icon size={22} color={theme.color} />
                  </div>

                  {/* Class Info */}
                  <div className="class-main-content">
                    <div className="class-top-meta">
                      <span className="subject-category-tag">{theme.label}</span>
                      {isOngoing && (
                        <span className="ongoing-tag">
                          <span className="live-dot"></span>
                          <span>กำลังเรียน</span>
                        </span>
                      )}
                    </div>

                    <h4 className="class-name-text">{item.name}</h4>

                    <div className="class-meta-row">
                      <div className="meta-item time">
                        <Clock size={14} className="meta-icon" />
                        <span>{item.startTime} - {item.endTime} น.</span>
                      </div>

                      {item.room && (
                        <div className="meta-item room">
                          <MapPin size={14} className="meta-icon" />
                          <span>ห้อง {item.room}</span>
                        </div>
                      )}

                      {item.teacher && (
                        <div className="meta-item teacher">
                          <User size={14} className="meta-icon" />
                          <span>อ.{item.teacher}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="class-item-actions">
                    <button 
                      className="trash-btn"
                      onClick={() => removeClass(item.id)}
                      title="ลบวิชานี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .timetable-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          color: #ffffff;
        }

        /* 1. Live Status Card */
        .live-status-card {
          background: linear-gradient(135deg, rgba(24, 24, 32, 0.85) 0%, rgba(14, 14, 20, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          padding: 1.5rem 1.75rem;
          -webkit-backdrop-filter: blur(24px);
          backdrop-filter: blur(24px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
        }

        .live-status-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa, #a855f7, #ec4899);
          opacity: 0.8;
        }

        .status-badge-glow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 1rem;
        }

        .live-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }

        .status-time-chip {
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #60a5fa;
        }

        .status-content-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .status-info-box {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex: 1;
          min-width: 280px;
        }

        .status-icon-bubble {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
        }

        .status-icon-bubble.green {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .status-icon-bubble.blue {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.35);
        }

        .status-icon-bubble.gray {
          background: rgba(250, 204, 21, 0.12);
          border: 1px solid rgba(250, 204, 21, 0.3);
        }

        .status-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .status-tag {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .status-tag.live {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .status-tag.upcoming {
          background: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
          border: 1px solid rgba(59, 130, 246, 0.4);
        }

        .status-time-left {
          font-size: 0.8rem;
          font-weight: 600;
          color: #34d399;
        }

        .status-time-left.blue {
          color: #93c5fd;
        }

        .status-class-title {
          font-size: 1.35rem;
          font-weight: 800;
          margin: 0 0 4px;
          color: #ffffff;
        }

        .status-sub-row {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          flex-wrap: wrap;
        }

        .status-sub-row span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .status-free-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0 0 3px;
          color: #ffffff;
        }

        .status-free-desc {
          margin: 0;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.45;
          max-width: 500px;
        }

        .status-side-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .notif-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.82rem;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .notif-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
        }

        .notif-btn.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.4);
          color: #60a5fa;
        }

        .sync-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .sync-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #a1a1aa;
        }

        .sync-dot.synced {
          background: #10b981;
        }

        .sync-dot.syncing {
          background: #f59e0b;
          animation: pulse 1s infinite;
        }

        .sync-dot.local-only {
          background: #ef4444;
        }

        /* 2. Days Segmented Bar */
        .days-segmented-bar {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 4px;
        }

        .days-segmented-bar::-webkit-scrollbar {
          display: none;
        }

        .day-tab-pill {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(255, 255, 255, 0.7);
          font-family: inherit;
          min-width: 90px;
        }

        .day-tab-pill:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          transform: translateY(-2px);
        }

        .day-tab-pill.active {
          background: var(--day-bg);
          border-color: var(--day-color);
          box-shadow: 0 4px 18px var(--day-glow);
          color: #ffffff;
        }

        .day-pill-top {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .day-pill-name {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .today-badge {
          font-size: 0.65rem;
          font-weight: 800;
          background: #ef4444;
          color: #ffffff;
          padding: 1px 5px;
          border-radius: 999px;
          letter-spacing: 0.3px;
        }

        .day-pill-count {
          font-size: 0.75rem;
          opacity: 0.7;
          font-weight: 600;
        }

        .day-tab-pill.active .day-pill-count {
          color: var(--day-color);
          opacity: 1;
        }

        /* 3. Day Header Row */
        .day-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 0.5rem 0;
        }

        .day-title-block {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
        }

        .day-main-heading {
          font-size: 1.45rem;
          font-weight: 800;
          margin: 0;
          color: #ffffff;
        }

        .day-class-chip {
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.06);
          padding: 3px 10px;
          border-radius: 999px;
        }

        .day-controls-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-icon-btn.danger {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          font-size: 0.82rem;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .action-icon-btn.danger:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ffffff;
        }

        .action-pill-btn.add {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 0.88rem;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          transition: all 0.2s;
        }

        .action-pill-btn.add:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
        }

        .action-pill-btn.add.open {
          background: rgba(255, 255, 255, 0.1);
          box-shadow: none;
          border-color: rgba(255, 255, 255, 0.2);
        }

        /* 4. Collapsible Add Class Panel */
        .add-class-panel {
          background: linear-gradient(180deg, rgba(30, 30, 42, 0.95), rgba(20, 20, 28, 0.98));
          border: 1px solid rgba(59, 130, 246, 0.35);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.12);
          animation: slideDown 0.25s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 8px;
        }

        .panel-title-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .panel-icon {
          color: #60a5fa;
        }

        .panel-title {
          font-size: 1.15rem;
          font-weight: 800;
          margin: 0;
          color: #ffffff;
        }

        .panel-hint {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .presets-block {
          margin-bottom: 1rem;
        }

        .preset-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 6px;
        }

        .preset-chips-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
        }

        .preset-chips-scroll::-webkit-scrollbar {
          display: none;
        }

        .preset-chip {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.78rem;
          padding: 4px 10px;
          border-radius: 999px;
          white-space: nowrap;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .preset-chip:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: #ffffff;
        }

        .preset-chip.period {
          background: rgba(255, 255, 255, 0.04);
        }

        .form-inputs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 1.5rem;
        }

        .input-group.full {
          grid-column: 1 / -1;
        }

        .input-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 5px;
        }

        .input-label .req {
          color: #ef4444;
        }

        .custom-text-input {
          width: 100%;
          height: 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 0 14px;
          color: #ffffff;
          font-size: 0.92rem;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s;
        }

        .custom-text-input:focus {
          border-color: #3b82f6;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        .time-pick {
          color-scheme: dark;
        }

        .panel-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .cancel-form-btn {
          padding: 9px 18px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: rgba(255, 255, 255, 0.75);
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .cancel-form-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .submit-form-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 22px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .submit-form-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-form-btn:not(:disabled):hover {
          box-shadow: 0 4px 18px rgba(37, 99, 235, 0.5);
          transform: translateY(-1px);
        }

        /* 5. Classes Timeline */
        .classes-timeline-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-classes-card {
          text-align: center;
          padding: 3.5rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .empty-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          color: #ffffff;
        }

        .empty-desc {
          font-size: 0.92rem;
          color: rgba(255, 255, 255, 0.6);
          max-width: 440px;
          line-height: 1.5;
          margin: 0 0 1.5rem;
        }

        .empty-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 22px;
          background: rgba(59, 130, 246, 0.18);
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: #60a5fa;
          font-size: 0.9rem;
          font-weight: 700;
          border-radius: 999px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .empty-cta-btn:hover {
          background: rgba(59, 130, 246, 0.3);
          color: #ffffff;
        }

        .classes-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .class-item-card {
          background: linear-gradient(135deg, rgba(26, 26, 36, 0.9) 0%, rgba(18, 18, 24, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 4px solid var(--item-color);
          border-radius: 18px;
          padding: 1.15rem 1.4rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
        }

        .class-item-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.18);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
        }

        .class-item-card.is-ongoing {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 20, 28, 0.95) 100%);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3), 0 0 20px rgba(16, 185, 129, 0.18);
        }

        .period-index-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.72rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.7);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .class-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: var(--item-bg);
          border: 1px solid var(--item-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .class-emoji {
          font-size: 1.5rem;
        }

        .class-main-content {
          flex: 1;
          min-width: 0;
        }

        .class-top-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .subject-category-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--item-color);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .ongoing-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34d399;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 1px 7px;
          border-radius: 999px;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          animation: pulse 1.5s infinite;
        }

        .class-name-text {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0 0 6px;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .class-meta-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          font-size: 0.84rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .meta-item.time {
          color: #93c5fd;
        }

        .meta-item.room {
          color: #fcd34d;
        }

        .meta-item.teacher {
          color: rgba(255, 255, 255, 0.75);
        }

        .meta-icon {
          opacity: 0.8;
        }

        .class-item-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .trash-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .trash-btn:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }

        .timetable-loading-card {
          text-align: center;
          padding: 4rem 1rem;
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .timetable-spinner {
          width: 38px;
          height: 38px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive Mobile Adjustments */
        @media (max-width: 768px) {
          .live-status-card {
            padding: 1.25rem;
          }

          .status-content-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .status-side-actions {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding-top: 0.75rem;
          }

          .form-inputs-grid {
            grid-template-columns: 1fr;
          }

          .class-item-card {
            padding: 1rem;
            gap: 0.85rem;
          }

          .period-index-badge {
            display: none;
          }

          .class-icon-box {
            width: 42px;
            height: 42px;
          }

          .class-name-text {
            font-size: 1.05rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MyTimetable;
