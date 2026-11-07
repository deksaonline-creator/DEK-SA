import React, { useState, useEffect } from 'react';
import { 
  getActiveUser, 
  setActiveUser, 
  getAllMockProfiles,
  joinCourseByCode
} from '../../services/assignmentService';
import { 
  Users, KeyRound, PlusCircle, BookPlus, 
  Sparkles, ShieldCheck, Check, AlertCircle 
} from 'lucide-react';

export default function AssignmentRoleBar({ onActionTriggered }) {
  const [activeUser, setActiveUserState] = useState(getActiveUser());
  const [profiles, setProfiles] = useState(getAllMockProfiles());
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinStatus, setJoinStatus] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    const handleUserChange = (e) => {
      setActiveUserState(e.detail);
    };
    window.addEventListener('assignment-user-changed', handleUserChange);
    return () => window.removeEventListener('assignment-user-changed', handleUserChange);
  }, []);

  const handleSwitchUser = (userId) => {
    const selected = profiles.find(p => p.id === userId);
    if (selected) {
      setActiveUser(selected);
      setActiveUserState(selected);
      if (onActionTriggered) onActionTriggered('user-switched');
    }
  };

  const handleJoinCourse = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoinStatus({ loading: true, error: null, success: null });

    try {
      const res = await joinCourseByCode(joinCodeInput, activeUser);
      setJoinStatus({ loading: false, error: null, success: res.message });
      setJoinCodeInput('');
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinStatus({ loading: false, error: null, success: null });
        if (onActionTriggered) onActionTriggered('course-joined');
      }, 1200);
    } catch (err) {
      setJoinStatus({ loading: false, error: err.message, success: null });
    }
  };

  return (
    <>
      <div className="asg-role-bar">
        {/* Left: User Info */}
        <div className="asg-role-user">
          <img 
            src={activeUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
            alt={activeUser.first_name}
            className="asg-user-avatar"
          />
          <div className="asg-user-meta">
            <div className="asg-user-name">
              {activeUser.role === 'teacher' ? `อ.${activeUser.first_name} ${activeUser.last_name}` : `${activeUser.first_name} ${activeUser.last_name}`}
              <span className={`asg-role-badge ${activeUser.role}`}>
                {activeUser.role === 'teacher' ? 'ครูผู้สอน' : activeUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'นักเรียน'}
              </span>
            </div>
            <span className="asg-user-sub">
              {activeUser.student_id ? `รหัส: ${activeUser.student_id} • ` : ''}{activeUser.grade_level || 'ระบบส่งงานออนไลน์'}
            </span>
          </div>
        </div>

        {/* Right: Role Switcher & Quick Actions */}
        <div className="asg-role-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>สลับมุมมอง:</span>
            <select 
              className="asg-role-select"
              value={activeUser.id}
              onChange={(e) => handleSwitchUser(e.target.value)}
              title="สลับบัญชีผู้ใช้เพื่อทดสอบทั้งมุมมองนักเรียนและมุมมองครู"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.role === 'teacher' ? `[ครู] อ.${p.first_name}` : `[นักเรียน] ${p.first_name} (${p.student_id || p.grade_level})`}
                </option>
              ))}
            </select>
          </div>

          {activeUser.role === 'student' ? (
            <button 
              type="button" 
              className="asg-btn-secondary"
              onClick={() => setShowJoinModal(true)}
            >
              <KeyRound size={16} color="#60a5fa" />
              <span>เข้าร่วมด้วยรหัส</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="asg-btn-secondary"
                onClick={() => onActionTriggered && onActionTriggered('open-create-course')}
              >
                <BookPlus size={16} color="#34d399" />
                <span>สร้างรายวิชา</span>
              </button>
              <button 
                type="button" 
                className="asg-btn-primary"
                onClick={() => onActionTriggered && onActionTriggered('open-create-assignment')}
              >
                <PlusCircle size={16} />
                <span>มอบหมายงาน</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Join Course with Code */}
      {showJoinModal && (
        <div className="asg-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="asg-modal-card" onClick={e => e.stopPropagation()}>
            <div className="asg-modal-header">
              <h3>
                <KeyRound size={20} color="#60a5fa" />
                เข้าร่วมห้องเรียนด้วยรหัส
              </h3>
              <button 
                type="button" 
                className="asg-modal-close" 
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
                กรอกรหัสเข้าร่วมห้องเรียน 6 หลักที่ได้รับจากครูผู้สอน (เช่น <code>CS401A</code> หรือ <code>WEB502</code>)
              </p>

              <div className="asg-form-group">
                <input 
                  type="text" 
                  maxLength={8}
                  placeholder="เช่น CS401A"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="asg-form-input"
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '4px', fontWeight: 700 }}
                  autoFocus
                />
              </div>

              {joinStatus.error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.6rem 0.8rem', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  {joinStatus.error}
                </div>
              )}

              {joinStatus.success && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.6rem 0.8rem', borderRadius: '10px', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={16} />
                  {joinStatus.success}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="asg-btn-secondary" 
                  onClick={() => setShowJoinModal(false)}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="asg-btn-primary" 
                  disabled={joinStatus.loading || !joinCodeInput.trim()}
                >
                  {joinStatus.loading ? 'กำลังตรวจสอบ...' : 'เข้าร่วมห้องเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
