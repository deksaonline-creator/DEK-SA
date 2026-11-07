import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams } from '../store/mockDb';
import { ArrowLeft, Clock, FileText, Image as ImageIcon } from 'lucide-react';

const StudentPortal = () => {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadExams = async () => {
      setExams(await getExams());
      window.dispatchEvent(new Event('app-ready'));
    };
    loadExams();
  }, []);

  const handleEnterExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  return (
    <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white', padding: '2rem' }}>
      <button 
        className="btn btn-secondary" 
        style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} 
        onClick={() => navigate('/')}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> กลับหน้าหลัก
      </button>

      <div className="container" style={{ paddingTop: '4rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: '900', color: 'white', margin: 0, position: 'relative', display: 'inline-block' }}>
            เลือกข้อสอบ
            <div style={{ position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '4px', background: '#facc15', borderRadius: '2px' }} />
          </h2>
          <p style={{ color: '#a1a1aa', marginTop: '1.5rem', fontSize: '1.1rem' }}>กรุณาเลือกวิชาที่คุณต้องการสอบจากรายการด้านล่าง</p>
        </div>

        {exams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#18181b', borderRadius: '1rem', border: '1px solid #27272a' }}>
            <p style={{ fontSize: '1.2rem', color: '#71717a' }}>ยังไม่มีข้อสอบในระบบขณะนี้</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {exams.map(exam => (
              <div 
                key={exam.id} 
                onClick={() => handleEnterExam(exam.id)}
                style={{ 
                  background: '#18181b', 
                  borderRadius: '20px', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  border: '1px solid #27272a',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(37, 99, 235, 0.2)';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#27272a';
                }}
              >
                {/* Banner Area */}
                {exam.coverImage ? (
                  <div style={{ 
                    height: '220px', 
                    backgroundImage: `url(${exam.coverImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }} />
                ) : (
                  <div style={{ 
                    height: '220px', 
                    background: '#1f1f22',
                    borderBottom: '1px solid #27272a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ImageIcon size={48} color="#52525b" />
                  </div>
                )}
                
                {/* Content Area */}
                <div style={{ padding: '1.5rem 2rem 2.5rem 2rem', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>{exam.title}</h3>
                  
                  {/* Pseudo 'XXXXXXXXX' styling as requested in the image */}
                  <div style={{ color: '#52525b', fontSize: '0.6rem', letterSpacing: '2px', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br/>
                    XXXXXXXXXXXXXXXXXXXXXXXXX<br/>
                    XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', color: '#a1a1aa', fontSize: '0.95rem', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} color="#facc15" />
                      <span>{exam.questions?.length || 0} ข้อ</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={18} color="#2563eb" />
                      <span>{exam.duration} นาที</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortal;
