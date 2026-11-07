import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamById, saveExamResult } from '../store/mockDb';
import SecureWrapper from '../components/SecureWrapper';
import { Clock, AlertCircle } from 'lucide-react';

const ExamPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('deksa_user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [navigate]);

  useEffect(() => {
    const loadExam = async () => {
      const foundExam = await getExamById(id);
      if (!foundExam) {
        alert('ไม่พบข้อสอบ');
        navigate('/student');
        return;
      }
      setExam(foundExam);
      setTimeLeft(foundExam.duration * 60); // minutes to seconds
    };
    loadExam();
  }, [id, navigate]);

  // Timer
  useEffect(() => {
    if (!exam || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, isSubmitted]);

  // Anti-Cheat (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted && exam) {
        alert("⚠️ ตรวจพบการสลับหน้าจอหรือพับหน้าต่าง!\n\nเพื่อเป็นการป้องกันการทุจริต ระบบจะลบคำตอบทั้งหมดของคุณและบังคับให้ออกจากห้องสอบทันที");
        navigate('/student');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSubmitted, exam, navigate]);

  const handleOptionSelect = (qIndex, oIndex) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [qIndex]: oIndex });
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const confirmMsg = Object.keys(answers).length < exam.questions.length 
        ? 'คุณยังทำข้อสอบไม่ครบทุกข้อ แน่ใจหรือไม่ว่าจะส่งข้อสอบ?' 
        : 'คุณแน่ใจหรือไม่ที่จะส่งข้อสอบ?';
      if (!window.confirm(confirmMsg)) return;
    }

    let calculatedScore = 0;
    exam.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOption) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    // Save exam result
    if (user) {
      const resultData = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        examId: exam.id,
        examTitle: exam.title,
        userId: user.id,
        userName: user.name,
        score: calculatedScore,
        totalQuestions: exam.questions.length,
        timestamp: new Date().toISOString()
      };
      await saveExamResult(resultData);
    }
  };

  if (!exam) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลด...</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isSubmitted) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', width: '90%' }}>
          <h2 style={{ marginBottom: '1rem' }}>ส่งข้อสอบเรียบร้อยแล้ว</h2>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '1rem' }}>
            {score} / {exam.questions.length}
          </div>
          <p style={{ marginBottom: '2rem' }}>คะแนนของคุณได้ถูกบันทึกในระบบแล้ว</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/exam-leaderboard/${exam.id}`)}>
              ดูตารางจัดอันดับ (Leaderboard)
            </button>
            <button className="btn" style={{ background: '#27272a', color: 'white' }} onClick={() => navigate('/student')}>
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SecureWrapper isSecureMode={true}>
      <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'var(--bg-color)', paddingBottom: '5rem' }}>
        {/* Header */}
        <div style={{ 
          position: 'sticky', top: 0, background: '#18181b', padding: '1rem 2rem', 
          borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', zIndex: 100 
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'white' }}>{exam.title}</h2>
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>วิชานี้มีการเปิดระบบป้องกันการทุจริต</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: timeLeft < 300 ? '#ef4444' : 'white' }}>
              <Clock /> {formatTime(timeLeft)}
            </div>
            <button className="btn btn-primary" onClick={() => handleSubmit(false)}>ส่งข้อสอบ</button>
          </div>
        </div>

        {/* Warning Banner */}
        <div style={{ background: '#450a0a', padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #7f1d1d', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', fontSize: '0.875rem' }}>
          <AlertCircle size={16} />
          ห้ามคัดลอกข้อความ แคปหน้าจอ หรือสลับหน้าต่างระหว่างการสอบเด็ดขาด ระบบมีการบันทึกพฤติกรรมทั้งหมด (สลับหน้าต่าง = ล้างคำตอบทันที)
        </div>

        {/* Questions container */}
        <div className="container" style={{ paddingTop: '2rem' }}>
          {exam.questions.map((q, qIndex) => (
            <div key={q.id} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>ข้อที่ {qIndex + 1}. {q.text}</h3>
              
              {q.imageUrl && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <img src={q.imageUrl} alt={`ภาพประกอบข้อที่ ${qIndex + 1}`} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {q.options.map((opt, oIndex) => {
                  const isSelected = answers[qIndex] === oIndex;
                  return (
                    <div 
                      key={oIndex}
                      onClick={() => handleOptionSelect(qIndex, oIndex)}
                      style={{ 
                        padding: '1rem 1.5rem', 
                        border: `2px solid ${isSelected ? 'var(--primary-color)' : '#27272a'}`, 
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(37, 99, 235, 0.1)' : '#18181b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ 
                        width: '20px', height: '20px', borderRadius: '50%', 
                        border: `2px solid ${isSelected ? 'var(--primary-color)' : '#52525b'}`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                      }}>
                        {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-color)' }} />}
                      </div>
                      <span style={{ fontSize: '1rem' }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SecureWrapper>
  );
};

export default ExamPlayer;
