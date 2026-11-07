import React, { useState } from 'react';
import { saveUser, deleteUser } from '../../store/mockDb';
import { Plus, Trash2, Edit } from 'lucide-react';

const UsersManager = ({ users, refreshData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [password, setPassword] = useState('');

  const handleEdit = (user) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword(''); // don't show existing password
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !email) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    if (!editingId && !password) return alert('กรุณาตั้งรหัสผ่านสำหรับผู้ใช้ใหม่');
    
    const userData = {
      id: editingId || crypto.randomUUID(),
      name,
      email,
      role
    };
    
    if (password) {
      userData.password = password;
    }
    
    try {
      await saveUser(userData);
      
      setIsEditing(false);
      setEditingId(null);
      setName('');
      setEmail('');
      setRole('student');
      setPassword('');
      await refreshData();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบผู้ใช้งานนี้?')) {
      await deleteUser(id);
      await refreshData();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>จัดการผู้ใช้งาน</h2>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            <Plus size={16} style={{marginRight:'0.5rem'}}/> เพิ่มผู้ใช้งาน
          </button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้งานใหม่'}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">ชื่อ-นามสกุล</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            
            <div className="input-group">
              <label className="input-label">อีเมล</label>
              <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            
            <div className="input-group">
              <label className="input-label">บทบาท (Role)</label>
              <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">นักเรียน (Student)</option>
                <option value="teacher">คุณครู (Teacher)</option>
                <option value="admin">ผู้ดูแลระบบ (Admin)</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">{editingId ? 'รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน'}</label>
              <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required={!editingId} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary">บันทึก</button>
            <button type="button" className="btn btn-secondary" onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setName(''); setEmail(''); setRole('student'); setPassword('');
            }}>ยกเลิก</button>
          </div>
        </form>
      )}

      <div style={{ background: '#18181b', borderRadius: '1rem', border: '1px solid #27272a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#27272a', color: '#a1a1aa' }}>
              <th style={{ padding: '1rem', borderBottom: '1px solid #3f3f46' }}>ชื่อ-นามสกุล</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #3f3f46' }}>อีเมล</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #3f3f46' }}>บทบาท</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #3f3f46', width: '150px' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>ไม่มีข้อมูลผู้ใช้งาน</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #27272a' }}>
                  <td style={{ padding: '1rem', color: 'white' }}>{user.name}</td>
                  <td style={{ padding: '1rem', color: '#a1a1aa' }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold',
                      background: user.role === 'admin' ? '#ef444420' : user.role === 'teacher' ? '#eab30820' : '#3b82f620',
                      color: user.role === 'admin' ? '#ef4444' : user.role === 'teacher' ? '#eab308' : '#3b82f6'
                    }}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Student'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(user)} style={{ background: 'none', border: 'none', color: '#facc15', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManager;
