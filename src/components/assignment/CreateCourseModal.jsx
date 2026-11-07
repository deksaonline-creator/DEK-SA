import React, { useState } from 'react';
import { createCourse, getActiveUser } from '../../services/assignmentService';
import { BookPlus, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function CreateCourseModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    academic_year: '2569',
    semester: 1,
    cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setError('กรุณากรอกรหัสวิชาและชื่อรายวิชา');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newCourse = await createCourse(formData, getActiveUser());
      setLoading(false);
      if (onCreated) onCreated(newCourse);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างรายวิชา');
    }
  };

  return (
    <div className="asg-modal-overlay" onClick={onClose}>
      <div className="asg-modal-card" onClick={e => e.stopPropagation()}>
        <div className="asg-modal-header">
          <h3>
            <BookPlus size={22} color="#34d399" />
            สร้างรายวิชาใหม่
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
            <div className="asg-form-group">
              <label className="asg-form-label">รหัสวิชา *</label>
              <input 
                type="text" 
                required
                placeholder="เช่น ว30101"
                className="asg-form-input"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="asg-form-group">
              <label className="asg-form-label">ชื่อรายวิชา *</label>
              <input 
                type="text" 
                required
                placeholder="เช่น วิทยาการคำนวณ 1 (ม.4)"
                className="asg-form-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="asg-form-group">
            <label className="asg-form-label">คำอธิบายรายวิชา</label>
            <textarea 
              placeholder="สรุปเนื้อหาและเป้าหมายการเรียนรู้ในรายวิชานี้..."
              className="asg-form-textarea"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="asg-form-group">
              <label className="asg-form-label">ปีการศึกษา (พ.ศ.)</label>
              <input 
                type="text" 
                className="asg-form-input"
                value={formData.academic_year}
                onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
              />
            </div>
            <div className="asg-form-group">
              <label className="asg-form-label">ภาคเรียน</label>
              <select 
                className="asg-form-select"
                value={formData.semester}
                onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
              >
                <option value={1}>ภาคเรียนที่ 1</option>
                <option value={2}>ภาคเรียนที่ 2</option>
              </select>
            </div>
          </div>

          <div className="asg-form-group">
            <label className="asg-form-label">URL ภาพปกวิชา (Cover Image)</label>
            <input 
              type="url" 
              className="asg-form-input"
              value={formData.cover_image}
              onChange={e => setFormData({ ...formData, cover_image: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="asg-btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="asg-btn-primary" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'สร้างรายวิชา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
