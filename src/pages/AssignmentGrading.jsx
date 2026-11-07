import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { 
  getAssignmentById, 
  gradeSubmission, 
  getActiveUser 
} from '../services/assignmentService';
import { 
  formatThaiDateShort, 
  calculateSubmissionDelay 
} from '../utils/thaiDate';
import { 
  getFileTypeCategory, 
  formatBytes 
} from '../utils/fileHelpers';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, 
  Save, Download, Eye, Award, MessageSquare, 
  Clock, AlertTriangle, FileText, Check, Search
} from 'lucide-react';
import '../components/assignment/Assignment.css';

export default function AssignmentGrading() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStudentId = searchParams.get('student');

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubIndex, setActiveSubIndex] = useState(0);

  // Grading form state
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Student list filter
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'ungraded', 'graded'
  const [searchQuery, setSearchQuery] = useState('');

  const quickComments = [
    'ทำงานเรียบร้อยดีมาก ลายมืออ่านง่าย',
    'เนื้อหาถูกต้อง ครบถ้วนตามโจทย์',
    'ออกแบบผังงานถูกต้องตามมาตรฐานดีเยี่ยม',
    'ขอให้ปรับปรุงและแก้ไขข้อที่ผิดแล้วส่งใหม่',
    'ส่งงานตรงเวลา มีความคิดสร้างสรรค์ดี'
  ];

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAssignmentById(id, getActiveUser());
      setAssignment(data);

      const subs = data?.all_submissions || [];
      if (initialStudentId && subs.length > 0) {
        const foundIdx = subs.findIndex(s => s.student_id === initialStudentId);
        if (foundIdx >= 0) setActiveSubIndex(foundIdx);
      }
    } catch (err) {
      console.error('Error loading grading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const allSubs = assignment?.all_submissions || [];
  const activeSub = allSubs[activeSubIndex] || null;

  // Sync grading form when active student changes
  useEffect(() => {
    if (activeSub) {
      setScoreInput(activeSub.grade ? activeSub.grade.score.toString() : '');
      setFeedbackInput(activeSub.grade ? activeSub.grade.feedback : '');
      setActiveFileIndex(0);
      setSaveSuccess(false);
    }
  }, [activeSubIndex, activeSub]);

  const handleSaveGrade = async () => {
    if (!activeSub) return;
    const numScore = parseFloat(scoreInput);
    if (isNaN(numScore) || numScore < 0 || numScore > assignment.max_score) {
      alert(`กรุณากรอกคะแนนระหว่าง 0 ถึง ${assignment.max_score}`);
      return;
    }

    setSaving(true);
    try {
      await gradeSubmission(activeSub.id, numScore, feedbackInput, getActiveUser());
      setSaving(false);
      setSaveSuccess(true);
      loadData();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaving(false);
      alert(err.message || 'บันทึกคะแนนไม่สำเร็จ');
    }
  };

  const handleNextStudent = () => {
    if (activeSubIndex < allSubs.length - 1) {
      setActiveSubIndex(prev => prev + 1);
    }
  };

  const handlePrevStudent = () => {
    if (activeSubIndex > 0) {
      setActiveSubIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ textAlign: 'center', padding: '6rem 0', color: '#a1a1aa' }}>
          กำลังเปิดห้องตรวจงาน...
        </div>
      </div>
    );
  }

  if (!assignment || allSubs.length === 0) {
    return (
      <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div className="asg-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2>ยังไม่มีนักเรียนส่งงานในชิ้นนี้</h2>
          <p style={{ color: '#a1a1aa', margin: '1rem 0 2rem' }}>
            {assignment?.title}
          </p>
          <button type="button" className="asg-btn-primary" onClick={() => navigate(`/assignments/${id}`)}>
            กลับหน้ารายละเอียดการบ้าน
          </button>
        </div>
      </div>
    );
  }

  const activeFile = activeSub?.files?.[activeFileIndex] || null;
  const delayInfo = activeSub ? calculateSubmissionDelay(activeSub.submitted_at, assignment.due_date) : { isLate: false, text: '' };

  const filteredSubs = allSubs.filter(s => {
    if (filterMode === 'ungraded' && s.status === 'graded') return false;
    if (filterMode === 'graded' && s.status !== 'graded') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.student_name.toLowerCase().includes(q) || s.student_code.includes(q);
    }
    return true;
  });

  return (
    <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Top Bar for Grading Room */}
      <div style={{ background: '#16171d', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            type="button" 
            className="asg-btn-secondary" 
            onClick={() => navigate(`/assignments/${id}`)}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            <span>ออกจากการตรวจ</span>
          </button>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>{assignment.course_code} {assignment.course_name}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>ห้องตรวจงาน: {assignment.title}</div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
            คนที่ {activeSubIndex + 1} จาก {allSubs.length} คน
          </span>
          <button 
            type="button" 
            className="asg-btn-secondary" 
            onClick={handlePrevStudent} 
            disabled={activeSubIndex === 0}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button" 
            className="asg-btn-secondary" 
            onClick={handleNextStudent} 
            disabled={activeSubIndex === allSubs.length - 1}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 3-Pane Grading Workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 340px', minHeight: 'calc(100vh - 130px)', background: '#0b0c10' }}>
        
        {/* PANE 1: Left Roster List */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(22, 23, 29, 0.5)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ / รหัส..."
                className="asg-search-input"
                style={{ padding: '0.5rem 0.75rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                type="button" 
                className={`asg-tab-btn ${filterMode === 'all' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => setFilterMode('all')}
              >
                ทั้งหมด ({allSubs.length})
              </button>
              <button 
                type="button" 
                className={`asg-tab-btn ${filterMode === 'ungraded' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => setFilterMode('ungraded')}
              >
                รอตรวจ ({allSubs.filter(s => s.status !== 'graded').length})
              </button>
              <button 
                type="button" 
                className={`asg-tab-btn ${filterMode === 'graded' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => setFilterMode('graded')}
              >
                ตรวจแล้ว ({allSubs.filter(s => s.status === 'graded').length})
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filteredSubs.map((sub) => {
              const realIdx = allSubs.findIndex(s => s.id === sub.id);
              const isSelected = realIdx === activeSubIndex;

              return (
                <div 
                  key={sub.id} 
                  onClick={() => setActiveSubIndex(realIdx)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    marginBottom: '0.4rem',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(66, 135, 245, 0.18)' : 'transparent',
                    border: isSelected ? '1px solid rgba(66, 135, 245, 0.4)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isSelected ? '#60a5fa' : '#fff' }}>
                      {sub.student_code} {sub.student_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                      {sub.files?.length || 0} ไฟล์ • {formatThaiDateShort(sub.submitted_at, false)}
                    </div>
                  </div>

                  <div>
                    {sub.status === 'graded' ? (
                      <span className="asg-status-chip graded" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                        {sub.grade.score}
                      </span>
                    ) : (
                      <span className="asg-status-chip submitted" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                        รอ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANE 2: Center Document Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#0e0f14', overflow: 'hidden' }}>
          {/* File Switcher Tabs */}
          {activeSub?.files && activeSub.files.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', background: '#16171d', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0.5rem 1rem', overflowX: 'auto' }}>
              {activeSub.files.map((file, idx) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFileIndex(idx)}
                  className={`asg-tab-btn ${activeFileIndex === idx ? 'active' : ''}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                >
                  <FileText size={14} />
                  <span>{file.file_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Viewer Area */}
          <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
            {activeFile ? (
              getFileTypeCategory(activeFile.file_name) === 'image' ? (
                <img 
                  src={activeFile.file_url} 
                  alt={activeFile.file_name} 
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                />
              ) : getFileTypeCategory(activeFile.file_name) === 'pdf' ? (
                <iframe 
                  src={activeFile.file_url} 
                  title={activeFile.file_name}
                  style={{ width: '100%', height: '100%', minHeight: '550px', border: 'none', borderRadius: '10px' }}
                />
              ) : (
                <div style={{ textAlign: 'center', background: 'rgba(22, 23, 29, 0.7)', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <FileText size={54} color="#60a5fa" style={{ marginBottom: '1rem' }} />
                  <h3>{activeFile.file_name}</h3>
                  <p style={{ color: '#a1a1aa', margin: '0.5rem 0 1.5rem' }}>ขนาด: {formatBytes(activeFile.file_size)}</p>
                  <a href={activeFile.file_url} download className="asg-btn-primary">
                    <Download size={16} />
                    <span>ดาวน์โหลดไฟล์นี้เพื่อเปิดดู</span>
                  </a>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', color: '#71717a' }}>
                <FileText size={48} style={{ marginBottom: '0.75rem' }} />
                <p>นักเรียนไม่ได้แนบไฟล์สำหรับการส่งงานชิ้นนี้</p>
              </div>
            )}

            {/* Student Note Banner */}
            {activeSub?.note && (
              <div style={{ width: '100%', marginTop: '1rem', background: 'rgba(22, 23, 29, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={14} />
                  ข้อความจากนักเรียน:
                </div>
                <div style={{ color: '#e4e4e7', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {activeSub.note}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANE 3: Right Grading & Feedback Panel */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#16171d', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          
          {/* Student Profile Card */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              {activeSub?.student_code} {activeSub?.student_name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '0.2rem' }}>
              ส่งเมื่อ: {formatThaiDateShort(activeSub?.submitted_at)}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className={`asg-status-chip ${delayInfo.isLate ? 'late' : 'submitted'}`} style={{ fontSize: '0.75rem' }}>
                {delayInfo.isLate ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                {delayInfo.text}
              </span>
            </div>
          </div>

          {/* Score Input */}
          <div className="asg-form-group">
            <label className="asg-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>คะแนนที่ได้ *</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>เต็ม {assignment.max_score} คะแนน</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="number"
                step="0.5"
                min="0"
                max={assignment.max_score}
                placeholder="เช่น 9.5"
                className="asg-form-input"
                style={{ fontSize: '1.4rem', fontWeight: 700, textAlign: 'center' }}
                value={scoreInput}
                onChange={e => setScoreInput(e.target.value)}
              />
              <span style={{ fontSize: '1.1rem', color: '#a1a1aa' }}>/ {assignment.max_score}</span>
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="asg-form-group">
            <label className="asg-form-label">คำแนะนำและข้อเสนอแนะ (Feedback)</label>
            <textarea 
              rows={4}
              placeholder="พิมพ์คำแนะนำ หรือเลือกจากข้อความสำเร็จรูปด้านล่าง..."
              className="asg-form-textarea"
              value={feedbackInput}
              onChange={e => setFeedbackInput(e.target.value)}
            />
          </div>

          {/* Quick Comment Pills */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '0.5rem' }}>
              ข้อความสำเร็จรูป (คลิกเพื่อใส่):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {quickComments.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFeedbackInput(prev => prev ? `${prev} ${c}` : c)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.35rem 0.6rem',
                    color: '#d4d4d8',
                    fontSize: '0.78rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(66, 135, 245, 0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>

          {/* Save & Next Buttons */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {saveSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.5rem', borderRadius: '8px', color: '#34d399', fontSize: '0.82rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Check size={14} />
                บันทึกคะแนนเรียบร้อยแล้ว
              </div>
            )}

            <button 
              type="button" 
              className="asg-btn-primary" 
              style={{ justifyContent: 'center', padding: '0.75rem' }}
              onClick={handleSaveGrade}
              disabled={saving || !scoreInput}
            >
              <Save size={16} />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}</span>
            </button>

            <button 
              type="button" 
              className="asg-btn-secondary" 
              style={{ justifyContent: 'center', padding: '0.65rem' }}
              onClick={() => {
                handleSaveGrade();
                handleNextStudent();
              }}
              disabled={activeSubIndex === allSubs.length - 1}
            >
              <span>บันทึกและตรวจคนถัดไป &gt;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
