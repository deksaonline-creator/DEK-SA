import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Mail, Lock, User, LogIn, UserPlus, 
  Eye, EyeOff, CheckCircle2, AlertCircle, 
  KeyRound, RefreshCw, Sparkles 
} from 'lucide-react';
import { loginUser, registerUser, verifyUser, forgotPassword, resetPassword, resendOtp } from '../store/mockDb';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading & feedback
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Forgot password
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const showNotification = (message, type = 'error') => {
    setFeedback({ message, type });
  };

  const clearNotification = () => {
    setFeedback({ message: '', type: '' });
  };

  const handleChange = (e) => {
    clearNotification();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearNotification();

    if (isLogin) {
      if (!formData.email || !formData.password) {
        showNotification('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน', 'error');
        return;
      }
      
      setLoading(true);
      try {
        const data = await loginUser({ email: formData.email, password: formData.password });
        const loggedInUser = { ...data.user, token: data.token };
        localStorage.setItem('deksa_user', JSON.stringify(loggedInUser));
        window.dispatchEvent(new Event('user-logged-in'));
        showNotification('เข้าสู่ระบบสำเร็จ!', 'success');
        
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(loggedInUser);
          }
          onClose();
        }, 700);
      } catch (err) {
        if (err.message === 'NOT_VERIFIED') {
          showNotification('บัญชีนี้ยังไม่ได้ยืนยันอีเมล กรุณากรอกรหัส OTP', 'error');
          setIsVerifying(true);
        } else {
          showNotification(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error');
        }
      } finally {
        setLoading(false);
      }
      
    } else {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        showNotification('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showNotification('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน', 'error');
        return;
      }
      if (formData.password.length < 6) {
        showNotification('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'error');
        return;
      }
      
      setLoading(true);
      try {
        await registerUser({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        showNotification('ส่งรหัสยืนยัน OTP ไปยังอีเมลแล้ว กรุณานำมากรอกเพื่อยืนยันบัญชี', 'success');
        setIsVerifying(true);
        setFormData({ ...formData, password: '', confirmPassword: '' });
      } catch (err) {
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    clearNotification();
    if (!verifyOtp.trim()) {
      showNotification('กรุณากรอกรหัส OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      await verifyUser(formData.email, verifyOtp.trim());
      showNotification('ยืนยันอีเมลสำเร็จเรียบร้อย! กรุณาเข้าสู่ระบบ', 'success');
      setIsVerifying(false);
      setIsLogin(true);
      setVerifyOtp('');
    } catch (err) {
      showNotification('รหัส OTP ไม่ถูกต้อง: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    clearNotification();
    try {
      await resendOtp(formData.email);
      showNotification('ส่งรหัส OTP ไปยังอีเมลอีกครั้งแล้ว กรุณาตรวจสอบในกล่องข้อความหรืออีเมลขยะ', 'success');
    } catch (err) {
      showNotification('เกิดข้อผิดพลาดในการส่ง OTP: ' + err.message, 'error');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearNotification();
    if (!formData.email) {
      showNotification('กรุณากรอกอีเมลที่ใช้สมัครบัญชี', 'error');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(formData.email);
      showNotification('ส่งรหัสยืนยันสำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลแล้ว', 'success');
      setIsResetting(true);
    } catch (err) {
      showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearNotification();
    if (!resetOtp.trim() || !newPassword) {
      showNotification('กรุณากรอกรหัส OTP และรหัสผ่านใหม่ให้ครบถ้วน', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'error');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(formData.email, resetOtp.trim(), newPassword);
      showNotification('เปลี่ยนรหัสผ่านใหม่สำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่', 'success');
      setIsResetting(false);
      setIsForgotPassword(false);
      setIsLogin(true);
      setResetOtp('');
      setNewPassword('');
    } catch (err) {
      showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="login-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="login-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="login-modal-close-btn"
          onClick={onClose}
          aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="modal-brand-header">
          <div className="modal-logo-wrap">
            <img src="/favicon.png" alt="Dek SA Logo" className="modal-logo-img" />
          </div>
          <div className="modal-title-col">
            <h2 className="modal-brand-title">
              Dek <span className="modal-brand-accent">SA</span>
            </h2>
            <span className="modal-brand-tag">
              <Sparkles size={11} color="#60a5fa" />
              <span>DEK SA Service</span>
            </span>
          </div>
        </div>

        {/* Subtitle / Stage description */}
        <p className="modal-stage-desc">
          {isForgotPassword 
            ? (isResetting ? 'ตั้งรหัสผ่านใหม่ของคุณ' : 'รีเซ็ตรหัสผ่านผ่านอีเมล') 
            : isVerifying ? 'ยืนยันรหัส OTP จากกล่องข้อความอีเมล' 
            : isLogin ? 'ยินดีต้อนรับกลับ! เข้าสู่ระบบเพื่อใช้งาน' : 'สร้างบัญชีผู้ใช้งานใหม่'}
        </p>

        {/* Feedback Alert */}
        {feedback.message && (
          <div className={`modal-feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="feedback-icon" />
            ) : (
              <AlertCircle size={16} className="feedback-icon" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Segmented Mode Switcher */}
        {!isVerifying && !isForgotPassword && (
          <div className="modal-segmented-control">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); clearNotification(); }}
              className={`modal-segment-btn ${isLogin ? 'active' : ''}`}
            >
              <LogIn size={15} />
              <span>เข้าสู่ระบบ</span>
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); clearNotification(); }}
              className={`modal-segment-btn ${!isLogin ? 'active' : ''}`}
            >
              <UserPlus size={15} />
              <span>สมัครสมาชิก</span>
            </button>
          </div>
        )}

        {/* FORMS */}
        {isForgotPassword ? (
          isResetting ? (
            <form onSubmit={handleResetPassword} className="modal-form">
              <div className="modal-form-group">
                <label className="modal-label">รหัส OTP (ที่ได้รับทางอีเมล)</label>
                <div className="modal-input-wrap">
                  <KeyRound size={17} className="modal-field-icon" />
                  <input 
                    type="text" 
                    maxLength={10}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="XXXXXX"
                    className="modal-input text-center font-otp"
                    required
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">รหัสผ่านใหม่</label>
                <div className="modal-input-wrap">
                  <Lock size={17} className="modal-field-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="modal-input with-toggle"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="modal-pwd-toggle"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="modal-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="modal-loading-wrap">
                    <RefreshCw size={16} className="modal-spin-icon" />
                    <span>กำลังบันทึกรหัสผ่าน...</span>
                  </span>
                ) : (
                  'ยืนยันการเปลี่ยนรหัสผ่าน'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setIsResetting(false); setIsForgotPassword(false); clearNotification(); }}
                className="modal-link-btn"
              >
                ยกเลิกและกลับไปหน้าเข้าสู่ระบบ
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="modal-form">
              <div className="modal-form-group">
                <label className="modal-label">อีเมลของคุณ</label>
                <div className="modal-input-wrap">
                  <Mail size={17} className="modal-field-icon" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="modal-input"
                    required
                  />
                </div>
                <span className="modal-hint">ระบบจะส่งรหัส OTP 6 หลักเพื่อใช้รีเซ็ตรหัสผ่าน</span>
              </div>

              <button type="submit" className="modal-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="modal-loading-wrap">
                    <RefreshCw size={16} className="modal-spin-icon" />
                    <span>กำลังส่งรหัส OTP...</span>
                  </span>
                ) : (
                  'ส่งรหัสยืนยัน OTP'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); clearNotification(); }}
                className="modal-link-btn"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </form>
          )
        ) : isVerifying ? (
          <form onSubmit={handleVerify} className="modal-form">
            <div className="modal-form-group">
              <label className="modal-label">รหัสยืนยัน OTP (6 หลัก)</label>
              <div className="modal-input-wrap">
                <KeyRound size={17} className="modal-field-icon" />
                <input 
                  type="text" 
                  maxLength={10}
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value)}
                  placeholder="XXXXXX"
                  className="modal-input text-center font-otp"
                  autoFocus
                  required
                />
              </div>
              <span className="modal-hint">
                ส่งไปยัง: <strong style={{ color: '#fff' }}>{formData.email}</strong>
              </span>
            </div>

            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? (
                <span className="modal-loading-wrap">
                  <RefreshCw size={16} className="modal-spin-icon" />
                  <span>กำลังยืนยัน...</span>
                </span>
              ) : (
                'ยืนยันอีเมลและเปิดใช้งานบัญชี'
              )}
            </button>

            <div className="modal-verify-row">
              <button
                type="button"
                onClick={() => { setIsVerifying(false); clearNotification(); }}
                className="modal-link-btn"
              >
                ย้อนกลับ
              </button>
              <span className="modal-dot">•</span>
              <button
                type="button"
                onClick={handleResendOtp}
                className="modal-link-btn text-accent"
              >
                ขอรหัส OTP อีกครั้ง
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {!isLogin && (
              <div className="modal-form-group">
                <label className="modal-label">ชื่อ - นามสกุล</label>
                <div className="modal-input-wrap">
                  <User size={17} className="modal-field-icon" />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="กรอกชื่อและนามสกุล"
                    className="modal-input"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="modal-form-group">
              <label className="modal-label">อีเมล</label>
              <div className="modal-input-wrap">
                <Mail size={17} className="modal-field-icon" />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="modal-input"
                  required
                />
              </div>
            </div>

            <div className="modal-form-group">
              <div className="modal-label-row">
                <label className="modal-label">รหัสผ่าน</label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(true); clearNotification(); }}
                    className="modal-forgot-btn"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
              <div className="modal-input-wrap">
                <Lock size={17} className="modal-field-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="modal-input with-toggle"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="modal-pwd-toggle"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="modal-form-group">
                <label className="modal-label">ยืนยันรหัสผ่าน</label>
                <div className="modal-input-wrap">
                  <Lock size={17} className="modal-field-icon" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                    className="modal-input with-toggle"
                    required={!isLogin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="modal-pwd-toggle"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? (
                <span className="modal-loading-wrap">
                  <RefreshCw size={16} className="modal-spin-icon" />
                  <span>{isLogin ? 'กำลังเข้าสู่ระบบ...' : 'กำลังสร้างบัญชี...'}</span>
                </span>
              ) : isLogin ? (
                <span className="modal-btn-inner">
                  <LogIn size={16} />
                  <span>เข้าสู่ระบบ</span>
                </span>
              ) : (
                <span className="modal-btn-inner">
                  <UserPlus size={16} />
                  <span>สร้างบัญชีผู้ใช้</span>
                </span>
              )}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .login-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          z-index: 999999;
          background: rgba(3, 4, 7, 0.78);
          -webkit-backdrop-filter: blur(16px);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          animation: modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .login-modal-card {
          position: relative;
          width: 100%;
          max-width: 430px;
          max-height: min(90vh, 740px);
          overflow-y: auto;
          background: linear-gradient(180deg, rgba(23, 24, 31, 0.97) 0%, rgba(13, 14, 18, 0.99) 100%);
          -webkit-backdrop-filter: blur(32px) saturate(190%);
          backdrop-filter: blur(32px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 26px;
          padding: 2rem 1.8rem;
          box-shadow: 0 30px 70px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.25);
          animation: modalSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .login-modal-card::-webkit-scrollbar {
          width: 5px;
        }
        .login-modal-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .login-modal-card::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(14px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .login-modal-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 15;
        }

        .login-modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          transform: rotate(90deg);
        }

        /* Brand */
        .modal-brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .modal-logo-wrap {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
        }

        .modal-logo-img {
          width: 28px;
          height: 28px;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
        }

        .modal-title-col {
          display: flex;
          flex-direction: column;
        }

        .modal-brand-title {
          font-size: 1.45rem;
          font-weight: 900;
          font-style: italic;
          letter-spacing: -0.5px;
          color: #ffffff;
          margin: 0;
          line-height: 1.1;
        }

        .modal-brand-accent {
          color: #3b82f6;
          text-shadow: 0 0 16px rgba(59, 130, 246, 0.6);
        }

        .modal-brand-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #93c5fd;
          font-weight: 600;
          margin-top: 2px;
        }

        .modal-stage-desc {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.65);
          margin: 6px 0 18px;
          line-height: 1.4;
        }

        /* Feedback Banner */
        .modal-feedback-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.82rem;
          font-weight: 500;
          line-height: 1.4;
          margin-bottom: 16px;
        }

        .feedback-error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .feedback-success {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.35);
          color: #86efac;
        }

        .feedback-icon {
          flex-shrink: 0;
        }

        /* Segmented control */
        .modal-segmented-control {
          display: flex;
          padding: 4px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          gap: 4px;
          margin-bottom: 20px;
        }

        .modal-segment-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-segment-btn.active {
          color: #ffffff;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.1) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.5);
        }

        /* Forms */
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .modal-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .modal-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
        }

        .modal-forgot-btn {
          border: 0;
          background: transparent;
          color: #60a5fa;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }

        .modal-forgot-btn:hover {
          color: #93c5fd;
          text-decoration: underline;
        }

        .modal-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .modal-field-icon {
          position: absolute;
          left: 14px;
          color: rgba(255, 255, 255, 0.45);
          pointer-events: none;
        }

        .modal-input {
          width: 100%;
          height: 44px;
          padding: 0 14px 0 42px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          color: #ffffff;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .modal-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        .modal-input.with-toggle {
          padding-right: 42px;
        }

        .modal-input.text-center {
          text-align: center;
          padding-left: 14px;
          padding-right: 14px;
        }

        .font-otp {
          font-size: 1.3rem;
          letter-spacing: 6px;
          font-weight: 700;
        }

        .modal-pwd-toggle {
          position: absolute;
          right: 12px;
          background: transparent;
          border: 0;
          color: rgba(255, 255, 255, 0.45);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
        }

        .modal-pwd-toggle:hover {
          color: #ffffff;
        }

        .modal-hint {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }

        .modal-submit-btn {
          height: 46px;
          margin-top: 6px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.6);
          transform: translateY(-1px);
        }

        .modal-submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .modal-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-btn-inner {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-loading-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .modal-link-btn {
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          padding: 4px;
          margin-top: 4px;
          transition: color 0.2s;
        }

        .modal-link-btn:hover {
          color: #ffffff;
          text-decoration: underline;
        }

        .modal-link-btn.text-accent {
          color: #60a5fa;
        }

        .modal-verify-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 6px;
        }

        .modal-dot {
          color: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 480px) {
          .login-modal-overlay {
            padding: 12px;
          }
          .login-modal-card {
            padding: 1.5rem 1.25rem;
            border-radius: 20px;
            max-height: calc(100dvh - 24px);
          }
          .login-modal-close-btn {
            top: 14px;
            right: 14px;
            width: 32px;
            height: 32px;
          }
          .modal-brand-title {
            font-size: 1.3rem;
          }
          .modal-logo-wrap {
            width: 38px;
            height: 38px;
          }
          .modal-logo-img {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default LoginModal;
