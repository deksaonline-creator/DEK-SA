import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, User, Key, Eye, EyeOff, Search, RefreshCw, 
  Download, Printer, ArrowLeft, CheckCircle2, AlertCircle, 
  BookOpen, Award, BarChart3, TrendingUp, Calendar, ShieldCheck, 
  Trash2, ExternalLink, ChevronDown, Sparkles, Filter, X,
  LayoutGrid, List, Lock, LogIn
} from 'lucide-react';
import Header from '../components/Header';

const SGS_STORAGE_KEY = 'deksa_sgs_saved_account';
const SGS_LOCAL_CACHE_PREFIX = 'deksa_sgs_cache_';

const SGSGrades = () => {
  const navigate = useNavigate();

  // Login form state
  const [studentId, setStudentId] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // App & Data state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [gradeData, setGradeData] = useState(null);
  const [savedAccount, setSavedAccount] = useState(null);

  // Filters & Search
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL'); // ALL, ACADEMIC, ACTIVITY
  const [viewMode, setViewMode] = useState('table'); // 'cards' | 'table'
  const [showSubScores, setShowSubScores] = useState(false); // toggle 4 sub-scores in table
  const printRef = useRef(null);

  // Dek SA Auth state (Require login to use SGS)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('deksa_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const userStr = localStorage.getItem('deksa_user');
        setCurrentUser(userStr ? JSON.parse(userStr) : null);
      } catch (e) {
        setCurrentUser(null);
      }
    };

    window.addEventListener('user-logged-in', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('user-logged-in', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Check saved credentials & auto-load cache on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem(SGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedAccount(parsed);
        setStudentId(parsed.studentId || '');
        if (parsed.citizenId) {
          setCitizenId(parsed.citizenId);
        }

        // Check if we have cached data for this student in local storage
        const localCached = localStorage.getItem(`${SGS_LOCAL_CACHE_PREFIX}${parsed.studentId}`);
        if (localCached) {
          try {
            const cachedObj = JSON.parse(localCached);
            setGradeData(cachedObj);
            // Default to latest semester
            if (cachedObj.semesters && cachedObj.semesters.length > 0) {
              setSelectedSemester(cachedObj.semesters[0].name || 'ALL');
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
  }, []);

  // Fetch grades (from DATA cache or live SGS)
  const handleFetchGrades = async (overrideStudentId = null, overrideCitizenId = null, forceRefresh = false) => {
    if (!currentUser) {
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }

    const sId = (overrideStudentId || studentId).trim();
    const cId = (overrideCitizenId || citizenId).trim();

    if (!sId) {
      setErrorMessage('กรุณากรอกเลขประจำตัวนักเรียน (5 หลัก)');
      return;
    }

    if (!cId && !forceRefresh && sId !== 'demo') {
      // Check if server or local has cache without needing password
      const localCached = localStorage.getItem(`${SGS_LOCAL_CACHE_PREFIX}${sId}`);
      if (localCached) {
        setGradeData(JSON.parse(localCached));
        return;
      }
    }

    if (!cId && sId !== 'demo') {
      setErrorMessage('กรุณากรอกเลขประจำตัวประชาชน (13 หลัก)');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setLoadingStep('กำลังตรวจสอบข้อมูลใน DATA Storage...');

    try {
      if (forceRefresh) {
        setLoadingStep('กำลังเชื่อมต่อระบบ SGS สพฐ. เพื่อดึงข้อมูลสด...');
      }

      const res = await fetch('/api/sgs/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: sId,
          citizen_id: cId,
          force_refresh: forceRefresh,
          semester: 0
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('ไม่สามารถประมวลผลข้อมูลจากเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'ไม่สามารถดึงข้อมูลผลการเรียนได้ กรุณาตรวจสอบรหัสผ่าน');
      }

      // Success
      setGradeData(data);

      // Save credentials if Remember Me is checked
      if (rememberMe && sId !== 'demo') {
        const accountInfo = { studentId: sId, citizenId: cId, studentName: data.student_name };
        localStorage.setItem(SGS_STORAGE_KEY, JSON.stringify(accountInfo));
        setSavedAccount(accountInfo);
      }

      // Save data to local cache
      localStorage.setItem(`${SGS_LOCAL_CACHE_PREFIX}${sId}`, JSON.stringify(data));

      // Select latest semester by default if available
      if (data.semesters && data.semesters.length > 0) {
        setSelectedSemester(data.semesters[0].name);
      } else {
        setSelectedSemester('ALL');
      }

    } catch (err) {
      console.error('Fetch grades error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Demo mode
  const handleLoadDemo = () => {
    handleFetchGrades('demo', '1234567890123', false);
  };

  // Clear data / Logout
  const handleClearData = () => {
    if (confirm('คุณต้องการออกจากระบบและล้างข้อมูลผลการเรียนที่บันทึกไว้ในเครื่องนี้หรือไม่?')) {
      if (gradeData?.student_id) {
        localStorage.removeItem(`${SGS_LOCAL_CACHE_PREFIX}${gradeData.student_id}`);
      }
      localStorage.removeItem(SGS_STORAGE_KEY);
      setSavedAccount(null);
      setGradeData(null);
      setStudentId('');
      setCitizenId('');
    }
  };

  // Download CSV
  const handleExportCSV = () => {
    if (!filteredSubjects || filteredSubjects.length === 0) return;

    const headers = ['ปีและภาคเรียน', 'รหัสวิชา', 'ชื่อวิชา', 'หน่วยกิต', 'ก่อนกลางภาค', 'สอบกลางภาค', 'หลังกลางภาค', 'สอบปลายภาค', 'คะแนนรวม', 'ร้อยละ', 'เกรด', 'GPA_เทอมนี้'];
    const rows = filteredSubjects.map(sub => [
      `"${sub['ปีและภาคเรียน'] || ''}"`,
      `"${sub['รหัสวิชา'] || ''}"`,
      `"${sub['ชื่อวิชา'] || ''}"`,
      `"${sub['หน่วยกิต'] || ''}"`,
      `"${sub['ก่อนกลางภาค'] || ''}"`,
      `"${sub['สอบกลางภาค'] || ''}"`,
      `"${sub['หลังกลางภาค'] || ''}"`,
      `"${sub['สอบปลายภาค'] || ''}"`,
      `"${sub['คะแนนรวม'] || ''}"`,
      `"${sub['ร้อยละ'] || ''}"`,
      `"${sub['เกรด'] || ''}"`,
      `"${sub['GPA_เทอมนี้'] || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SGS_Grades_${gradeData?.student_id || 'student'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Extract all subjects list from data
  const allSubjects = useMemo(() => {
    if (!gradeData) return [];
    if (gradeData.grades && gradeData.grades.length > 0) {
      return gradeData.grades;
    }
    // If by_semester is available
    if (gradeData.by_semester) {
      const list = [];
      Object.entries(gradeData.by_semester).forEach(([sem, semObj]) => {
        if (semObj.subjects) {
          list.push(...semObj.subjects);
        }
      });
      return list;
    }
    return [];
  }, [gradeData]);

  // List of available semesters
  const availableSemesters = useMemo(() => {
    if (!gradeData) return [];
    if (gradeData.semesters && gradeData.semesters.length > 0) {
      return gradeData.semesters.map(s => s.name);
    }
    const unique = [...new Set(allSubjects.map(s => s['ปีและภาคเรียน']).filter(Boolean))];
    return unique;
  }, [gradeData, allSubjects]);

  // Filtered subjects based on semester, type and search query
  const filteredSubjects = useMemo(() => {
    return allSubjects.filter(sub => {
      // Semester filter
      if (selectedSemester !== 'ALL' && sub['ปีและภาคเรียน'] !== selectedSemester) {
        return false;
      }

      // Grade type filter (academic vs activity)
      const isActivity = sub['เกรด'] === 'ผ' || sub['เกรด'] === 'มผ' || /กิจกรรม|แนะแนว|ลูกเสือ|ชุมนุม|หน้าที่พลเมือง|สาธารณประโยชน์/i.test(sub['ชื่อวิชา']);
      if (gradeFilter === 'ACADEMIC' && isActivity) return false;
      if (gradeFilter === 'ACTIVITY' && !isActivity) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        const code = (sub['รหัสวิชา'] || '').toLowerCase();
        const name = (sub['ชื่อวิชา'] || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q)) return false;
      }

      return true;
    });
  }, [allSubjects, selectedSemester, gradeFilter, searchQuery]);

  // Calculate true weighted GPA for any array of subjects
  const calculateWeightedGPA = useCallback((subjects) => {
    if (!subjects || !subjects.length) return null;
    let totalPoints = 0;
    let totalCredits = 0;
    subjects.forEach((sub) => {
      const credit = parseFloat(sub['หน่วยกิต']);
      const grade = parseFloat(sub['เกรด']);
      if (!isNaN(credit) && credit > 0 && credit <= 5.0 && !isNaN(grade) && grade >= 0 && grade <= 4) {
        totalPoints += credit * grade;
        totalCredits += credit;
      }
    });
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
  }, []);

  // Dynamic GPA Calculation (Weighted: sum(credit * grade) / sum(credit))
  const { calculatedGPA, totalFilteredCredits } = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;

    filteredSubjects.forEach((sub) => {
      const credit = parseFloat(sub['หน่วยกิต']);
      const grade = parseFloat(sub['เกรด']);
      if (!isNaN(credit) && credit > 0 && credit <= 5.0 && !isNaN(grade) && grade >= 0 && grade <= 4) {
        totalPoints += credit * grade;
        totalCredits += credit;
      }
    });

    return {
      calculatedGPA: totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null,
      totalFilteredCredits: totalCredits.toFixed(1)
    };
  }, [filteredSubjects]);

  // Active Semester Summary
  const currentSummary = useMemo(() => {
    if (!gradeData) return null;

    let baseSummary = {};
    if (selectedSemester !== 'ALL' && gradeData.by_semester && gradeData.by_semester[selectedSemester]) {
      const semData = gradeData.by_semester[selectedSemester];
      const semSubjects = Array.isArray(semData) ? semData : (semData.subjects || []);
      const firstRow = semSubjects[0] || filteredSubjects[0] || {};
      const semCalcGpa = calculateWeightedGPA(semSubjects);

      // Prioritize accurate calculated GPA over corrupted scraped values
      let gpa = semCalcGpa || semData.summary?.GPA || firstRow['GPA_เทอมนี้'] || '';
      if (gpa && !isNaN(parseFloat(gpa))) {
        gpa = parseFloat(gpa).toFixed(2);
      }

      baseSummary = {
        GPA: gpa,
        อันดับที่_ห้อง: semData.summary?.['อันดับที่_ห้อง'] || firstRow['อันดับที่_ห้อง'] || '-',
        อันดับที่_ระดับ: semData.summary?.['อันดับที่_ระดับ'] || firstRow['อันดับที่_ระดับ'] || '-',
        หน่วยกิตรวม: semData.summary?.['หน่วยกิตรวม'] || ''
      };
    } else {
      const firstRow = filteredSubjects[0] || {};
      baseSummary = {
        GPA: calculatedGPA || gradeData.GPAX || firstRow['GPA_เทอมนี้'] || '',
        อันดับที่_ห้อง: firstRow['อันดับที่_ห้อง'] || '-',
        อันดับที่_ระดับ: firstRow['อันดับที่_ระดับ'] || '-'
      };
    }

    // Fallback to dynamic calculated GPA if GPA is empty or when viewing ALL semesters (GPAX)
    if (selectedSemester === 'ALL' || !baseSummary.GPA || baseSummary.GPA === '-' || baseSummary.GPA === '') {
      baseSummary.GPA = calculatedGPA || baseSummary.GPA || '-';
    }

    // Format numeric GPA to 2 decimal places (e.g. 3.31)
    if (baseSummary.GPA && !isNaN(parseFloat(baseSummary.GPA))) {
      baseSummary.GPA = parseFloat(baseSummary.GPA).toFixed(2);
    }

    if (!baseSummary['หน่วยกิตรวม'] || selectedSemester === 'ALL') {
      baseSummary['หน่วยกิตรวม'] = totalFilteredCredits;
    }

    return baseSummary;
  }, [gradeData, selectedSemester, filteredSubjects, calculatedGPA, totalFilteredCredits, calculateWeightedGPA]);

  // Grade color helper
  const getGradeBadge = (grade) => {
    const g = String(grade).trim();
    if (g === '4') return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', color: '#34d399', text: '4.0' };
    if (g === '3.5') return { bg: 'rgba(52, 211, 153, 0.2)', border: '#34d399', color: '#6ee7b7', text: '3.5' };
    if (g === '3') return { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', color: '#60a5fa', text: '3.0' };
    if (g === '2.5') return { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', color: '#fbbf24', text: '2.5' };
    if (g === '2') return { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', color: '#fdba74', text: '2.0' };
    if (g === '1.5' || g === '1') return { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', color: '#fca5a5', text: g };
    if (g === '0') return { bg: 'rgba(220, 38, 38, 0.3)', border: '#dc2626', color: '#f87171', text: '0' };
    if (g === 'ผ') return { bg: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6', color: '#c084fc', text: 'ผ่าน (ผ)' };
    if (g === 'มผ') return { bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444', color: '#fca5a5', text: 'ไม่ผ่าน' };
    return { bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', text: g || '-' };
  };

  return (
    <div className="sgs-page-root">
      <Header />

      <div className="sgs-container" ref={printRef}>
        
        {/* Navigation Breadcrumb */}
        <div className="sgs-top-nav no-print">
          <button type="button" className="sgs-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            <span>ย้อนกลับ</span>
          </button>
          <span className="sgs-breadcrumb-sep">/</span>
          <span className="sgs-breadcrumb-current">ระบบตรวจสอบผลการเรียน SGS</span>
        </div>

        {/* ================= VIEW 0: AUTHENTICATION GATE (MUST LOG IN FIRST) ================= */}
        {!currentUser ? (
          <div className="sgs-auth-gate-wrapper">
            <div className="sgs-auth-gate-card glass">
              <div className="auth-gate-icon-circle">
                <Lock size={38} color="#3b82f6" strokeWidth={2.2} />
              </div>
              <h2 className="auth-gate-title">กรุณาเข้าสู่ระบบก่อนใช้งาน</h2>
              <p className="auth-gate-desc">
                ระบบตรวจสอบผลการเรียน SGS สงวนสิทธิ์สำหรับสมาชิก Dek SA เท่านั้น กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อเข้าตรวจสอบผลการเรียนของคุณ
              </p>

              <div className="auth-gate-features">
                <div className="auth-gate-feature-item">
                  <span className="feature-dot"></span>
                  <span>บันทึกและซิงค์ข้อมูลเกรดอัตโนมัติ</span>
                </div>
                <div className="auth-gate-feature-item">
                  <span className="feature-dot"></span>
                  <span>ดูเกรดเฉลี่ยสะสม GPA / GPAX และอันดับห้อง</span>
                </div>
                <div className="auth-gate-feature-item">
                  <span className="feature-dot"></span>
                  <span>ดาวน์โหลดไฟล์ CSV และพิมพ์ใบรายงานผลการเรียน</span>
                </div>
              </div>

              <div className="auth-gate-btn-group">
                <button 
                  type="button" 
                  className="auth-gate-login-btn"
                  onClick={() => window.dispatchEvent(new Event('open-login-modal'))}
                >
                  <LogIn size={18} />
                  <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                </button>
                <button 
                  type="button" 
                  className="auth-gate-back-btn"
                  onClick={() => navigate('/')}
                >
                  <span>กลับหน้าหลัก</span>
                </button>
              </div>
            </div>
          </div>
        ) : !gradeData ? (
          <div className="sgs-login-wrapper">
            <div className="sgs-login-card glass">
              
              {/* Card Header */}
              <div className="sgs-login-header">
                <div className="sgs-icon-badge">
                  <GraduationCap size={36} color="#3b82f6" strokeWidth={2.2} />
                </div>
                <h1 className="sgs-login-title">ระบบตรวจสอบผลการเรียน SGS</h1>
                <p className="sgs-login-sub">
                  บริการดึงข้อมูลและบันทึกคะแนนสอบ ผลการเรียนเฉลี่ย (GPA) และอันดับที่ ประจำโรงเรียนสตรีอ่างทอง
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="sgs-error-box">
                  <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Saved Account Quick Access */}
              {savedAccount && (
                <div className="sgs-saved-account-box">
                  <div className="saved-acc-info">
                    <User size={16} color="#3b82f6" />
                    <span>ข้อมูลที่บันทึกไว้: <strong>{savedAccount.studentName || `รหัส ${savedAccount.studentId}`}</strong></span>
                  </div>
                  <button 
                    type="button" 
                    className="saved-acc-quick-btn"
                    onClick={() => handleFetchGrades(savedAccount.studentId, savedAccount.citizenId, false)}
                    disabled={isLoading}
                  >
                    เปิดดูผลการเรียนทันที ›
                  </button>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleFetchGrades(null, null, false); }} className="sgs-form">
                
                {/* Student ID */}
                <div className="sgs-input-group">
                  <label htmlFor="sgs-student-id">เลขประจำตัวนักเรียน (5 หลัก)</label>
                  <div className="sgs-input-field">
                    <User size={18} className="field-icon" />
                    <input 
                      id="sgs-student-id"
                      type="text"
                      maxLength={6}
                      placeholder="เช่น 31515"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Citizen ID */}
                <div className="sgs-input-group">
                  <label htmlFor="sgs-citizen-id">เลขประจำตัวประชาชน (13 หลัก)</label>
                  <div className="sgs-input-field">
                    <Key size={18} className="field-icon" />
                    <input 
                      id="sgs-citizen-id"
                      type={showPassword ? "text" : "password"}
                      maxLength={13}
                      placeholder="เลข 13 หลักตามบัตรประชาชน"
                      value={citizenId}
                      onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, ''))}
                      disabled={isLoading}
                    />
                    <button 
                      type="button" 
                      className="pwd-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      aria-label="แสดงรหัสผ่าน"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="input-hint">
                    * ใช้สำหรับตรวจสอบสิทธิ์กับเซิร์ฟเวอร์ SGS ครั้งแรก จากนั้นระบบจะบันทึกผลการเรียนเก็บไว้ให้อัตโนมัติ
                  </span>
                </div>

                {/* Remember Me Checkbox */}
                <label className="sgs-checkbox-row">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>บันทึกข้อมูลไว้ในเครื่อง (เปิดดูได้ทันทีในครั้งถัดไป ไม่ต้องกรอกซ้ำ)</span>
                </label>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="sgs-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading-content">
                      <RefreshCw size={18} className="spin-icon" />
                      <span>{loadingStep || 'กำลังตรวจสอบข้อมูล...'}</span>
                    </span>
                  ) : (
                    <span>เข้าสู่ระบบ & ดูผลการเรียน</span>
                  )}
                </button>

                {/* Demo Button */}
                <div className="sgs-demo-divider">
                  <span>หรือ</span>
                </div>

                <button 
                  type="button" 
                  className="sgs-demo-btn"
                  onClick={handleLoadDemo}
                  disabled={isLoading}
                >
                  <Sparkles size={16} color="#facc15" />
                  <span>ทดลองเปิดดูข้อมูลตัวอย่าง (Demo Data)</span>
                </button>

              </form>

              {/* Data Storage Notice */}
              <div className="sgs-storage-notice">
                <ShieldCheck size={16} color="#10b981" />
                <span>
                  <strong>DATA Local Storage:</strong> ข้อมูลผลการเรียนที่ดึงมาแล้วจะถูกแคชไว้ในระบบ เพื่อให้คุณเปิดดูได้ทันทีอย่างรวดเร็ว แม้เว็บไซต์ทางการของ สพฐ. จะปิดปรับปรุง
                </span>
              </div>

            </div>
          </div>
        ) : (
          
          /* ================= VIEW 2: GRADE VIEWER DASHBOARD ================= */
          <div className="sgs-dashboard-wrapper">
            
            {/* Header Profile Banner */}
            <div className="sgs-profile-banner glass">
              <div className="profile-main-info">
                <div className="profile-avatar-circle">
                  <GraduationCap size={32} color="#ffffff" />
                </div>
                <div>
                  <h1 className="student-name-title">
                    {gradeData.student_name || `เลขประจำตัว ${gradeData.student_id}`}
                  </h1>
                  <p className="student-meta-sub">
                    เลขประจำตัว: <strong>{gradeData.student_id}</strong> · 
                    อัปเดตล่าสุด: {gradeData.last_updated ? new Date(gradeData.last_updated).toLocaleString('th-TH') : 'วันนี้'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="profile-actions no-print">
                <button 
                  type="button"
                  className="sgs-act-btn sync"
                  onClick={() => handleFetchGrades(gradeData.student_id, citizenId, true)}
                  disabled={isLoading}
                  title="เชื่อมต่อ SGS เพื่อดึงข้อมูลใหม่ล่าสุด"
                >
                  <RefreshCw size={15} className={isLoading ? "spin-icon" : ""} />
                  <span>{isLoading ? 'กำลังโหลด...' : 'ดึงเกรดล่าสุด'}</span>
                </button>
                <button 
                  type="button"
                  className="sgs-act-btn print"
                  onClick={handlePrint}
                  title="พิมพ์ผลการเรียน"
                >
                  <Printer size={15} />
                  <span>พิมพ์</span>
                </button>
                <button 
                  type="button"
                  className="sgs-act-btn export"
                  onClick={handleExportCSV}
                  title="ดาวน์โหลดเป็นไฟล์ CSV"
                >
                  <Download size={15} />
                  <span>CSV</span>
                </button>
                <button 
                  type="button"
                  className="sgs-act-btn logout"
                  onClick={handleClearData}
                  title="ล้างข้อมูลและออกจากระบบ"
                >
                  <Trash2 size={15} />
                  <span>เปลี่ยนผู้ใช้</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="sgs-stats-grid">
              
              {/* GPA */}
              <div className="stat-card gpa glass">
                <div className="stat-icon-circle gpa-icon">
                  <Award size={24} color="#f59e0b" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">
                    {selectedSemester === 'ALL' ? 'เกรดเฉลี่ยสะสม (GPAX)' : 'เกรดเฉลี่ย (GPA) ประจำเทอม'}
                  </span>
                  <div className="stat-value gpa-num">
                    {currentSummary?.GPA || '-'}
                  </div>
                  <span className="stat-sub">
                    {parseFloat(currentSummary?.GPA) >= 3.5 ? '✨ ระดับผลการเรียนดีเยี่ยม' : 
                     parseFloat(currentSummary?.GPA) >= 3.0 ? '👍 ผลการเรียนดี' : 'ผลการเรียนเฉลี่ย'}
                  </span>
                </div>
              </div>

              {/* Room Ranking */}
              <div className="stat-card room-rank glass">
                <div className="stat-icon-circle room-icon">
                  <TrendingUp size={24} color="#3b82f6" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">อันดับที่ในห้องเรียน</span>
                  <div className="stat-value room-num">
                    {currentSummary?.['อันดับที่_ห้อง'] || '-'}
                  </div>
                  <span className="stat-sub">ลำดับผลการเรียนในห้อง</span>
                </div>
              </div>

              {/* Grade Level Ranking */}
              <div className="stat-card level-rank glass">
                <div className="stat-icon-circle level-icon">
                  <BarChart3 size={24} color="#8b5cf6" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">อันดับที่ในระดับชั้น</span>
                  <div className="stat-value level-num">
                    {currentSummary?.['อันดับที่_ระดับ'] || '-'}
                  </div>
                  <span className="stat-sub">ลำดับผลการเรียนทั้งระดับชั้น</span>
                </div>
              </div>

              {/* Total Credits / Subjects */}
              <div className="stat-card credits glass">
                <div className="stat-icon-circle cred-icon">
                  <BookOpen size={24} color="#10b981" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">จำนวนวิชา & หน่วยกิต</span>
                  <div className="stat-value cred-num">
                    {filteredSubjects.length} <span className="stat-unit">วิชา</span>
                  </div>
                  <span className="stat-sub">
                    {currentSummary?.['หน่วยกิตรวม'] ? `รวม ${currentSummary['หน่วยกิตรวม']} หน่วยกิต` : 'รายวิชาทั้งหมด'}
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Summary Table by Semester */}
            {gradeData?.by_semester && Object.keys(gradeData.by_semester).length > 0 && (
              <div className="sgs-summary-table-card glass no-print">
                <div className="summary-table-header">
                  <div className="summary-title-wrap">
                    <span className="summary-table-title">ตารางสรุปผลการเรียนแต่ละภาคเรียน</span>
                    <span className="summary-table-hint">คลิกแถวเพื่อเลือกดูรายวิชาของเทอมนั้น</span>
                  </div>
                </div>
                <div className="sgs-table-responsive">
                  <table className="sgs-summary-mini-table">
                    <thead>
                      <tr>
                        <th>ภาคเรียน</th>
                        <th style={{ textAlign: 'center' }}>หน่วยกิต</th>
                        <th style={{ textAlign: 'center' }}>เกรดเฉลี่ย (GPA)</th>
                        <th style={{ textAlign: 'center' }}>อันดับห้อง</th>
                        <th style={{ textAlign: 'center' }}>อันดับระดับชั้น</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(gradeData.by_semester).map(([semName, semInfo]) => {
                        const isCurrent = selectedSemester === semName;
                        const subjects = Array.isArray(semInfo) ? semInfo : (semInfo.subjects || []);
                        const firstRow = subjects[0] || {};
                        const calcGpa = calculateWeightedGPA(subjects);
                        
                        // Prioritize accurately calculated weighted GPA
                        const rawGpa = calcGpa || semInfo.summary?.GPA || firstRow['GPA_เทอมนี้'] || '';
                        const formattedGpa = rawGpa && !isNaN(parseFloat(rawGpa)) ? parseFloat(rawGpa).toFixed(2) : (rawGpa || '-');
                        const roomRank = semInfo.summary?.['อันดับที่_ห้อง'] || firstRow['อันดับที่_ห้อง'] || '-';
                        const levelRank = semInfo.summary?.['อันดับที่_ระดับ'] || firstRow['อันดับที่_ระดับ'] || '-';
                        
                        // Accurate academic credits
                        let credits = semInfo.summary?.['หน่วยกิตรวม'];
                        if (!credits || credits === '-') {
                          let cr = 0;
                          subjects.forEach(s => {
                            const c = parseFloat(s['หน่วยกิต']);
                            if (!isNaN(c) && c <= 5.0) cr += c;
                          });
                          credits = cr > 0 ? cr.toFixed(1) : '-';
                        }

                        return (
                          <tr 
                            key={semName} 
                            className={`summary-row ${isCurrent ? 'active' : ''}`}
                            onClick={() => setSelectedSemester(semName)}
                            title="คลิกเพื่อเลือกดูเทอมนี้"
                          >
                            <td className="sem-name-cell">
                              <span className={`sem-active-dot ${isCurrent ? 'on' : ''}`}></span>
                              <span className="font-semibold">{semName}</span>
                            </td>
                            <td className="center-cell font-mono">{credits}</td>
                            <td className="center-cell font-mono font-bold gpa-highlight">{formattedGpa}</td>
                            <td className="center-cell font-mono">{roomRank}</td>
                            <td className="center-cell font-mono">{levelRank}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Filter and Control Bar */}
            <div className="sgs-controls-card glass no-print">
              
              {/* Semester Selector */}
              <div className="control-group">
                <label>
                  <Calendar size={15} />
                  <span>ปีการศึกษาและภาคเรียน:</span>
                </label>
                <div className="semester-chips">
                  <button
                    type="button"
                    className={`sem-chip ${selectedSemester === 'ALL' ? 'on' : ''}`}
                    onClick={() => setSelectedSemester('ALL')}
                  >
                    ทั้งหมด ({availableSemesters.length} เทอม)
                  </button>
                  {availableSemesters.map(sem => (
                    <button
                      key={sem}
                      type="button"
                      className={`sem-chip ${selectedSemester === sem ? 'on' : ''}`}
                      onClick={() => setSelectedSemester(sem)}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Subject Type Filter */}
              <div className="control-row-secondary">
                
                {/* Search Box */}
                <div className="sgs-search-box">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text"
                    placeholder="ค้นหาชื่อวิชา หรือ รหัสวิชา..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Subject Type Filter Chips */}
                <div className="type-chips">
                  <button 
                    type="button" 
                    className={`type-chip ${gradeFilter === 'ALL' ? 'on' : ''}`}
                    onClick={() => setGradeFilter('ALL')}
                  >
                    ทั้งหมด
                  </button>
                  <button 
                    type="button" 
                    className={`type-chip ${gradeFilter === 'ACADEMIC' ? 'on' : ''}`}
                    onClick={() => setGradeFilter('ACADEMIC')}
                  >
                    วิชาวิชาการ (0-4)
                  </button>
                  <button 
                    type="button" 
                    className={`type-chip ${gradeFilter === 'ACTIVITY' ? 'on' : ''}`}
                    onClick={() => setGradeFilter('ACTIVITY')}
                  >
                    กิจกรรมพัฒนาผู้เรียน (ผ)
                  </button>
                </div>

              </div>
            </div>

            {/* Grades Table Section */}
            <div className="sgs-table-card glass">
              
              <div className="table-header-row">
                <div className="th-title-group">
                  <h2>ผลการเรียนและคะแนนเก็บรายวิชา</h2>
                  <span className="th-count-badge">แสดง {filteredSubjects.length} รายการ</span>
                </div>
                
                <div className="th-controls-wrap no-print">
                  {/* View Mode Toggle */}
                  <div className="view-mode-toggle">
                    <button
                      type="button"
                      className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                      title="แสดงแบบตารางสรุป"
                    >
                      <List size={14} />
                      <span>ตาราง</span>
                    </button>
                    <button
                      type="button"
                      className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setViewMode('cards')}
                      title="แสดงแบบการ์ดสรุป"
                    >
                      <LayoutGrid size={14} />
                      <span>การ์ด</span>
                    </button>
                  </div>

                  {/* Toggle Sub-Scores in Table Mode */}
                  {viewMode === 'table' && (
                    <label className="subscore-toggle-label no-print" title="แสดง/ซ่อน คะแนนเก็บย่อย 4 ช่วง">
                      <input 
                        type="checkbox" 
                        checked={showSubScores} 
                        onChange={(e) => setShowSubScores(e.target.checked)} 
                      />
                      <span>ดูคะแนนย่อย</span>
                    </label>
                  )}

                  <div className="table-legend">
                    <span className="legend-item"><span className="legend-dot g4"></span> 4.0</span>
                    <span className="legend-item"><span className="legend-dot g3"></span> 3.0-3.5</span>
                    <span className="legend-item"><span className="legend-dot g2"></span> 2.0-2.5</span>
                    <span className="legend-item"><span className="legend-dot g-pass"></span> ผ</span>
                  </div>
                </div>
              </div>

              {filteredSubjects.length > 0 ? (
                <>
                  {/* ================= 1. MOBILE & DESKTOP CARD VIEW ================= */}
                  {viewMode === 'cards' && (
                    <div className="sgs-cards-list">
                      {filteredSubjects.map((sub, idx) => {
                        const badge = getGradeBadge(sub['เกรด']);
                        const totalScoreRaw = sub['ร้อยละ'] || (sub['คะแนนรวม'] ? sub['คะแนนรวม'].split('/')[0] : '0');
                        const totalScoreNum = parseFloat(totalScoreRaw) || 0;
                        const isActivity = sub['เกรด'] === 'ผ' || sub['เกรด'] === 'มผ';

                        return (
                          <div key={idx} className="sgs-subject-card glass">
                            {/* Card Top Row */}
                            <div className="card-top-header">
                              <div className="code-badge-group">
                                <span className="subject-code-badge font-mono">{sub['รหัสวิชา']}</span>
                                {sub['หน่วยกิต'] && (
                                  <span className="credit-pill">{sub['หน่วยกิต']} นก.</span>
                                )}
                                {selectedSemester === 'ALL' && sub['ปีและภาคเรียน'] && (
                                  <span className="sem-sub-tag">{sub['ปีและภาคเรียน']}</span>
                                )}
                              </div>
                              <span 
                                className="grade-pill-large"
                                style={{
                                  backgroundColor: badge.bg,
                                  borderColor: badge.border,
                                  color: badge.color
                                }}
                              >
                                {badge.text}
                              </span>
                            </div>

                            {/* Subject Title */}
                            <h3 className="card-subject-name">{sub['ชื่อวิชา']}</h3>

                            {/* Total Score Progress Bar (Academic Only) */}
                            {!isActivity && totalScoreNum > 0 && (
                              <div className="score-progress-wrap">
                                <div className="score-progress-bar">
                                  <div 
                                    className="score-progress-fill"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, totalScoreNum))}%`,
                                      background: totalScoreNum >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                                                 totalScoreNum >= 70 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' :
                                                 totalScoreNum >= 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                                                       'linear-gradient(90deg, #ef4444, #f87171)'
                                    }}
                                  />
                                </div>
                                <div className="score-progress-label">
                                  <span>คะแนนรวม: <strong>{sub['คะแนนรวม'] || `${totalScoreNum}/100`}</strong></span>
                                  <span className="pct-num">{totalScoreNum.toFixed(1)}%</span>
                                </div>
                              </div>
                            )}

                            {/* Step Breakdown Grid */}
                            <div className="scores-grid-breakdown">
                              <div className="score-step-box">
                                <span className="step-title">ก่อนกลางภาค</span>
                                <span className="step-val">{sub['ก่อนกลางภาค'] || '-'}</span>
                              </div>
                              <div className="score-step-box">
                                <span className="step-title">สอบกลางภาค</span>
                                <span className="step-val highlight">{sub['สอบกลางภาค'] || '-'}</span>
                              </div>
                              <div className="score-step-box">
                                <span className="step-title">หลังกลางภาค</span>
                                <span className="step-val">{sub['หลังกลางภาค'] || '-'}</span>
                              </div>
                              <div className="score-step-box">
                                <span className="step-title">สอบปลายภาค</span>
                                <span className="step-val highlight">{sub['สอบปลายภาค'] || '-'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ================= 2. TRADITIONAL & SIMPLE TABLE VIEW (OR PRINT) ================= */}
                  <div className={`sgs-table-responsive ${viewMode === 'cards' ? 'desktop-table-hidden' : ''}`}>
                    <table className="sgs-grades-table">
                      <thead>
                        <tr>
                          <th style={{ width: showSubScores ? '10%' : '18%' }}>รหัสวิชา</th>
                          <th style={{ width: showSubScores ? '25%' : '44%' }}>ชื่อรายวิชา</th>
                          <th style={{ width: showSubScores ? '8%' : '12%', textAlign: 'center' }}>หน่วยกิต</th>
                          {showSubScores && (
                            <>
                              <th style={{ width: '10%', textAlign: 'center' }}>ก่อนกลางภาค</th>
                              <th style={{ width: '9%', textAlign: 'center' }}>สอบกลางภาค</th>
                              <th style={{ width: '10%', textAlign: 'center' }}>หลังกลางภาค</th>
                              <th style={{ width: '9%', textAlign: 'center' }}>สอบปลายภาค</th>
                            </>
                          )}
                          <th style={{ width: showSubScores ? '10%' : '14%', textAlign: 'center' }}>คะแนนรวม</th>
                          <th style={{ width: showSubScores ? '9%' : '12%', textAlign: 'center' }}>เกรด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubjects.map((sub, idx) => {
                          const badge = getGradeBadge(sub['เกรด']);
                          return (
                            <tr key={idx} className="grade-row">
                              <td className="code-cell font-mono font-bold">{sub['รหัสวิชา']}</td>
                              <td className="name-cell">
                                <span className="subject-title">{sub['ชื่อวิชา']}</span>
                                <span className="subject-sem-tag">{sub['ปีและภาคเรียน']}</span>
                              </td>
                              <td className="center-cell font-mono">{sub['หน่วยกิต']}</td>
                              {showSubScores && (
                                <>
                                  <td className="center-cell score-cell">{sub['ก่อนกลางภาค'] || '-'}</td>
                                  <td className="center-cell score-cell">{sub['สอบกลางภาค'] || '-'}</td>
                                  <td className="center-cell score-cell">{sub['หลังกลางภาค'] || '-'}</td>
                                  <td className="center-cell score-cell">{sub['สอบปลายภาค'] || '-'}</td>
                                </>
                              )}
                              <td className="center-cell font-bold total-score-cell">{sub['คะแนนรวม'] || '-'}</td>
                              <td className="center-cell">
                                <span 
                                  className="grade-pill"
                                  style={{
                                    backgroundColor: badge.bg,
                                    borderColor: badge.border,
                                    color: badge.color
                                  }}
                                >
                                  {badge.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="sgs-empty-table">
                  <Search size={36} color="rgba(255,255,255,0.3)" />
                  <p>ไม่พบรายวิชาที่ตรงกับเงื่อนไขการค้นหา</p>
                  <button 
                    type="button" 
                    className="reset-search-btn"
                    onClick={() => { setSearchQuery(''); setGradeFilter('ALL'); }}
                  >
                    ล้างการค้นหา
                  </button>
                </div>
              )}

            </div>

            {/* Print Footer Notice */}
            <div className="print-footer-notice">
              <p>เอกสารสรุปผลการเรียนออนไลน์ โรงเรียนสตรีอ่างทอง พิมพ์จากระบบ DEK SA Platform (SGS Integration)</p>
              <p>วันที่พิมพ์: {new Date().toLocaleString('th-TH')}</p>
            </div>

          </div>
        )}

      </div>

      {/* ================= STYLES ================= */}
      <style>{`
        .sgs-page-root {
          min-height: 100vh;
          background-color: transparent;
          color: #ffffff;
          font-family: -apple-system, "SF Pro Display", "Plus Jakarta Sans", "Prompt", system-ui, sans-serif;
          padding-bottom: 5rem;
        }

        .sgs-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1.5rem 1.25rem;
        }

        /* Top Breadcrumb */
        .sgs-top-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: #9b9bb0;
          margin-bottom: 1.5rem;
        }

        .sgs-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 0;
          color: #9b9bb0;
          cursor: pointer;
          font-size: 13.5px;
          font-family: inherit;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .sgs-back-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .sgs-breadcrumb-current {
          color: #ffffff;
          font-weight: 600;
        }

        /* Glassmorphism style */
        .glass {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        /* Auth Gate (Login Required) */
        .sgs-auth-gate-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 3rem 0 4rem;
        }

        .sgs-auth-gate-card {
          width: 100%;
          max-width: 460px;
          border-radius: 28px;
          padding: 2.75rem 2.25rem;
          text-align: center;
          position: relative;
        }

        .auth-gate-icon-circle {
          width: 76px;
          height: 76px;
          border-radius: 26px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(37, 99, 235, 0.4));
          border: 1px solid rgba(59, 130, 246, 0.45);
          display: grid;
          place-items: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 28px rgba(59, 130, 246, 0.3);
        }

        .auth-gate-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.65rem;
        }

        .auth-gate-desc {
          font-size: 0.92rem;
          color: #a1a1aa;
          line-height: 1.55;
          margin-bottom: 1.75rem;
        }

        .auth-gate-features {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          margin-bottom: 2rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .auth-gate-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          color: #e4e4e7;
        }

        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 8px #3b82f6;
          flex-shrink: 0;
        }

        .auth-gate-btn-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .auth-gate-login-btn {
          width: 100%;
          height: 48px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
          transition: all 0.2s ease;
        }

        .auth-gate-login-btn:hover {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          box-shadow: 0 6px 22px rgba(37, 99, 235, 0.55);
          transform: translateY(-1px);
        }

        .auth-gate-login-btn:active {
          transform: scale(0.98);
        }

        .auth-gate-back-btn {
          width: 100%;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #a1a1aa;
          font-size: 0.88rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auth-gate-back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        /* Login Card */
        .sgs-login-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem 0;
        }

        .sgs-login-card {
          width: 100%;
          max-width: 480px;
          border-radius: 28px;
          padding: 2.25rem 2rem;
          position: relative;
        }

        .sgs-login-header {
          text-align: center;
          margin-bottom: 1.75rem;
        }

        .sgs-icon-badge {
          width: 68px;
          height: 68px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.35));
          border: 1px solid rgba(59, 130, 246, 0.4);
          display: grid;
          place-items: center;
          margin: 0 auto 1.25rem;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
        }

        .sgs-login-title {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          margin: 0 0 0.5rem;
          color: #ffffff;
        }

        .sgs-login-sub {
          font-size: 13.5px;
          color: #9b9bb0;
          line-height: 1.5;
          margin: 0;
        }

        .sgs-error-box {
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          font-size: 13.5px;
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sgs-saved-account-box {
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 14px;
          padding: 10px 14px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .saved-acc-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #bfdbfe;
        }

        .saved-acc-quick-btn {
          background: #2563eb;
          color: #ffffff;
          border: 0;
          font-size: 12.5px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .saved-acc-quick-btn:hover {
          background: #3b82f6;
          transform: translateY(-1px);
        }

        .sgs-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .sgs-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sgs-input-group label {
          font-size: 13.5px;
          font-weight: 600;
          color: #d4d4d8;
        }

        .sgs-input-field {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          color: #71717a;
          pointer-events: none;
        }

        .sgs-input-field input {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          padding: 12px 42px 12px 42px;
          color: #ffffff;
          font-size: 14.5px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .sgs-input-field input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          background: rgba(255, 255, 255, 0.09);
        }

        .pwd-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: 0;
          color: #71717a;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .pwd-toggle-btn:hover {
          color: #ffffff;
        }

        .input-hint {
          font-size: 11.5px;
          color: #71717a;
          line-height: 1.4;
          margin-top: 2px;
        }

        .sgs-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #a1a1aa;
          cursor: pointer;
          user-select: none;
        }

        .sgs-checkbox-row input {
          margin-top: 3px;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        .sgs-submit-btn {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: 0;
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          padding: 13px;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 4px;
        }

        .sgs-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 26px rgba(37, 99, 235, 0.55);
        }

        .sgs-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .sgs-demo-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: #71717a;
          font-size: 12px;
          margin: 6px 0;
        }

        .sgs-demo-divider::before, .sgs-demo-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sgs-demo-divider span {
          padding: 0 10px;
        }

        .sgs-demo-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          padding: 10px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .sgs-demo-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .sgs-storage-notice {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12px;
          color: #9b9bb0;
          line-height: 1.5;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        /* ================= DASHBOARD STYLES ================= */
        .sgs-dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Profile Banner */
        .sgs-profile-banner {
          border-radius: 24px;
          padding: 1.5rem 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.25rem;
        }

        .profile-main-info {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .profile-avatar-circle {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: linear-gradient(135deg, #2563eb, #1e40af);
          display: grid;
          place-items: center;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
          flex-shrink: 0;
        }

        .profile-tag-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .student-badge {
          font-size: 11.5px;
          font-weight: 700;
          background: rgba(59, 130, 246, 0.18);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.35);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .cache-status-badge {
          font-size: 11.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .cache-status-badge.from-cache {
          background: rgba(16, 185, 129, 0.16);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .cache-status-badge.fresh {
          background: rgba(245, 158, 11, 0.16);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .student-name-title {
          font-size: 1.45rem;
          font-weight: 800;
          margin: 2px 0 4px;
          color: #ffffff;
        }

        .student-meta-sub {
          font-size: 13px;
          color: #9b9bb0;
          margin: 0;
        }

        .profile-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sgs-act-btn {
          border: 0;
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .sgs-act-btn.sync {
          background: #2563eb;
          color: #ffffff;
        }

        .sgs-act-btn.sync:hover:not(:disabled) {
          background: #3b82f6;
          transform: translateY(-1px);
        }

        .sgs-act-btn.print, .sgs-act-btn.export {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #ffffff;
        }

        .sgs-act-btn.print:hover, .sgs-act-btn.export:hover {
          background: rgba(255, 255, 255, 0.16);
          transform: translateY(-1px);
        }

        .sgs-act-btn.logout {
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .sgs-act-btn.logout:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        /* Stats Grid */
        .sgs-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .stat-card {
          border-radius: 20px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .stat-icon-circle.gpa-icon { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); }
        .stat-icon-circle.room-icon { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); }
        .stat-icon-circle.level-icon { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.35); }
        .stat-icon-circle.cred-icon { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12.5px;
          color: #9b9bb0;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 2px 0 1px;
        }

        .gpa-num { color: #facc15; }
        .room-num { color: #60a5fa; }
        .level-num { color: #c084fc; }
        .cred-num { color: #34d399; }
        .stat-unit { font-size: 13px; font-weight: 500; color: #a1a1aa; }

        .stat-sub {
          font-size: 11.5px;
          color: #71717a;
        }

        /* Controls Card */
        .sgs-controls-card {
          border-radius: 20px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #d4d4d8;
        }

        .semester-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sem-chip {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #d4d4d8;
          font-size: 13px;
          font-family: inherit;
          padding: 6px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sem-chip:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
        }

        .sem-chip.on {
          background: #2563eb;
          color: #ffffff;
          border-color: #3b82f6;
          font-weight: 600;
        }

        .control-row-secondary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1rem;
        }

        .sgs-search-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1 1 260px;
          max-width: 360px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #71717a;
          pointer-events: none;
        }

        .sgs-search-box input {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 8px 36px 8px 36px;
          color: #ffffff;
          font-size: 13.5px;
          font-family: inherit;
          outline: none;
        }

        .sgs-search-box input:focus {
          border-color: #3b82f6;
        }

        .clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: 0;
          color: #71717a;
          cursor: pointer;
          padding: 2px;
        }

        .type-chips {
          display: flex;
          gap: 6px;
        }

        .type-chip {
          background: none;
          border: 0;
          color: #a1a1aa;
          font-size: 12.5px;
          font-family: inherit;
          padding: 5px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .type-chip:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
        }

        .type-chip.on {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          font-weight: 600;
        }

        /* Semester Summary Table Card */
        .sgs-summary-table-card {
          border-radius: 20px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.25rem;
        }

        .summary-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
          gap: 6px;
        }

        .summary-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .summary-table-title {
          font-weight: 700;
          font-size: 14px;
          color: #ffffff;
        }

        .summary-table-hint {
          font-size: 11.5px;
          color: #71717a;
        }

        .sgs-summary-mini-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .sgs-summary-mini-table th {
          background: rgba(255, 255, 255, 0.04);
          color: #a1a1aa;
          font-weight: 600;
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12px;
        }

        .sgs-summary-mini-table td {
          padding: 9px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #e4e4e7;
        }

        .summary-row {
          transition: background 0.15s;
          cursor: pointer;
        }

        .summary-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .summary-row.active {
          background: rgba(59, 130, 246, 0.15);
        }

        .sem-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ffffff;
        }

        .sem-active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
        }

        .sem-active-dot.on {
          background: #3b82f6;
          box-shadow: 0 0 8px #3b82f6;
        }

        .gpa-highlight {
          color: #facc15;
          font-weight: 700;
        }

        /* Subscore Toggle Checkbox */
        .subscore-toggle-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #a1a1aa;
          cursor: pointer;
          user-select: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 4px 10px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .subscore-toggle-label:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .subscore-toggle-label input {
          accent-color: #3b82f6;
          cursor: pointer;
        }

        /* Table Card */
        .sgs-table-card {
          border-radius: 24px;
          overflow: hidden;
          padding: 1.5rem;
        }

        .table-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 1.25rem;
        }

        .th-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .th-title-group h2 {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
        }

        .th-count-badge {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.08);
          color: #a1a1aa;
          padding: 2px 10px;
          border-radius: 999px;
        }

        .th-controls-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* View Mode Toggle Button Group */
        .view-mode-toggle {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 3px;
          border-radius: 12px;
          gap: 3px;
        }

        .view-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 0;
          color: #9b9bb0;
          font-size: 12.5px;
          font-weight: 500;
          font-family: inherit;
          padding: 5px 12px;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .view-toggle-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }

        .view-toggle-btn.active {
          background: #2563eb;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.4);
        }

        .table-legend {
          display: flex;
          gap: 10px;
          font-size: 12px;
          color: #9b9bb0;
          align-items: center;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.g4 { background: #10b981; }
        .legend-dot.g3 { background: #3b82f6; }
        .legend-dot.g2 { background: #f59e0b; }
        .legend-dot.g-pass { background: #8b5cf6; }

        /* ================= MOBILE & DESKTOP CARD VIEW ================= */
        .sgs-cards-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 14px;
          margin-bottom: 0.5rem;
        }

        .sgs-subject-card {
          border-radius: 18px;
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s, border-color 0.2s;
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sgs-subject-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
        }

        .card-top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .code-badge-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .subject-code-badge {
          font-size: 11.5px;
          font-weight: 700;
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 2px 8px;
          border-radius: 6px;
          letter-spacing: 0.02em;
        }

        .credit-pill {
          font-size: 11px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.06);
          color: #d4d4d8;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2px 7px;
          border-radius: 6px;
        }

        .sem-sub-tag {
          font-size: 10.5px;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 5px;
        }

        .grade-pill-large {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 32px;
          padding: 0 10px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 15px;
          border: 1px solid;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          flex-shrink: 0;
        }

        .card-subject-name {
          font-size: 14.5px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .score-progress-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(0, 0, 0, 0.25);
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .score-progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          overflow: hidden;
        }

        .score-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .score-progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
          color: #a1a1aa;
        }

        .score-progress-label strong {
          color: #ffffff;
        }

        .pct-num {
          font-weight: 700;
          color: #93c5fd;
          font-family: monospace;
        }

        .scores-grid-breakdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          background: rgba(0, 0, 0, 0.28);
          padding: 8px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .score-step-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2px;
        }

        .step-title {
          font-size: 9.5px;
          color: #71717a;
          white-space: nowrap;
        }

        .step-val {
          font-size: 13px;
          font-weight: 700;
          color: #e4e4e7;
          font-family: monospace;
        }

        .step-val.highlight {
          color: #60a5fa;
        }

        .desktop-table-hidden {
          display: none;
        }

        /* ================= TABLE VIEW STYLES ================= */
        .sgs-table-responsive {
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .sgs-grades-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }

        .sgs-grades-table th {
          background: rgba(255, 255, 255, 0.04);
          color: #a1a1aa;
          font-weight: 600;
          padding: 12px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          white-space: nowrap;
        }

        .sgs-grades-table td {
          padding: 13px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          vertical-align: middle;
        }

        .grade-row:hover td {
          background: rgba(255, 255, 255, 0.03);
        }

        .code-cell {
          color: #93c5fd;
        }

        .name-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .subject-title {
          font-weight: 600;
          color: #ffffff;
        }

        .subject-sem-tag {
          font-size: 11px;
          color: #71717a;
        }

        .center-cell {
          text-align: center;
        }

        .score-cell {
          color: #d4d4d8;
        }

        .total-score-cell {
          color: #ffffff;
        }

        .grade-pill {
          display: inline-block;
          min-width: 44px;
          padding: 3px 8px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12.5px;
          border: 1px solid;
          text-align: center;
        }

        .sgs-empty-table {
          text-align: center;
          padding: 3.5rem 1rem;
          color: #9b9bb0;
        }

        .reset-search-btn {
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 7px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }

        .reset-search-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .print-footer-notice {
          display: none;
        }

        /* ================= RESPONSIVE MOBILE STYLES ================= */
        @media (max-width: 840px) {
          .sgs-profile-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.25rem;
          }
          .profile-actions {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .sgs-act-btn {
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .sgs-container {
            padding: 1rem 0.75rem;
          }
          .sgs-top-nav {
            margin-bottom: 1rem;
          }
          .sgs-login-wrapper {
            padding: 1rem 0;
          }
          .sgs-login-card {
            padding: 1.5rem 1.15rem;
            border-radius: 22px;
          }
          .sgs-icon-badge {
            width: 58px;
            height: 58px;
            border-radius: 18px;
            margin-bottom: 1rem;
          }
          .sgs-login-title {
            font-size: 1.35rem;
          }
          .sgs-login-sub {
            font-size: 12.5px;
          }
          .sgs-input-field input {
            font-size: 16px; /* Prevents auto-zoom in iOS Safari */
            padding: 11px 40px 11px 40px;
          }

          /* Profile Banner Compact */
          .profile-avatar-circle {
            width: 50px;
            height: 50px;
            border-radius: 15px;
          }
          .student-name-title {
            font-size: 1.25rem;
          }
          .student-meta-sub {
            font-size: 12px;
          }

          /* Stats Grid: 2 Columns on Mobile */
          .sgs-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 12px 0 16px;
          }
          .stat-card {
            padding: 10px 12px;
            border-radius: 16px;
            gap: 10px;
          }
          .stat-icon-circle {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }
          .stat-icon-circle svg {
            width: 20px;
            height: 20px;
          }
          .stat-label {
            font-size: 11px;
          }
          .stat-value {
            font-size: 1.45rem;
          }
          .stat-sub {
            font-size: 10.5px;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Controls Card on Mobile */
          .sgs-controls-card {
            padding: 12px 14px;
            border-radius: 18px;
            margin-bottom: 14px;
            gap: 12px;
          }
          .semester-chips {
            display: flex;
            overflow-x: auto;
            white-space: nowrap;
            flex-wrap: nowrap;
            gap: 6px;
            padding-bottom: 4px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .semester-chips::-webkit-scrollbar {
            display: none;
          }
          .sem-chip {
            font-size: 12px;
            padding: 5px 12px;
            flex-shrink: 0;
          }
          .control-row-secondary {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding-top: 10px;
          }
          .sgs-search-box {
            max-width: 100%;
            flex: 1 1 100%;
          }
          .type-chips {
            display: flex;
            overflow-x: auto;
            white-space: nowrap;
            gap: 6px;
            scrollbar-width: none;
          }
          .type-chip {
            font-size: 11.5px;
            padding: 5px 10px;
            flex-shrink: 0;
          }

          /* Summary Table on Mobile */
          .sgs-summary-table-card {
            padding: 10px 12px;
            border-radius: 16px;
            margin-bottom: 12px;
          }
          .sgs-summary-mini-table {
            font-size: 11px;
          }
          .sgs-summary-mini-table th, .sgs-summary-mini-table td {
            padding: 6px 5px;
          }
          .subscore-toggle-label {
            font-size: 11px;
            padding: 3px 8px;
          }

          /* Table Card & Header on Mobile */
          .sgs-table-card {
            padding: 12px 10px;
            border-radius: 18px;
          }
          .table-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 12px;
          }
          .th-title-group h2 {
            font-size: 1.1rem;
          }
          .th-controls-wrap {
            width: 100%;
            justify-content: space-between;
          }
          .table-legend {
            font-size: 11px;
            gap: 7px;
          }

          /* Mobile Cards List */
          .sgs-cards-list {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .sgs-subject-card {
            padding: 12px 14px;
            border-radius: 16px;
            gap: 9px;
          }
          .card-subject-name {
            font-size: 13.5px;
          }
          .scores-grid-breakdown {
            gap: 4px;
            padding: 7px 6px;
          }
          .step-title {
            font-size: 9px;
          }
          .step-val {
            font-size: 12px;
          }

          /* Mobile Table fallback */
          .sgs-grades-table {
            font-size: 11.5px;
          }
          .sgs-grades-table th {
            padding: 8px 6px;
            font-size: 11px;
          }
          .sgs-grades-table td {
            padding: 8px 6px;
          }
          .grade-pill {
            min-width: 36px;
            padding: 2px 6px;
            font-size: 11px;
          }
        }

        @media (max-width: 440px) {
          .profile-actions {
            grid-template-columns: 1fr 1fr;
          }
          .sgs-act-btn {
            font-size: 11.5px;
            padding: 7px 8px;
          }
          .student-name-title {
            font-size: 1.15rem;
          }
          .stat-value {
            font-size: 1.35rem;
          }
          .stat-icon-circle {
            width: 36px;
            height: 36px;
          }
          .table-legend {
            display: none; /* Hide legend on extra small screens to save space */
          }
          .scores-grid-breakdown {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          .score-step-box {
            padding: 2px 4px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 6px;
          }
        }

        /* ================= PRINT MEDIA STYLES ================= */
        @media print {
          .no-print {
            display: none !important;
          }
          .desktop-table-hidden {
            display: block !important;
          }
          .sgs-cards-list {
            display: none !important;
          }
          .sgs-page-root {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
          }
          .glass {
            background: #ffffff !important;
            border: 1px solid #d4d4d8 !important;
            box-shadow: none !important;
            color: #000000 !important;
          }
          .sgs-grades-table th {
            background: #f4f4f5 !important;
            color: #000000 !important;
            border-bottom: 2px solid #000000 !important;
          }
          .sgs-grades-table td {
            color: #000000 !important;
            border-bottom: 1px solid #e4e4e7 !important;
          }
          .student-name-title, .subject-title, .total-score-cell {
            color: #000000 !important;
          }
          .print-footer-notice {
            display: block !important;
            margin-top: 2rem;
            font-size: 11px;
            color: #71717a;
            border-top: 1px solid #d4d4d8;
            padding-top: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SGSGrades;
