import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser, changeEmail, checkUidAvailability, supabase } from '../store/mockDb';
import { ArrowLeft, LogOut, ShieldCheck, Mail, Settings as SettingsIcon, User as UserIcon, Camera, Save } from 'lucide-react';
import PageTransition from '../components/PageTransition';

// Helper to resize image
const resizeImage = (file, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Profile State
  const [name, setName] = useState('');
  const [customUid, setCustomUid] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const fileInputRef = useRef(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');

  useEffect(() => {
    window.dispatchEvent(new Event('app-ready'));
    const userStr = localStorage.getItem('deksa_user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const loggedInUser = JSON.parse(userStr);
    setUser(loggedInUser);
    
    setName(loggedInUser.name || '');
    setCustomUid(loggedInUser.custom_uid || '');
    setBio(loggedInUser.bio || '');
    setProfilePicture(loggedInUser.profilePicture || '');
  }, [navigate]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await resizeImage(file, 400, 400);
      setProfilePicture(compressed);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการจัดการรูปภาพ');
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      alert('กรุณากรอกชื่อ');
      return;
    }

    let formattedUid = customUid.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (formattedUid && formattedUid.length < 3) {
      alert('UID ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (formattedUid && formattedUid !== user.custom_uid) {
      const isAvailable = await checkUidAvailability(formattedUid, user.id);
      if (!isAvailable) {
        alert('UID นี้มีผู้ใช้งานอื่นใช้แล้ว กรุณาเลือกอันอื่น');
        return;
      }
    }

    const updatedUser = {
      ...user,
      name: name.trim(),
      custom_uid: formattedUid,
      bio: bio.trim(),
      profilePicture,
    };
    
    try {
      await saveUser(updatedUser);
      localStorage.setItem('deksa_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('กรุณากรอกรหัสผ่านใหม่ให้ครบถ้วน');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) {
      alert('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      const updatedUser = { ...user, password: newPassword };
      await saveUser(updatedUser);
      localStorage.setItem('deksa_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน: ' + err.message);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailChangePassword) {
      alert('กรุณากรอกอีเมลใหม่และรหัสผ่านปัจจุบันให้ครบถ้วน');
      return;
    }
    try {
      const res = await changeEmail(user.email, newEmail, emailChangePassword);
      alert('ระบบจะทำการล็อกเอาต์เพื่อให้คุณเข้าสู่ระบบและยืนยันอีเมลใหม่ครับ\n(จำลองส่ง OTP: ' + (res?.otp || '123456') + ')');
      localStorage.removeItem('deksa_user');
      navigate('/login');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนอีเมล: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('deksa_user');
    supabase.auth.signOut().catch(() => {});
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี? ข้อมูลโปรไฟล์ทั้งหมดของคุณจะถูกลบและไม่สามารถกู้คืนได้');
    if (!confirm1) return;
    
    const confirm2 = window.prompt('พิมพ์คำว่า "ลบบัญชี" เพื่อยืนยันการลบข้อมูลของคุณ:');
    if (confirm2 !== 'ลบบัญชี') {
      alert('การยืนยันไม่ถูกต้อง ยกเลิกการลบบัญชี');
      return;
    }

    try {
      const { error: profileError } = await supabase.from('exam_app_users').delete().eq('id', user.id);
      if (profileError) throw profileError;

      const { error: authError } = await supabase.rpc('delete_my_account');
      if (authError) throw authError;

      await supabase.auth.signOut().catch(() => {});
      localStorage.removeItem('deksa_user');
      
      alert('ลบข้อมูลบัญชีของคุณอย่างถาวรเรียบร้อยแล้ว');
      navigate('/login');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบบัญชี: ' + err.message);
    }
  };

  if (!user) return null;

  return (
    <PageTransition>
      <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white', paddingBottom: '80px' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'white', border: 'none', padding: 0, cursor: 'pointer' }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>การตั้งค่า & โปรไฟล์</h2>
          </div>
        </div>

        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
          
          {/* Profile Editing Section */}
          <div style={{ padding: '1.5rem', background: '#18181b', borderRadius: '1rem', border: '1px solid #27272a', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <UserIcon size={20} color="#3b82f6" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>ข้อมูลส่วนตัว</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#27272a', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                  <img src={profilePicture || "/favicon.png"} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'absolute', bottom: '0', right: '0', width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #18181b', color: 'white', padding: 0 }}
                >
                  <Camera size={16} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>ชื่อ-นามสกุล / ชื่อแสดงผล</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', background: '#27272a', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>Custom UID (เช่น @somchai)</label>
                <input type="text" value={customUid} onChange={e => setCustomUid(e.target.value)} placeholder="ตั้งไอดีให้ตัวเอง..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', background: '#27272a', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>คำอธิบายตัวเอง (Bio)</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="เขียนอะไรสักหน่อยเกี่ยวกับคุณ..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', background: '#27272a', color: 'white', resize: 'vertical' }} />
              </div>
              <button onClick={handleSaveProfile} style={{ width: '100%', padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Save size={18} /> บันทึกข้อมูลส่วนตัว
              </button>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: '#18181b', borderRadius: '1rem', border: '1px solid #27272a', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShieldCheck size={20} color="#facc15" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>เปลี่ยนรหัสผ่าน</h3>
            </div>
            <input type="password" placeholder="รหัสผ่านปัจจุบัน (สำหรับยืนยัน)" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', background: '#27272a', color: 'white', marginBottom: '1rem' }} />
            <input type="password" placeholder="รหัสผ่านใหม่" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', background: '#27272a', color: 'white', marginBottom: '1rem' }} />
            <input type="password" placeholder="ยืนยันรหัสผ่านใหม่" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={!newPassword} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', background: '#27272a', color: 'white', marginBottom: '1rem' }} />
            <button onClick={handleUpdatePassword} style={{ width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
              อัปเดตรหัสผ่าน
            </button>
          </div>

          <div style={{ padding: '1.5rem', background: '#18181b', borderRadius: '1rem', border: '1px solid #27272a', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Mail size={20} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>เปลี่ยนอีเมล</h3>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '1rem' }}>อีเมลปัจจุบัน: {user.email}</div>
            <input type="email" placeholder="อีเมลใหม่" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', background: '#27272a', color: 'white', marginBottom: '1rem' }} />
            <input type="password" placeholder="รหัสผ่านปัจจุบัน" value={emailChangePassword} onChange={e => setEmailChangePassword(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', background: '#27272a', color: 'white', marginBottom: '1rem' }} />
            <button onClick={handleChangeEmail} style={{ width: '100%', padding: '0.75rem', background: '#059669', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
              ยืนยันการเปลี่ยนอีเมล
            </button>
          </div>

          <div style={{ padding: '1.5rem', background: '#18181b', borderRadius: '1rem', border: '1px solid #ef4444', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <SettingsIcon size={20} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ef4444' }}>ออกจากระบบ</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '1rem' }}>เมื่อออกจากระบบ คุณจะต้องเข้าสู่ระบบใหม่ในครั้งถัดไป</p>
            <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={18} /> ออกจากระบบ
            </button>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '1rem', border: '1px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ef4444' }}>ลบบัญชีผู้ใช้อย่างถาวร</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#fca5a5', marginBottom: '1rem' }}>
              การลบบัญชีจะลบข้อมูลโปรไฟล์ของคุณทั้งหมดออกจากฐานข้อมูล และไม่สามารถกู้คืนได้อีก
            </p>
            <button onClick={handleDeleteAccount} style={{ width: '100%', padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              ลบบัญชีอย่างถาวร
            </button>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;
