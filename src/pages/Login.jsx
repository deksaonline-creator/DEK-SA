import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Lock, User, LogIn, UserPlus, 
  Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, 
  KeyRound, RefreshCw, Sparkles 
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import Header from '../components/Header';
import { loginUser, registerUser, verifyUser, forgotPassword, resetPassword, resendOtp } from '../store/mockDb';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading & Alert feedback states
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' }); // 'error' | 'success'

  // Forgot Password State
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

  useEffect(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('app-ready'));
  }, []);

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
        showNotification('เข้าสู่ระบบสำเร็จ กำลังนำท่านเข้าสู่ระบบ...', 'success');
        
        setTimeout(() => {
          navigate((loggedInUser.role === 'admin' || loggedInUser.role === 'teacher') ? '/admin' : '/');
        }, 800);
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
      showNotification('ส่งรหัส OTP ไปยังอีเมลอีกครั้งแล้ว กรุณาตรวจสอบในกล่องข้อความหรืออีเมลขยะ (Junk/Spam)', 'success');
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

  return (
    <PageTransition>
      <div className="login-page-container">
        {/* Navigation Bar */}
        <Header />

        {/* Background Ambient Glow Orbs */}
        <div className="login-ambient-orb orb-1"></div>
        <div className="login-ambient-orb orb-2"></div>

        {/* Main Center Content */}
        <div className="login-wrapper">
          
          <div className="login-card">
            
            {/* Top Brand Header */}
            <div className="login-brand-header">
              <div className="brand-logo-glow-wrap" onClick={() => navigate('/')}>
                <img src="/favicon.png" alt="Dek SA Logo" className="login-logo-img" />
              </div>
              <div className="brand-text-col">
                <h1 className="brand-main-title">
                  Dek <span className="brand-accent">SA</span>
                </h1>
                <span className="brand-subtitle-badge">
                  <Sparkles size={12} color="#60a5fa" />
                  <span>DEK SA Service Hub</span>
                </span>
              </div>
            </div>

            {/* Stage Title */}
            <p className="login-stage-desc">
              {isForgotPassword 
                ? (isResetting ? 'ตั้งรหัสผ่านใหม่ของคุณ' : 'รีเซ็ตรหัสผ่านผ่านอีเมล') 
                : isVerifying ? 'ยืนยันรหัส OTP จากกล่องข้อความอีเมล' 
                : isLogin ? 'ยินดีต้อนรับกลับ! เข้าสู่ระบบเพื่อใช้งาน' : 'สร้างบัญชีผู้ใช้งานใหม่เพื่อเข้าถึงทุกคอร์ส'}
            </p>

            {/* Notification / Feedback Banner */}
            {feedback.message && (
              <div className={`login-feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
                {feedback.type === 'success' ? (
                  <CheckCircle2 size={18} className="feedback-icon" />
                ) : (
                  <AlertCircle size={18} className="feedback-icon" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Segmented Mode Switcher (Login / Register) */}
            {!isVerifying && !isForgotPassword && (
              <div className="login-segmented-control">
                <button 
                  type="button"
                  onClick={() => { setIsLogin(true); clearNotification(); }}
                  className={`segment-btn ${isLogin ? 'active' : ''}`}
                >
                  <LogIn size={16} />
                  <span>เข้าสู่ระบบ</span>
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsLogin(false); clearNotification(); }}
                  className={`segment-btn ${!isLogin ? 'active' : ''}`}
                >
                  <UserPlus size={16} />
                  <span>สมัครสมาชิก</span>
                </button>
              </div>
            )}

            {/* ================= FORMS ================= */}
            {isForgotPassword ? (
              isResetting ? (
                /* Step 2 of Forgot Password: Enter OTP & New Password */
                <form onSubmit={handleResetPassword} className="login-form">
                  <div className="form-group">
                    <label className="form-label">รหัส OTP (ที่ได้รับทางอีเมล)</label>
                    <div className="input-field-wrap">
                      <KeyRound size={18} className="field-icon-left" />
                      <input 
                        type="text" 
                        maxLength={10}
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        placeholder="XXXXXX"
                        className="form-input text-center font-otp"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">รหัสผ่านใหม่</label>
                    <div className="input-field-wrap">
                      <Lock size={18} className="field-icon-left" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        className="form-input with-toggle"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="btn-password-toggle"
                        title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-submit-primary" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="btn-loading-wrap">
                        <RefreshCw size={18} className="spin-icon" />
                        <span>กำลังบันทึกรหัสผ่าน...</span>
                      </span>
                    ) : (
                      'ยืนยันการเปลี่ยนรหัสผ่าน'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsResetting(false); setIsForgotPassword(false); clearNotification(); }}
                    className="btn-link-action"
                  >
                    ยกเลิกและกลับไปหน้าเข้าสู่ระบบ
                  </button>
                </form>
              ) : (
                /* Step 1 of Forgot Password: Request OTP */
                <form onSubmit={handleForgotPassword} className="login-form">
                  <div className="form-group">
                    <label className="form-label">อีเมลของคุณ</label>
                    <div className="input-field-wrap">
                      <Mail size={18} className="field-icon-left" />
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className="form-input"
                        required
                      />
                    </div>
                    <span className="field-hint">ระบบจะส่งรหัส OTP 6 หลักเพื่อใช้รีเซ็ตรหัสผ่านไปยังอีเมลนี้</span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-submit-primary" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="btn-loading-wrap">
                        <RefreshCw size={18} className="spin-icon" />
                        <span>กำลังส่งรหัส OTP...</span>
                      </span>
                    ) : (
                      'ส่งรหัสยืนยัน OTP'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); clearNotification(); }}
                    className="btn-link-action"
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </button>
                </form>
              )
            ) : isVerifying ? (
              /* Email OTP Verification Screen */
              <form onSubmit={handleVerify} className="login-form">
                <div className="form-group">
                  <label className="form-label">รหัสยืนยัน OTP (6 หลัก)</label>
                  <div className="input-field-wrap">
                    <KeyRound size={18} className="field-icon-left" />
                    <input 
                      type="text" 
                      maxLength={10}
                      value={verifyOtp}
                      onChange={(e) => setVerifyOtp(e.target.value)}
                      placeholder="XXXXXX"
                      className="form-input text-center font-otp"
                      autoFocus
                      required
                    />
                  </div>
                  <span className="field-hint">
                    ส่งไปยัง: <strong style={{ color: '#fff' }}>{formData.email}</strong>
                  </span>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading-wrap">
                      <RefreshCw size={18} className="spin-icon" />
                      <span>กำลังยืนยัน...</span>
                    </span>
                  ) : (
                    'ยืนยันอีเมลและเปิดใช้งานบัญชี'
                  )}
                </button>

                <div className="verify-extra-actions">
                  <button
                    type="button"
                    onClick={() => { setIsVerifying(false); clearNotification(); }}
                    className="btn-link-action"
                  >
                    ย้อนกลับ
                  </button>
                  <span className="dot-divider">•</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="btn-link-action text-blue"
                  >
                    ขอรหัส OTP อีกครั้ง
                  </button>
                </div>
              </form>
            ) : (
              /* Main Login / Register Form */
              <form onSubmit={handleSubmit} className="login-form">
                
                {/* Full Name (Sign Up only) */}
                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">ชื่อ - นามสกุล</label>
                    <div className="input-field-wrap">
                      <User size={18} className="field-icon-left" />
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="กรอกชื่อและนามสกุลจริง"
                        className="form-input"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="form-group">
                  <label className="form-label">อีเมล</label>
                  <div className="input-field-wrap">
                    <Mail size={18} className="field-icon-left" />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="student@example.com"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label">รหัสผ่าน</label>
                    {isLogin && (
                      <span 
                        onClick={() => { setIsForgotPassword(true); clearNotification(); }} 
                        className="forgot-pass-link"
                      >
                        ลืมรหัสผ่าน?
                      </span>
                    )}
                  </div>
                  <div className="input-field-wrap">
                    <Lock size={18} className="field-icon-left" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="form-input with-toggle"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn-password-toggle"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Sign Up only) */}
                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">ยืนยันรหัสผ่าน</label>
                    <div className="input-field-wrap">
                      <Lock size={18} className="field-icon-left" />
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                        className="form-input with-toggle"
                        required={!isLogin}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="btn-password-toggle"
                        title={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button 
                  type="submit" 
                  className="btn-submit-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading-wrap">
                      <RefreshCw size={18} className="spin-icon" />
                      <span>{isLogin ? 'กำลังเข้าสู่ระบบ...' : 'กำลังสร้างบัญชี...'}</span>
                    </span>
                  ) : isLogin ? (
                    <span className="btn-inner-content">
                      <LogIn size={18} />
                      <span>เข้าสู่ระบบ</span>
                    </span>
                  ) : (
                    <span className="btn-inner-content">
                      <UserPlus size={18} />
                      <span>สร้างบัญชีผู้ใช้</span>
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* Back to Home Link */}
            <div className="login-footer-row">
              <button 
                type="button" 
                onClick={() => navigate('/')} 
                className="btn-back-home"
              >
                <ArrowLeft size={16} />
                <span>กลับสู่หน้าหลัก Dek SA</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Styled JSX for High-End Glassmorphism UI */}
      <style>{`
        .login-page-container {
          min-height: calc(var(--vh, 1vh) * 100);
          background-color: transparent;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* Ambient glowing background orbs */
        .login-ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.28;
        }

        .orb-1 {
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, #2563eb, #1d4ed8);
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
        }

        .orb-2 {
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, #0284c7, #0f766e);
          bottom: 10%;
          right: 15%;
        }

        .login-wrapper {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2.5rem 1.5rem;
          position: relative;
          z-index: 10;
        }

        .login-card {
          background: rgba(24, 24, 27, 0.78);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 1.75rem;
          padding: 2.75rem 2.25rem;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05);
          animation: cardSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Brand Header */
        .login-brand-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.15rem;
          margin-bottom: 0.75rem;
        }

        .brand-logo-glow-wrap {
          cursor: pointer;
          transition: transform 0.25s ease;
        }

        .brand-logo-glow-wrap:hover {
          transform: scale(1.08);
        }

        .login-logo-img {
          width: 64px;
          height: 64px;
          filter: drop-shadow(0 0 16px rgba(59, 130, 246, 0.45));
        }

        .brand-text-col {
          display: flex;
          flex-direction: column;
        }

        .brand-main-title {
          font-size: 2.15rem;
          font-weight: 900;
          letter-spacing: -0.8px;
          line-height: 1.1;
          margin: 0;
          color: #ffffff;
        }

        .brand-accent {
          color: #3b82f6;
        }

        .brand-subtitle-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #93c5fd;
          background: rgba(37, 99, 235, 0.16);
          padding: 0.2rem 0.55rem;
          border-radius: 9999px;
          margin-top: 0.3rem;
          border: 1px solid rgba(59, 130, 246, 0.25);
          width: fit-content;
        }

        .login-stage-desc {
          color: #a1a1aa;
          font-size: 0.92rem;
          text-align: center;
          margin-bottom: 1.75rem;
          line-height: 1.45;
        }

        /* Feedback Banner */
        .login-feedback-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          font-size: 0.88rem;
          line-height: 1.4;
          margin-bottom: 1.5rem;
          animation: bannerFadeIn 0.2s ease;
        }

        @keyframes bannerFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .feedback-error {
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .feedback-success {
          background: rgba(16, 185, 129, 0.14);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #6ee7b7;
        }

        .feedback-icon {
          flex-shrink: 0;
        }

        /* Segmented Mode Switcher */
        .login-segmented-control {
          display: flex;
          background: #0e0e11;
          border-radius: 14px;
          padding: 0.3rem;
          margin-bottom: 1.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          gap: 0.25rem;
        }

        .segment-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem 0.5rem;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #8e8e93;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .segment-btn.active {
          background: #27272a;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        /* Form elements */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: #d4d4d8;
        }

        .forgot-pass-link {
          font-size: 0.82rem;
          color: #3b82f6;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .forgot-pass-link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        .input-field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon-left {
          position: absolute;
          left: 1rem;
          color: #71717a;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.85rem;
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit;
        }

        .form-input.with-toggle {
          padding-right: 2.85rem;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        .form-input.text-center {
          text-align: center;
          padding-left: 1rem;
          padding-right: 1rem;
        }

        .font-otp {
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: 0.45rem;
        }

        .btn-password-toggle {
          position: absolute;
          right: 0.85rem;
          background: transparent;
          border: none;
          color: #71717a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.35rem;
          border-radius: 6px;
          transition: color 0.15s ease;
        }

        .btn-password-toggle:hover {
          color: #ffffff;
        }

        .field-hint {
          font-size: 0.78rem;
          color: #71717a;
          line-height: 1.4;
          margin-top: 0.15rem;
        }

        /* Buttons */
        .btn-submit-primary {
          width: 100%;
          padding: 0.95rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.45);
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease;
          margin-top: 0.65rem;
          font-family: inherit;
        }

        .btn-submit-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -5px rgba(37, 99, 235, 0.55);
        }

        .btn-submit-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-inner-content {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-loading-wrap {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .btn-link-action {
          background: transparent;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          font-size: 0.88rem;
          text-decoration: underline;
          padding: 0.4rem;
          transition: color 0.15s ease;
          text-align: center;
          font-family: inherit;
        }

        .btn-link-action:hover {
          color: #ffffff;
        }

        .btn-link-action.text-blue {
          color: #3b82f6;
        }

        .verify-extra-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .dot-divider {
          color: #52525b;
        }

        .login-footer-row {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: center;
        }

        .btn-back-home {
          background: transparent;
          border: none;
          color: #a1a1aa;
          font-size: 0.88rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          transition: color 0.15s ease;
          font-family: inherit;
        }

        .btn-back-home:hover {
          color: #ffffff;
        }

        /* Responsive on mobile */
        @media (max-width: 480px) {
          .login-wrapper {
            padding: 1.25rem 1rem;
            align-items: flex-start;
          }

          .login-card {
            padding: 1.75rem 1.25rem;
            border-radius: 1.25rem;
          }

          .brand-main-title {
            font-size: 1.75rem;
          }

          .login-logo-img {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </PageTransition>
  );
};

export default Login;
