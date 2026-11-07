import React, { useState, useEffect } from 'react';
import { getExams, saveExam, deleteExam } from '../store/mockDb';
import { getCategories, saveCategory, deleteCategory } from '../store/mockDb';
import { getAnnouncements, saveAnnouncement, deleteAnnouncement } from '../store/mockDb';
import { getUsers, saveUser, deleteUser } from '../store/mockDb';
import { getSummaries, saveSummary, deleteSummary } from '../store/mockDb';
import { getSchedules, saveSchedule, deleteSchedule } from '../store/mockDb';
import { getItas } from '../store/mockDb';
import { getSysNotifications, saveSysNotification, deleteSysNotification } from '../store/mockDb';
import { CalendarDays } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Plus } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { LayoutDashboard } from 'lucide-react';
import { FileText } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { Megaphone } from 'lucide-react';
import { Users } from 'lucide-react';
import { Edit } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UsersManager from '../components/admin/UsersManager';

import ITAManager from '../components/admin/ITAManager';
import PopcatConfigManager from '../components/admin/PopcatConfigManager';
import ExamResultsManager from '../components/admin/ExamResultsManager';
import { MousePointerClick } from 'lucide-react';
import { supabase } from '../store/mockDb';
const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [itas, setItas] = useState([]);
  const [sysNotifications, setSysNotifications] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem('deksa_user');
    if (!userStr) {
      alert('กรุณาเข้าสู่ระบบก่อนเข้าใช้งาน');
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (!user.token) {
      alert('เซสชั่นหมดอายุหรือไม่มี Token กรุณาล็อกอินใหม่');
      localStorage.removeItem('deksa_user');
      navigate('/login');
      return;
    }
    if (user.role !== 'admin' && user.role !== 'teacher') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ');
      navigate('/student');
      return;
    }
    refreshData();
  }, [navigate]);

  const refreshData = async () => {
    const [examsData, catData, annData, usersData, sumData, schedData, itaData, sysNotifsData] = await Promise.all([
      getExams(),
      getCategories(),
      getAnnouncements(),
      getUsers(),
      getSummaries(),
      getSchedules(),
      getItas(),
      getSysNotifications()
    ]);
    setExams(examsData);
    setCategories(catData);
    setAnnouncements(annData);
    setUsers(usersData);
    setSummaries(sumData);
    setSchedules(schedData);
    setItas(itaData);
    setSysNotifications(sysNotifsData);
    window.dispatchEvent(new Event('app-ready'));
  };

  // Views
  const renderSidebar = () => {
    const user = JSON.parse(localStorage.getItem('deksa_user')) || {};
    const isAdmin = user.role === 'admin';
    
    return (
      <div className="admin-sidebar">
        <button className="btn btn-secondary" style={{ marginBottom: '2rem', width: '100%', justifyContent: 'flex-start' }} onClick={() => navigate('/')}>
          <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> กลับหน้าหลัก
        </button>
        
        <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '1rem' }}>MENU</div>
        
        <SidebarItem icon={<LayoutDashboard size={18} />} label="ภาพรวมระบบ" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <SidebarItem icon={<FileText size={18} />} label="จัดการสรุปวิชา" active={activeTab === 'summaries'} onClick={() => setActiveTab('summaries')} />
        <SidebarItem icon={<FileText size={18} />} label="จัดการข้อสอบ" active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} />
        <SidebarItem icon={<BookOpen size={18} />} label="ดูผลสอบ" active={activeTab === 'exam_results'} onClick={() => setActiveTab('exam_results')} />
        <SidebarItem icon={<BookOpen size={18} />} label="จัดการหมวดหมู่" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
        
        {isAdmin && (
          <>
            <SidebarItem icon={<CalendarDays size={18} />} label="จัดการตารางเรียน" active={activeTab === 'schedules'} onClick={() => setActiveTab('schedules')} />
            <SidebarItem icon={<Megaphone size={18} />} label="จัดการประกาศ" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
            <SidebarItem icon={<Bell size={18} />} label="ระบบแจ้งเตือน" active={activeTab === 'sys_notifications'} onClick={() => setActiveTab('sys_notifications')} />

            <SidebarItem icon={<Users size={18} />} label="จัดการผู้ใช้งาน" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={<MousePointerClick size={18} />} label="ตั้งค่า Popcat" active={activeTab === 'popcat'} onClick={() => setActiveTab('popcat')} />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="admin-layout">
      {renderSidebar()}
      
      <div className="admin-content">
        {activeTab === 'dashboard' && <DashboardOverview exams={exams} categories={categories} announcements={announcements} users={users} />}
        {activeTab === 'summaries' && <SummariesManager summaries={summaries} refreshData={refreshData} />}
        {activeTab === 'exams' && <ExamsManager exams={exams} categories={categories} refreshData={refreshData} />}
        {activeTab === 'exam_results' && <ExamResultsManager />}
        {activeTab === 'categories' && <CategoriesManager categories={categories} refreshData={refreshData} />}
        {activeTab === 'schedules' && <SchedulesManager schedules={schedules} refreshData={refreshData} />}
        {activeTab === 'announcements' && <AnnouncementsManager announcements={announcements} refreshData={refreshData} />}
        {activeTab === 'sys_notifications' && <SysNotificationsManager sysNotifications={sysNotifications} refreshData={refreshData} />}

        {activeTab === 'users' && <UsersManager users={users} refreshData={refreshData} />}
        {activeTab === 'popcat' && <PopcatConfigManager />}
      </div>
    </div>
  );
};

