import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

const SecureWrapper = ({ children, isSecureMode = true }) => {
  const [isObscured, setIsObscured] = useState(false);
  const [violationWarning, setViolationWarning] = useState(null);

  useEffect(() => {
    if (!isSecureMode) return;

    // 1. Prevent right click
    const handleContextMenu = (e) => {
      e.preventDefault();
      showWarning("ไม่อนุญาตให้คลิกขวา (Right-click disabled)");
    };

    // 2. Prevent Keyboard shortcuts (Copy, Print, Save, Developer Tools)
    const handleKeyDown = (e) => {
      // Prevent Print Screen (doesn't always work on all OS via JS, but good to have)
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard as a small countermeasure
        showWarning("ไม่อนุญาตให้จับภาพหน้าจอ (Screenshots disabled)");
        e.preventDefault();
      }

      // Prevent Ctrl+C, Ctrl+P, Ctrl+S, F12, Ctrl+Shift+I
      if ((e.ctrlKey || e.metaKey) && ['c', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        showWarning(`ไม่อนุญาตให้ใช้คีย์ลัด Ctrl+${e.key.toUpperCase()} (Shortcut disabled)`);
      }
      
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        showWarning("ไม่อนุญาตให้เปิดเครื่องมือนักพัฒนา (DevTools disabled)");
      }
    };

    // 3. Obscure screen on blur (prevent background screenshotting)
    const handleBlur = () => {
      setIsObscured(true);
    };

    const handleFocus = () => {
      setIsObscured(false);
    };
    
    // Prevent copy event
    const handleCopy = (e) => {
      e.preventDefault();
      showWarning("ไม่อนุญาตให้คัดลอกข้อความ (Copy disabled)");
    }

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('copy', handleCopy);
    };
  }, [isSecureMode]);

  const showWarning = (msg) => {
    setViolationWarning(msg);
    setTimeout(() => {
      setViolationWarning(null);
    }, 3000);
  };

  return (
    <div className={isSecureMode ? "secure-mode-active" : ""}>
      {violationWarning && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', 
          borderRadius: '8px', zIndex: 10000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
        }}>
          <ShieldAlert size={20} />
          {violationWarning}
        </div>
      )}

      {isObscured && (
        <div className="overlay-obscure">
          <ShieldAlert size={64} color="#ef4444" style={{marginBottom: '1rem'}} />
          <h2>ระบบป้องกันการทุจริตทำงาน</h2>
          <p>คุณได้สลับหน้าจอไปที่แอปพลิเคชันอื่น หรือสูญเสียการโฟกัสจากหน้าต่างสอบ</p>
          <p>กรุณาคลิกที่หน้าต่างนี้เพื่อกลับไปทำข้อสอบ</p>
        </div>
      )}

      {/* The actual content */}
      <div style={{ filter: isObscured ? 'blur(10px)' : 'none', transition: 'filter 0.2s' }}>
        {children}
      </div>
    </div>
  );
};

export default SecureWrapper;
