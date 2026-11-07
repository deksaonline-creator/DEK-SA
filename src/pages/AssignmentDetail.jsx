import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AssignmentRoleBar from '../components/assignment/AssignmentRoleBar';
import { 
  getAssignmentById, 
  submitAssignment, 
  downloadAllSubmissionsZip, 
  getActiveUser 
} from '../services/assignmentService';
import { 
  formatThaiDateFull, 
  formatThaiDateShort, 
  getTimeRemaining, 
  calculateSubmissionDelay 
} from '../utils/thaiDate';
import { 
  validateUploadFile, 
  formatBytes, 
  getFileExtension, 
  getFileTypeCategory, 
  getFileColor 
} from '../utils/fileHelpers';
import { 
  ArrowLeft, Clock, Award, FileText, Download, 
  UploadCloud, CheckCircle2, AlertTriangle, Paperclip, 
  Trash2, ExternalLink, Archive, Eye, Send, RotateCcw,
  Users, Check, MessageSquare
} from 'lucide-react';
import '../components/assignment/Assignment.css';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState(getActiveUser());
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student upload state
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [studentNote, setStudentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // File Preview Modal
  const [previewFile, setPreviewFile] = useState(null);

  // ZIP Download state
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    loadAssignment();
    const handleUserChange = (e) => {
      setActiveUser(e.detail);
      loadAssignment(e.detail);
    };
    window.addEventListener('assignment-user-changed', handleUserChange);
    return () => window.removeEventListener('assignment-user-changed', handleUserChange);
  }, [id]);

  const loadAssignment = async (user = getActiveUser()) => {
    setLoading(true);
    try {
      const data = await getAssignmentById(id, user);
      setAssignment(data);
    } catch (err) {
      console.error('Error fetching assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = (files) => {
    const validFiles = [];
    for (const f of Array.from(files)) {
      const val = validateUploadFile(f);
      if (!val.valid) {
        setSubmitError(val.error);
        return;
      }
      validFiles.push(f);
    }
    setSubmitError(null);
    setFilesToUpload(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (filesToUpload.length === 0 && !studentNote.trim()) {
      setSubmitError('กรุณาแนบไฟล์งานอย่างน้อย 1 ไฟล์ หรือระบุข้อความคำตอบ');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitAssignment(id, filesToUpload, studentNote, activeUser);
      setSubmitting(false);
      setSubmitSuccess(true);
      setFilesToUpload([]);
      loadAssignment();
    } catch (err) {
      setSubmitting(false);
      setSubmitError(err.message || 'ส่งงานไม่สำเร็จ');
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      await downloadAllSubmissionsZip(id);
    } catch (err) {
      alert(err.message || 'ดาวน์โหลด ZIP ไม่สำเร็จ');
    } finally {
      setDownloadingZip(false);
    }
  };

  if (loading) {
    return (
      <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ textAlign: 'center', padding: '6rem 0', color: '#a1a1aa' }}>
          กำลังโหลดรายละเอียดชิ้นงาน...
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div className="asg-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2>ไม่พบข้อมูลการบ้าน</h2>
          <p style={{ color: '#a1a1aa', margin: '1rem 0 2rem' }}>การบ้านชิ้นนี้อาจถูกลบหรือไม่มีอยู่ในระบบ</p>
          <button type="button" className="asg-btn-primary" onClick={() => navigate('/assignments')}>
            กลับหน้ารวมการบ้าน
          </button>
        </div>
      </div>
    );
  }

  const isStudent = activeUser.role === 'student';
  const mySub = assignment.my_submission;
  const timeRemain = getTimeRemaining(assignment.due_date);
  const allSubs = assignment.all_submissions || [];

  return (
    <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="asg-container">
        <AssignmentRoleBar onActionTriggered={() => loadAssignment()} />

        {/* Top Back Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button 
            type="button" 
            className="asg-btn-secondary" 
            onClick={() => navigate('/assignments')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            <span>กลับหน้ารายการ</span>
          </button>

          <span style={{ color: '#71717a' }}>/</span>
          <span style={{ color: '#60a5fa', fontWeight: 500, fontSize: '0.9rem' }}>
            {assignment.course?.code || assignment.course_code} {assignment.course?.name || assignment.course_name}
          </span>
        </div>

        {/* Assignment Header Banner */}
        <div style={{ background: 'rgba(22, 23, 29, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="asg-course-pill">
                  {assignment.course?.code || 'ว30101'}
                </span>
                <span className={`asg-due-pill ${timeRemain.urgency}`}>
                  <Clock size={12} />
                  {timeRemain.text}
                </span>
                {!assignment.allow_late && (
                  <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.15rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                    ไม่อนุญาตส่งช้า
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.5rem' }}>
                {assignment.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#a1a1aa', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                <span>กำหนดส่ง: <strong style={{ color: '#fff' }}>{formatThaiDateFull(assignment.due_date)}</strong></span>
                <span>•</span>
                <span>ผู้สั่งงาน: {assignment.course?.teacher_name || 'อาจารย์ประจำวิชา'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>คะแนนเต็ม</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
                {assignment.max_score} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#a1a1aa' }}>คะแนน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout (2 Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'flex-start' }}>
          
          {/* Left Column: Assignment Details & Teacher Attachments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Description */}
            <div style={{ background: 'rgba(22, 23, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#4287f5" />
                คำอธิบายและข้อกำหนด
              </h3>

              <div style={{ fontSize: '0.95rem', color: '#e4e4e7', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {assignment.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับงานชิ้นนี้'}
              </div>
            </div>

            {/* Teacher Attached Files */}
            {assignment.files && assignment.files.length > 0 && (
              <div style={{ background: 'rgba(22, 23, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Paperclip size={18} color="#4287f5" />
                  ไฟล์คำสั่งงาน / เอกสารประกอบ ({assignment.files.length} ไฟล์)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {assignment.files.map((file) => {
                    const cat = getFileTypeCategory(file.file_name);
                    const color = getFileColor(cat);

                    return (
                      <div key={file.id} className="asg-file-item">
                        <div className="asg-file-left">
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                            <FileText size={20} />
                          </div>
                          <div className="asg-file-meta">
                            <span className="asg-file-name">{file.file_name}</span>
                            <span className="asg-file-size">{formatBytes(file.file_size)}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            type="button" 
                            className="asg-btn-secondary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye size={14} />
                            <span>ดูตัวอย่าง</span>
                          </button>

                          <a 
                            href={file.file_url} 
                            download={file.file_name}
                            target="_blank"
                            rel="noreferrer"
                            className="asg-btn-secondary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Submission View (For Student) OR Grading Dashboard (For Teacher) */}
          <div>
            {isStudent ? (
              /* STUDENT SUBMISSION PANEL */
              <div style={{ background: 'rgba(22, 23, 29, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UploadCloud size={20} color="#4287f5" />
                    การส่งงานของคุณ
                  </span>

                  {mySub && (
                    <span className={`asg-status-chip ${mySub.status}`}>
                      {mySub.status === 'graded' ? 'ตรวจแล้ว' : mySub.status === 'late' ? 'ส่งช้า' : 'ส่งแล้ว'}
                    </span>
                  )}
                </h3>

                {/* If Graded */}
                {mySub?.grade && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.88rem', color: '#6ee7b7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={16} />
                        ผลการให้คะแนน
                      </span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                        {mySub.grade.score} <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>/ {assignment.max_score}</span>
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', color: '#e4e4e7', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '10px', marginTop: '0.5rem' }}>
                      <strong>ความคิดเห็นจากครูผู้สอน:</strong>
                      <p style={{ marginTop: '0.25rem', color: '#d4d4d8' }}>{mySub.grade.feedback || 'ไม่มีข้อเสนอแนะเพิ่มเติม'}</p>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.5rem', textAlign: 'right' }}>
                      ตรวจเมื่อ {formatThaiDateShort(mySub.grade.graded_at)} โดย {mySub.grade.graded_by_name}
                    </div>
                  </div>
                )}

                {/* If already submitted */}
                {mySub ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#93c5fd', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                        <CheckCircle2 size={16} />
                        ส่งงานเรียบร้อยแล้ว
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                        บันทึกเมื่อ: {formatThaiDateShort(mySub.submitted_at)}
                        {mySub.status === 'late' && (
                          <span style={{ color: '#fbbf24', marginLeft: '0.5rem' }}>
                            (ส่งช้ากว่ากำหนด)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Submitted Files List */}
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>
                        ไฟล์ที่คุณอัปโหลดไว้ ({mySub.files?.length || 0} ไฟล์):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {mySub.files?.map(f => (
                          <div key={f.id} className="asg-file-item">
                            <div className="asg-file-left">
                              <FileText size={18} color="#60a5fa" />
                              <span className="asg-file-name">{f.file_name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button 
                                type="button" 
                                className="asg-btn-secondary" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                onClick={() => setPreviewFile(f)}
                              >
                                <Eye size={13} />
                              </button>
                              <a 
                                href={f.file_url} 
                                download={f.file_name} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="asg-btn-secondary" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                <Download size={13} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Student note */}
                    {mySub.note && (
                      <div style={{ fontSize: '0.85rem', color: '#a1a1aa', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '10px' }}>
                        <strong>ข้อความที่คุณแนบส่ง:</strong>
                        <p style={{ color: '#e4e4e7', marginTop: '0.2rem' }}>{mySub.note}</p>
                      </div>
                    )}

                    {/* Resubmit button if not graded yet */}
                    {mySub.status !== 'graded' && (
                      <button 
                        type="button" 
                        className="asg-btn-secondary" 
                        style={{ marginTop: '0.5rem', justifyContent: 'center' }}
                        onClick={() => {
                          if (confirm('ต้องการยกเลิกการส่งเพื่ออัปโหลดไฟล์ใหม่ใช่หรือไม่?')) {
                            // Reset submission
                            setFilesToUpload([]);
                            setStudentNote(mySub.note || '');
                            assignment.my_submission = null;
                            setAssignment({ ...assignment });
                          }
                        }}
                      >
                        <RotateCcw size={15} />
                        <span>ยกเลิกการส่งและส่งใหม่ (Resubmit)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* UPLOAD FORM */
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {submitError && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.6rem 0.8rem', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={16} />
                        {submitError}
                      </div>
                    )}

                    {timeRemain.isOverdue && !assignment.allow_late && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.8rem', borderRadius: '12px', color: '#fca5a5', fontSize: '0.88rem' }}>
                        การบ้านชิ้นนี้เลยกำหนดส่งแล้ว และไม่อนุญาตให้ส่งล่าช้า
                      </div>
                    )}

                    {/* Drag and Drop Zone */}
                    <div 
                      className={`asg-dropzone ${isDragging ? 'dragging' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('student-file-input').click()}
                    >
                      <input 
                        id="student-file-input"
                        type="file" 
                        multiple 
                        style={{ display: 'none' }}
                        onChange={(e) => handleFilesSelected(e.target.files)}
                      />
                      <UploadCloud size={36} className="asg-dropzone-icon" />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                        ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                        รองรับ PDF, Word, Excel, PPT, รูปภาพ, ZIP (สูงสุด 20 MB/ไฟล์)
                      </div>
                    </div>

                    {/* Files To Upload List */}
                    {filesToUpload.length > 0 && (
                      <div className="asg-uploaded-list">
                        <div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
                          ไฟล์ที่เลือกไว้ ({filesToUpload.length} ไฟล์):
                        </div>
                        {filesToUpload.map((f, i) => (
                          <div key={i} className="asg-file-item">
                            <div className="asg-file-left">
                              <FileText size={18} color="#60a5fa" />
                              <div className="asg-file-meta">
                                <span className="asg-file-name">{f.name}</span>
                                <span className="asg-file-size">{formatBytes(f.size)}</span>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveFile(i)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Optional Note to Teacher */}
                    <div className="asg-form-group">
                      <label className="asg-form-label">ข้อความเพิ่มเติมถึงครูผู้สอน (ถ้ามี)</label>
                      <textarea 
                        className="asg-form-textarea"
                        rows={2}
                        placeholder="เช่น ส่งใบงานข้อ 1-5 ครบถ้วนครับ..."
                        value={studentNote}
                        onChange={e => setStudentNote(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="asg-btn-primary" 
                      style={{ justifyContent: 'center', padding: '0.85rem 1rem' }}
                      disabled={submitting || (timeRemain.isOverdue && !assignment.allow_late)}
                    >
                      <Send size={16} />
                      <span>{submitting ? 'กำลังส่งงาน...' : 'ยืนยันการส่งงาน'}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* TEACHER MANAGEMENT & SUBMISSION ROSTER PANEL */
              <div style={{ background: 'rgba(22, 23, 29, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="#a78bfa" />
                    สถานะการส่งงานของนักเรียน
                  </h3>

                  <button 
                    type="button" 
                    className="asg-btn-secondary"
                    onClick={handleDownloadZip}
                    disabled={downloadingZip || allSubs.length === 0}
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                    title="ดาวน์โหลดไฟล์ที่นักเรียนส่งทุกคนรวมเป็นไฟล์ ZIP เดียว"
                  >
                    <Archive size={16} color="#fbbf24" />
                    <span>{downloadingZip ? 'กำลังสร้าง ZIP...' : 'ดาวน์โหลดทั้งหมด (.ZIP)'}</span>
                  </button>
                </div>

                {/* Teacher Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#60a5fa' }}>{allSubs.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>ส่งแล้ว (คน)</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>
                      {allSubs.filter(s => s.status === 'graded').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>ตรวจแล้ว</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>
                      {allSubs.filter(s => s.status !== 'graded').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>รอตรวจ</div>
                  </div>
                </div>

                {/* Submissions Roster List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {allSubs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#71717a', fontSize: '0.9rem' }}>
                      ยังไม่มีนักเรียนส่งงานในชิ้นนี้
                    </div>
                  ) : (
                    allSubs.map((sub) => (
                      <div 
                        key={sub.id} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.8rem 1rem' }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff' }}>
                            {sub.student_code} {sub.student_name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                            <span>ส่งเมื่อ: {formatThaiDateShort(sub.submitted_at)}</span>
                            {sub.status === 'late' && <span style={{ color: '#fbbf24' }}>(ส่งช้า)</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {sub.status === 'graded' ? (
                            <span className="asg-status-chip graded">
                              {sub.grade.score}/{assignment.max_score}
                            </span>
                          ) : (
                            <span className="asg-status-chip submitted">
                              รอตรวจ
                            </span>
                          )}

                          <button 
                            type="button" 
                            className="asg-btn-primary" 
                            style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => navigate(`/assignments/${assignment.id}/grading?student=${sub.student_id}`)}
                          >
                            <span>ตรวจงาน</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {allSubs.length > 0 && (
                  <button 
                    type="button" 
                    className="asg-btn-primary" 
                    style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
                    onClick={() => navigate(`/assignments/${assignment.id}/grading`)}
                  >
                    <span>เข้าสู่หน้าจอห้องตรวจงาน (Grading Console)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Inline File Preview Modal */}
      {previewFile && (
        <div className="asg-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="asg-modal-card" style={{ maxWidth: '850px', height: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className="asg-modal-header">
              <h3 style={{ fontSize: '1.1rem' }}>
                <Eye size={18} color="#4287f5" />
                {previewFile.file_name}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a 
                  href={previewFile.file_url} 
                  download={previewFile.file_name}
                  target="_blank" 
                  rel="noreferrer" 
                  className="asg-btn-secondary" 
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                >
                  <Download size={14} />
                  <span>ดาวน์โหลด</span>
                </a>
                <button type="button" className="asg-modal-close" onClick={() => setPreviewFile(null)}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0c10', borderRadius: '12px' }}>
              {getFileTypeCategory(previewFile.file_name) === 'image' ? (
                <img 
                  src={previewFile.file_url} 
                  alt={previewFile.file_name} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : getFileTypeCategory(previewFile.file_name) === 'pdf' ? (
                <iframe 
                  src={previewFile.file_url} 
                  title={previewFile.file_name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <FileText size={48} color="#71717a" style={{ marginBottom: '1rem' }} />
                  <p style={{ color: '#e4e4e7', marginBottom: '1rem' }}>ไฟล์ประเภทนี้ไม่สามารถแสดงตัวอย่างบนเว็บเบราว์เซอร์ได้โดยตรง</p>
                  <a href={previewFile.file_url} download className="asg-btn-primary">
                    <Download size={16} />
                    <span>ดาวน์โหลดเพื่อเปิดด้วยโปรแกรมในเครื่อง</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
