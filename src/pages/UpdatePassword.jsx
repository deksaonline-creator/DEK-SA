import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../store/mockDb';
import PageTransition from '../components/PageTransition';
import Header from '../components/Header';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setMessage('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      // Sign out to force the user to log in with the new password
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <Header />
        
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div style={{ background: '#18181b', borderRadius: '1.5rem', border: '1px solid #27272a', width: '100%', maxWidth: '450px', padding: '3rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <img src="/favicon.png" alt="Ghost Logo" style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>ตั้งรหัสผ่านใหม่</h2>
              <p style={{ color: '#a1a1aa', marginTop: '0.5rem' }}>
                กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน
              </p>
            </div>

            {message ? (
              <div style={{ padding: '1rem', background: '#22c55e20', border: '1px solid #22c55e', borderRadius: '0.75rem', color: '#bbf7d0', textAlign: 'center', marginBottom: '1rem' }}>
                {message}
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#a1a1aa' }}>กำลังพากลับไปยังหน้าเข้าสู่ระบบ...</p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>รหัสผ่านใหม่</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#71717a" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', background: '#09090b', border: '1px solid #27272a', borderRadius: '0.75rem', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#27272a'}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>ยืนยันรหัสผ่านใหม่</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#71717a" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', background: '#09090b', border: '1px solid #27272a', borderRadius: '0.75rem', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#27272a'}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 'bold', opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default UpdatePassword;