// --- Sub-components ---

const SysNotificationsManager = ({ sysNotifications, refreshData }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('system');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) return alert('กรุณากรอกหัวข้อและข้อความ');
    setIsSubmitting(true);
    try {
      await saveSysNotification({
        title,
        message,
        link,
        type,
        timestamp: new Date().toISOString()
      });
      setTitle('');
      setMessage('');
      setLink('');
      setType('system');
      refreshData();
      alert('ส่งการแจ้งเตือนสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการส่งแจ้งเตือน');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบการแจ้งเตือนนี้ใช่หรือไม่?')) {
      await deleteSysNotification(id);
      refreshData();
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bell size={24} /> ส่งการแจ้งเตือนไปยังผู้ใช้ทุกคน
      </h2>
      
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>หัวข้อแจ้งเตือน</label>
            <input type="text" className="eazy-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ระบบจะปิดปรับปรุงชั่วคราว" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>รายละเอียด</label>
            <textarea className="eazy-input" style={{ minHeight: '100px' }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="รายละเอียดของการแจ้งเตือน..." required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>ลิงก์ (ถ้ามี)</label>
              <input type="text" className="eazy-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>ประเภท</label>
              <select className="eazy-input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="system">แจ้งเตือนระบบ (System)</option>
                <option value="announcement">ข่าวสาร (Announcement)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ justifySelf: 'start', marginTop: '0.5rem' }}>
            {isSubmitting ? 'กำลังส่ง...' : 'ส่งแจ้งเตือน'}
          </button>
        </form>
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>ประวัติการแจ้งเตือนล่าสุด</h3>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sysNotifications.length === 0 ? (
          <div style={{ color: '#a1a1aa', textAlign: 'center', padding: '2rem' }}>ไม่มีประวัติการแจ้งเตือน</div>
        ) : (
          sysNotifications.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(notif => (
            <div key={notif.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{notif.title} <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '1rem', background: notif.type === 'system' ? 'rgba(59,130,246,0.2)' : 'rgba(250,204,21,0.2)', color: notif.type === 'system' ? '#3b82f6' : '#facc15', marginLeft: '0.5rem' }}>{notif.type}</span></div>
                <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>{notif.message}</div>
                <div style={{ color: '#52525b', fontSize: '0.8rem', marginTop: '0.5rem' }}>ส่งเมื่อ: {new Date(notif.timestamp).toLocaleString('th-TH')} {notif.link && `| ลิงก์: ${notif.link}`}</div>
              </div>
              <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={() => handleDelete(notif.id)}>ลบ</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
      borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
      background: active ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
      color: active ? '#3b82f6' : '#a1a1aa',
      borderLeft: `3px solid ${active ? '#3b82f6' : 'transparent'}`
    }}
  >
    {icon}
    <span style={{ fontWeight: active ? 'bold' : 'normal' }}>{label}</span>
  </div>
);

