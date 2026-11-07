import React, { useState, useEffect } from 'react';
import { createAssignment, getCourses, getActiveUser } from '../../services/assignmentService';
import { validateUploadFile, formatBytes, getFileExtension } from '../../utils/fileHelpers';
import { PlusCircle, Paperclip, X, AlertCircle, FileText } from 'lucide-react';

export default function CreateAssignmentModal({ isOpen, onClose, onCreated, defaultCourseId = null }) {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [formData, setFormData] = useState({
    course_id: defaultCourseId || '',
    title: '',
    description: '',
    due_date: '',
    max_score: 10,
    allow_late: true,
    status: 'published'
  });
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCourses();
      // Set default due date to 7 days from now at 23:59
      const d = new Date();
      d.setDate(d.getDate() + 7);
      d.setHours(23, 59, 0, 0);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      
      setFormData(prev => ({
        ...prev,
        course_id: defaultCourseId || prev.course_id,
        due_date: localISOTime
      }));
    }
  }, [isOpen, defaultCourseId]);

  const loadCourses = async () => {
    setLoadingCourses(true);
    const data = await getCourses(getActiveUser());
    setCourses(data || []);
    if (!formData.course_id && data && data.length > 0) {
      setFormData(prev => ({ ...prev, course_id: data[0].id }));
    }
    setLoadingCourses(false);
  };

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    for (const f of files) {
      const val = validateUploadFile(f);
      if (!val.valid) {
        setError(val.error);
        return;
      }
    }
    setError(null);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('กรุณากรอกหัวข้อชิ้นงาน / การบ้าน');
      return;
    }
    if (!formData.course_id) {
      setError('กรุณาเลือกรายวิชา');
      return;
    }
    if (!formData.due_date) {
      setError('กรุณาระบุกำหนดส่งงาน');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newAsg = await createAssignment(formData, attachedFiles);
      setLoading(false);
      if (onCreated) onCreated(newAsg);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'เกิดข้อผิดพลาดในการมอบหมายงาน');
    }
  };

  return (
    <div className="asg-modal-overlay" onClick={onClose}>
      <div className="asg-modal-card" onClick={e => e.stopPropagation()}>
        <div className="asg-modal-header">
          <h3>
            <PlusCircle size={22} color="#4287f5" />
            มอบหมายงานใหม่ (สร้างการบ้าน)
          </h3>
          <button type="button" className="asg-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.6rem 0.8rem', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="asg-form-group">
            <label className="asg-form-label">เลือกรายวิชา *</label>
            <select 
              className="asg-form-select"
              value={formData.course_id}
              onChange={e => setFormData({ ...formData, course_id: e.target.value })}
              required
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="asg-form-group">
            <label className="asg-form-label">ชื่อชิ้นงาน / หัวข้อการบ้าน *</label>
            <input 
              type="text" 
              required
              placeholder="เช่น ใบงานที่ 3: การเขียนโปรแกรมแบบมีเงื่อนไข (If-Else)"
              className="asg-form-input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="asg-form-group">
            <label className="asg-form-label">คำสั่งงาน / รายละเอียดคำแนะนำ</label>
            <textarea 
              placeholder="ระบุข้อกำหนด สิ่งที่นักเรียนต้องทำ รูปแบบไฟล์ที่ต้องการ หรือเกณฑ์การให้คะแนน..."
              className="asg-form-textarea"
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
            <div className="asg-form-group">
              <label className="asg-form-label">กำหนดส่ง (วันและเวลา) *</label>
              <input 
                type="datetime-local" 
                required
                className="asg-form-input"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="asg-form-group">
              <label className="asg-form-label">คะแนนเต็ม *</label>
              <input 
                type="number" 
                step="0.5"
                min="1"
                max="100"
                required
                className="asg-form-input"
                value={formData.max_score}
                onChange={e => setFormData({ ...formData, max_score: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
            <input 
              type="checkbox" 
              id="allow_late_cb"
              checked={formData.allow_late}
              onChange={e => setFormData({ ...formData, allow_late: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4287f5' }}
            />
            <label htmlFor="allow_late_cb" style={{ fontSize: '0.9rem', color: '#e4e4e7', cursor: 'pointer' }}>
              อนุญาตให้นักเรียนส่งงานล่าช้าได้ (ระบบจะติดป้าย <strong>"ส่งช้า"</strong> อัตโนมัติ)
            </label>
          </div>

          {/* Attach Teacher Files */}
          <div className="asg-form-group">
            <label className="asg-form-label">แนบไฟล์คำสั่งงาน / แบบฝึกหัด (สูงสุด 20MB ต่อไฟล์)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label className="asg-btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <Paperclip size={16} />
                <span>เพิ่มไฟล์แนบ</span>
                <input 
                  type="file" 
                  multiple 
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                {attachedFiles.length > 0 ? `แนบแล้ว ${attachedFiles.length} ไฟล์` : 'รองรับ PDF, Word, Excel, รูปภาพ, ZIP'}
              </span>
            </div>

            {attachedFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {attachedFiles.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <FileText size={16} color="#60a5fa" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{file.name}</span>
                      <span style={{ color: '#71717a', fontSize: '0.75rem' }}>({formatBytes(file.size)})</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveFile(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="asg-btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="asg-btn-primary" disabled={loading}>
              {loading ? 'กำลังเผยแพร่...' : 'มอบหมายงานทันที'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