const DashboardOverview = ({ exams, categories, announcements, users }) => (
  <div>
    <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>ภาพรวมระบบ</h2>
    <div className="admin-grid-4">
      <StatCard title="ข้อสอบทั้งหมด" value={exams.length} icon={<FileText size={32} color="#3b82f6" />} />
      <StatCard title="หมวดหมู่วิชา" value={categories.length} icon={<BookOpen size={32} color="#10b981" />} />
      <StatCard title="ประกาศข่าวสาร" value={announcements.length} icon={<Megaphone size={32} color="#facc15" />} />
      <StatCard title="ผู้ใช้งานทั้งหมด" value={users.length} icon={<Users size={32} color="#ec4899" />} />
    </div>
  </div>
);

const StatCard = ({ title, value, icon }) => (
  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ background: '#18181b', padding: '1rem', borderRadius: '1rem' }}>{icon}</div>
    <div>
      <div style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</div>
    </div>
  </div>
);

const CategoriesManager = ({ categories, refreshData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => { setName(''); setDescription(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('กรุณากรอกชื่อหมวดหมู่');
    await saveCategory({ name, description });
    resetForm();
    setIsCreating(false);
    await refreshData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบ?')) {
      await deleteCategory(id);
      await refreshData();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>จัดการหมวดหมู่</h2>
        {!isCreating && <button className="btn btn-primary" onClick={() => setIsCreating(true)}><Plus size={16} style={{marginRight:'0.5rem'}}/> เพิ่มหมวดหมู่</button>}
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div className="input-group">
            <label className="input-label">ชื่อหมวดหมู่</label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">รายละเอียด</label>
            <input type="text" className="input-field" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">บันทึก</button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="admin-grid-3">
        {categories.map(c => (
          <div key={c.id} className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#facc15' }}>{c.name}</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '1rem', minHeight: '40px' }}>{c.description}</p>
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => handleDelete(c.id)}>ลบ</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnnouncementsManager = ({ announcements, refreshData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('NEWS UPDATE');
  const [imageUrl, setImageUrl] = useState('');
  const [contentBlocks, setContentBlocks] = useState([{ id: Date.now(), type: 'text', value: '' }]);

  const resetForm = () => { setTitle(''); setContent(''); setImageUrl(''); setContentBlocks([{ id: Date.now(), type: 'text', value: '' }]); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    await saveAnnouncement({ title, content, type, imageUrl, contentBlocks });
    resetForm();
    setIsCreating(false);
    await refreshData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบประกาศนี้?')) {
      await deleteAnnouncement(id);
      await refreshData();
    }
  };

  const addBlock = (blockType) => {
    setContentBlocks([...contentBlocks, { id: Date.now(), type: blockType, value: '' }]);
  };

  const updateBlock = (id, value) => {
    setContentBlocks(contentBlocks.map(b => b.id === id ? { ...b, value } : b));
  };

  const removeBlock = (id) => {
    setContentBlocks(contentBlocks.filter(b => b.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>จัดการประกาศข่าวสาร</h2>
        {!isCreating && <button className="btn btn-primary" onClick={() => setIsCreating(true)}><Plus size={16} style={{marginRight:'0.5rem'}}/> สร้างประกาศ</button>}
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div className="input-group">
            <label className="input-label">ประเภทประกาศ</label>
            <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
              <option value="NEWS UPDATE">NEWS UPDATE</option>
              <option value="SYSTEM UPDATE">SYSTEM UPDATE</option>
              <option value="NEW COURSE">NEW COURSE</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">รูปภาพหน้าปก (Cover)</label>
            <input 
              type="file" accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const compressed = await compressImage(file);
                  setImageUrl(compressed);
                }
              }}
              style={{ color: '#a1a1aa' }}
            />
            {imageUrl && (
              <div style={{ marginTop: '1rem', background: '#27272a', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block' }}>
                <img src={imageUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                <button type="button" onClick={() => setImageUrl('')} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>ลบรูปหน้าปก</button>
              </div>
            )}
          </div>
          <div className="input-group">
            <label className="input-label">หัวข้อประกาศ</label>
            <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">เรื่องย่อ (สำหรับแสดงหน้าแรก)</label>
            <textarea className="input-field" rows="2" value={content} onChange={e => setContent(e.target.value)}></textarea>
          </div>
          
          <div className="input-group" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #3f3f46' }}>
            <label className="input-label" style={{ fontSize: '1.25rem', color: '#facc15', marginBottom: '1.5rem' }}>เนื้อหาประกาศ (แบบเต็ม)</label>
            
            {contentBlocks.map((block, index) => (
              <div key={block.id} style={{ background: '#18181b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #27272a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 'bold' }}>ส่วนที่ {index + 1} : {block.type === 'text' ? 'ข้อความ' : 'รูปภาพ'}</span>
                  <button type="button" onClick={() => removeBlock(block.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                </div>
                
                {block.type === 'text' ? (
                  <textarea className="input-field" rows="4" value={block.value} onChange={e => updateBlock(block.id, e.target.value)} placeholder="พิมพ์ข้อความที่นี่..."></textarea>
                ) : (
                  <div>
                    {!block.value ? (
                      <input 
                        type="file" accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const compressed = await compressImage(file, 1200, 0.8);
                            updateBlock(block.id, compressed);
                          }
                        }}
                        style={{ color: '#a1a1aa' }}
                      />
                    ) : (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={block.value} alt="block" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem' }} />
                        <button type="button" onClick={() => updateBlock(block.id, '')} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer' }}><X size={16} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => addBlock('text')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} /> เพิ่มข้อความ</button>
              <button type="button" className="btn btn-secondary" onClick={() => addBlock('image')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ImageIcon size={16} /> เพิ่มรูปภาพ</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>บันทึกประกาศ</button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>ยกเลิก</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {announcements.map(a => (
          <div key={a.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              {a.imageUrl && (
                <img src={a.imageUrl} alt={a.title} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem' }} />
              )}
              <div>
                <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 'bold' }}>{a.type}</span>
                <h3 style={{ margin: '0.5rem 0' }}>{a.title}</h3>
                <p style={{ color: '#a1a1aa' }}>{a.content}</p>
              </div>
            </div>
            <button className="btn btn-danger" onClick={() => handleDelete(a.id)}>ลบ</button>
          </div>
        ))}
      </div>
    </div>
  );
};


// Summaries Manager
const SummariesManager = ({ summaries, refreshData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [viewingSummary, setViewingSummary] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [images, setImages] = useState([]);
  const [pdfData, setPdfData] = useState(null);
  const [coverImage, setCoverImage] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setDescription(''); setImages([]); setPdfData(null); setColor('#3b82f6'); setCoverImage('');
  };

  const openCreate = () => {
    setIsCreating(true);
    resetForm();
  };

  const openEdit = (summary) => {
    setIsCreating(true);
    setEditingId(summary.id);
    setTitle(summary.title);
    setDescription(summary.description);
    setImages(summary.images || []);
    setPdfData(summary.pdfData || null);
    setColor(summary.color || '#3b82f6');
    setCoverImage(summary.coverImage || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('กรุณากรอกข้อมูลให้ครบ');
    await saveSummary({ id: editingId, title, description, color, coverImage, images, pdfData });
    resetForm();
    setIsCreating(false);
    await refreshData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบสรุปวิชานี้?')) {
      await deleteSummary(id);
      await refreshData();
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('ขนาดไฟล์ PDF ต้องไม่เกิน 10MB');
      e.target.value = null;
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPdfData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพที่เลือกต้องไม่เกิน 50MB');
      e.target.value = null;
      return;
    }
    
    for (const file of files) {
      const compressed = await compressImage(file);
      setImages(prev => [...prev, compressed]);
    }
    
    e.target.value = null;
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>จัดการสรุปวิชา</h2>
        {!isCreating && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} style={{marginRight:'0.5rem'}}/> เพิ่มสรุปวิชา</button>}
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>{editingId ? 'แก้ไขสรุปวิชา' : 'สร้างสรุปวิชาใหม่'}</h3>
          <div className="admin-grid-2" style={{ marginBottom: "1.5rem" }}>
            <div className="input-group">
              <label className="input-label">ชื่อสรุปวิชา</label>
              <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">สีไอคอน</label>
              <select className="input-field" value={color} onChange={e => setColor(e.target.value)}>
                <option value="#3b82f6">สีน้ำเงิน (Blue)</option>
                <option value="#10b981">สีเขียว (Green)</option>
                <option value="#ec4899">สีชมพู (Pink)</option>
                <option value="#facc15">สีเหลือง (Yellow)</option>
                <option value="#c084fc">สีม่วง (Purple)</option>
                <option value="#f87171">สีแดง (Red)</option>
              </select>
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">รายละเอียด / ระดับชั้น</label>
            <input type="text" className="input-field" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">ภาพปกสรุปวิชา (ถ้ามี)</label>
            <input 
              type="file" accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const compressed = await compressImage(file);
                  setCoverImage(compressed);
                }
              }}
              style={{ color: '#a1a1aa', marginBottom: '1rem' }}
            />
            {coverImage && <img src={coverImage} alt="Cover Preview" style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '0.5rem', display: 'block' }} />}
          </div>
          
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">อัปโหลดไฟล์ PDF สรุปวิชา (ทางเลือก)</label>
            <input type="file" accept="application/pdf" onChange={handlePdfChange} style={{ color: '#a1a1aa', marginBottom: '1rem' }} />
            {pdfData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginTop: '0.5rem' }}>
                <FileText size={16} /> เลือกไฟล์ PDF เรียบร้อยแล้ว
                <button type="button" onClick={() => setPdfData(null)} style={{ marginLeft: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>ลบ PDF</button>
              </div>
            )}
          </div>
          
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">อัปโหลดรูปภาพชีทสรุป (เลือกได้หลายรูป)</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ color: '#a1a1aa', marginBottom: '1rem' }} />
            
            {images.length > 0 && (
              <div style={{ background: '#27272a', padding: '1rem', borderRadius: '0.5rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                {images.map((imgUrl, idx) => (
                  <div key={idx} style={{ position: 'relative', minWidth: '150px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', fontSize: '0.8rem', borderBottomRightRadius: '0.5rem' }}>หน้าที่ {idx + 1}</div>
                    <img src={imgUrl} alt={`Page ${idx+1}`} style={{ width: '150px', height: '200px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                    <button type="button" onClick={() => handleRemoveImage(idx)} style={{ width: '100%', marginTop: '0.5rem', color: '#ef4444', background: '#3f3f46', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem', borderRadius: '0.25rem' }}>ลบรูปนี้</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">{editingId ? 'บันทึกการแก้ไข' : 'บันทึกสรุปวิชา'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>ยกเลิก</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {summaries.length === 0 ? (
          <p style={{ color: '#a1a1aa' }}>ยังไม่มีสรุปวิชาในระบบ</p>
        ) : (
          summaries.map(s => (
            <div key={s.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                {s.coverImage ? (
                  <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundImage: `url(${s.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${s.color || '#3b82f6'}20`, border: `2px solid ${s.color || '#3b82f6'}`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <FileText size={24} color={s.color || '#3b82f6'} />
                  </div>
                )}
                <div>
                  <h3 style={{ color: 'white' }}>{s.title}</h3>
                  <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>{s.description}</div>
                </div>
              </div>
              <p style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '1.5rem', flex: 1 }}>มีรูปภาพทั้งหมด {s.images ? s.images.length : 0} หน้า</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setViewingSummary(s)}>ดูสรุปทั้งหมด</button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(s)}><Edit size={14} style={{marginRight:'0.25rem'}}/> แก้ไข</button>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(s.id)}>ลบ</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Viewer Modal */}
      {viewingSummary && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', background: '#09090b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${viewingSummary.color || '#3b82f6'}20`, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `2px solid ${viewingSummary.color || '#3b82f6'}` }}>
                <FileText size={20} color={viewingSummary.color || '#3b82f6'} />
              </div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>{viewingSummary.title}</h2>
            </div>
            <button onClick={() => setViewingSummary(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }} onMouseEnter={e => e.target.style.color='white'} onMouseLeave={e => e.target.style.color='#a1a1aa'}>
              <X size={28} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            {viewingSummary.images && viewingSummary.images.length > 0 ? (
              viewingSummary.images.map((img, idx) => (
                <img key={idx} src={img} alt={`Page ${idx + 1}`} style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
              ))
            ) : (
              <p style={{ color: '#a1a1aa' }}>ยังไม่มีรูปภาพในสรุปวิชานี้</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Exam Manager (Adapted from old AdminDashboard)
const ExamsManager = ({ exams, categories, refreshData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [duration, setDuration] = useState(60);
  const [coverImage, setCoverImage] = useState('');
  const [questions, setQuestions] = useState([{ id: 1, text: '', options: ['', '', '', ''], correctOption: 0, imageUrl: '' }]);

  const resetForm = () => {
    setTitle(''); setCategoryId(''); setCoverImage('');
    setQuestions([{ id: 1, text: '', options: ['', '', '', ''], correctOption: 0, imageUrl: '' }]);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: '', options: ['', '', '', ''], correctOption: 0, imageUrl: '' }]);
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updatedQs = [...questions];
    updatedQs[qIndex][field] = value;
    setQuestions(updatedQs);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQs = [...questions];
    updatedQs[qIndex].options[oIndex] = value;
    setQuestions(updatedQs);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('กรุณากรอกชื่อข้อสอบ');
    
    for (let q of questions) {
      if (!q.text) return alert('กรุณาใส่คำถามให้ครบถ้วน');
      if (q.options.some(o => !o)) return alert('กรุณาใส่ตัวเลือกให้ครบถ้วน');
    }

    await saveExam({ title, categoryId, duration, coverImage, questions });
    await refreshData();
    resetForm();
    setIsCreating(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบข้อสอบนี้?')) {
      await deleteExam(id);
      await refreshData();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>จัดการข้อสอบ</h2>
        {!isCreating && <button className="btn btn-primary" onClick={() => setIsCreating(true)}><Plus size={16} style={{marginRight:'0.5rem'}}/> สร้างข้อสอบใหม่</button>}
      </div>

      {isCreating ? (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <form onSubmit={handleSaveExam}>
            <div className="admin-grid-2">
              <div className="input-group">
                <label className="input-label">ชื่อวิชา / หัวข้อสอบ</label>
                <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">หมวดหมู่</label>
                <select className="input-field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="admin-grid-2">
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <label className="input-label">เวลาในการทำข้อสอบ (นาที)</label>
                <input type="number" className="input-field" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min="1"/>
              </div>

              <div className="input-group">
                <label className="input-label">ภาพปกข้อสอบ (ถ้ามี)</label>
                <input 
                  type="file" accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const compressed = await compressImage(file);
                      setCoverImage(compressed);
                    }
                  }}
                  style={{ color: '#a1a1aa' }}
                />
                {coverImage && (
                  <div style={{ marginTop: '1rem', background: '#27272a', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block' }}>
                    <img src={coverImage} alt="preview" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                    <button type="button" onClick={() => setCoverImage('')} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>ลบรูปภาพ</button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#facc15' }}>คำถาม ({questions.length} ข้อ)</h3>
              {questions.map((q, qIndex) => (
                <div key={q.id} style={{ border: '1px solid #333', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', background: '#18181b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ color: 'white' }}>ข้อที่ {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    )}
                  </div>
                  
                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <input type="text" className="input-field" placeholder="คำถาม..." value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} />
                  </div>

                  <div className="input-group" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    <label className="input-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>รูปภาพประกอบคำถาม (อัพโหลด)</label>
                    <input 
                      type="file" accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const compressed = await compressImage(file);
                          handleQuestionChange(qIndex, 'imageUrl', compressed);
                        }
                      }}
                      style={{ color: '#a1a1aa' }}
                    />
                    {q.imageUrl && (
                      <div style={{ marginTop: '1rem', background: '#27272a', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block' }}>
                        <img src={q.imageUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                        <button type="button" onClick={() => handleQuestionChange(qIndex, 'imageUrl', '')} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>ลบรูปภาพ</button>
                      </div>
                    )}
                  </div>

                  <div className="admin-grid-2" style={{ gap: "1rem" }}>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="radio" name={`correct-${q.id}`} checked={q.correctOption === oIndex} onChange={() => handleQuestionChange(qIndex, 'correctOption', oIndex)} style={{ cursor: 'pointer' }} />
                        <input type="text" className="input-field" placeholder={`ตัวเลือกที่ ${oIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleAddQuestion}><Plus size={16} style={{ marginRight: '0.5rem' }} /> เพิ่มคำถาม</button>
              <div style={{ flex: 1 }}></div>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary">บันทึกข้อสอบ</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {exams.length === 0 ? (
            <p style={{ color: '#a1a1aa' }}>ยังไม่มีข้อสอบในระบบ</p>
          ) : (
            exams.map(exam => {
              const cat = categories.find(c => c.id === exam.categoryId);
              return (
                <div key={exam.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.5rem' }}>{cat ? cat.name : 'ไม่มีหมวดหมู่'}</div>
                  <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>{exam.title}</h3>
                  <p style={{ marginBottom: '1rem', flex: 1, color: '#a1a1aa' }}>จำนวน {exam.questions?.length} ข้อ • {exam.duration} นาที</p>
                  
                  <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => handleDelete(exam.id)}>ลบข้อสอบ</button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  );
};

const SchedulesManager = ({ schedules, refreshData }) => {
  const [selectedGrade, setSelectedGrade] = useState('m1');
  const [rooms, setRooms] = useState([]);

  const grades = [
    { id: 'm1', label: 'ม.1' }, { id: 'm2', label: 'ม.2' }, { id: 'm3', label: 'ม.3' },
    { id: 'm4', label: 'ม.4' }, { id: 'm5', label: 'ม.5' }, { id: 'm6', label: 'ม.6' }
  ];

  // Load existing rooms when grade changes or schedules refresh
  useEffect(() => {
    const currentSchedule = schedules.find(s => s.id === selectedGrade);
    if (currentSchedule) {
      if (currentSchedule.rooms && currentSchedule.rooms.length > 0) {
        setRooms(currentSchedule.rooms);
      } else if (currentSchedule.imageUrl) {
        setRooms([{ id: Date.now(), name: 'ห้อง 1', imageUrl: currentSchedule.imageUrl }]);
      } else {
        setRooms([]);
      }
    } else {
      setRooms([]);
    }
  }, [selectedGrade, schedules]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // เรียงลำดับไฟล์ตามชื่อไฟล์ที่มีตัวเลข (Natural Sort) เช่น room1, room2, room10
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    
    const newRooms = [];
    for (let i = 0; i < files.length; i++) {
      const base64 = await compressImage(files[i], 1200, 0.8);
      newRooms.push({
        id: Date.now() + i,
        name: `ห้อง ${rooms.length + i + 1}`,
        imageUrl: base64
      });
    }
    
    setRooms(prev => [...prev, ...newRooms]);
    e.target.value = null;
  };

  const handleRoomNameChange = (id, newName) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
  };

  const handleRemoveRoom = (id) => {
    if (window.confirm('ลบรูปตารางเรียนนี้?')) {
      setRooms(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSave = async () => {
    try {
      const sortedRooms = [...rooms].sort((a, b) => a.name.localeCompare(b.name, 'th', { numeric: true }));
      await saveSchedule({
        id: selectedGrade,
        rooms: sortedRooms,
        imageUrl: '' // Clear legacy image when saving new rooms structure
      });
      alert('บันทึกรูปตารางเรียนสำเร็จ!');
      await refreshData();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>จัดการตารางเรียน</h2>
      
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '1rem', color: '#a1a1aa' }}>เลือกระดับชั้นที่ต้องการแก้ไข:</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {grades.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id)}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid',
                  borderColor: selectedGrade === g.id ? '#3b82f6' : '#27272a',
                  background: selectedGrade === g.id ? 'rgba(59, 130, 246, 0.2)' : '#18181b',
                  color: selectedGrade === g.id ? '#60a5fa' : '#a1a1aa',
                  cursor: 'pointer'
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa' }}>อัปโหลดรูปตารางเรียน (เลือกได้หลายรูป):</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ background: '#09090b', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #27272a', width: '100%', color: 'white' }} />
        </div>

        {rooms.length > 0 ? (
          <div>
            <h4 style={{ marginBottom: '1rem', color: '#60a5fa' }}>รายการห้องเรียนทั้งหมดของ {grades.find(g => g.id === selectedGrade)?.label}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {rooms.map(room => (
                <div key={room.id} style={{ border: '1px solid #27272a', padding: '1rem', borderRadius: '1rem', background: '#09090b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={room.name} 
                    onChange={e => handleRoomNameChange(room.id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #3b82f6', background: '#18181b', color: 'white', textAlign: 'center', fontWeight: 'bold' }}
                    placeholder="ชื่อห้องเรียน"
                  />
                  <img src={room.imageUrl} alt={room.name} style={{ width: '100%', height: '200px', objectFit: 'contain', borderRadius: '0.5rem', background: '#18181b' }} />
                  <button className="btn btn-danger" style={{ width: '100%', padding: '0.5rem' }} onClick={() => handleRemoveRoom(room.id)}>ลบรูปนี้</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#71717a', background: '#09090b', borderRadius: '1rem' }}>
            <CalendarDays size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>ยังไม่มีรูปตารางเรียนสำหรับระดับชั้นนี้ กรุณาอัปโหลด</p>
          </div>
        )}

        <button className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', marginTop: '1rem' }} onClick={handleSave}>
          บันทึกการเปลี่ยนแปลงทั้งหมด
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
