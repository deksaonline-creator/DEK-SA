import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamById, getExamResultsByExamId } from '../store/mockDb';
import { ArrowLeft, Trophy, Medal, Search, Clock } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const ExamLeaderboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const foundExam = await getExamById(id);
      if (!foundExam) {
        alert('ไม่พบข้อมูลข้อสอบนี้');
        navigate('/student');
        return;
      }
      setExam(foundExam);

      const allResults = await getExamResultsByExamId(id);
      
      // Sort primarily by score (descending), then by timestamp (ascending - earlier submission is better)
      allResults.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      setResults(allResults);
      setLoading(false);
    };

    loadData();
  }, [id, navigate]);

  if (loading) {
    return <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>กำลังโหลดข้อมูล...</div>;
  }

  const getRankStyle = (index) => {
    if (index === 0) return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)' }; // Gold
    if (index === 1) return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)' }; // Silver
    if (index === 2) return { color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', border: 'rgba(234, 88, 12, 0.3)' }; // Bronze
    return { color: '#a1a1aa', bg: '#18181b', border: '#27272a' };
  };

  return (
    <PageTransition>
      <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'white', border: 'none', padding: 0, cursor: 'pointer' }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>จัดอันดับคะแนนสอบ</h2>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', paddingBottom: '4rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6', marginBottom: '1rem' }}>
              <Trophy size={40} color="#3b82f6" />
            </div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'white' }}>{exam.title}</h1>
            <p style={{ color: '#a1a1aa', margin: 0 }}>ทำข้อสอบไปแล้ว {results.length} คน</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#18181b', borderRadius: '1rem', border: '1px solid #27272a', color: '#a1a1aa' }}>
                <Search size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                ยังไม่มีข้อมูลการทำข้อสอบสำหรับวิชานี้
              </div>
            ) : (
              results.map((result, index) => {
                const rankStyle = getRankStyle(index);
                const isTop3 = index < 3;
                
                return (
                  <div 
                    key={result.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '1.5rem', 
                      background: rankStyle.bg, 
                      border: `1px solid ${rankStyle.border}`,
                      borderRadius: '1rem',
                      gap: '1.5rem'
                    }}
                  >
                    {/* Rank Number / Icon */}
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {isTop3 ? (
                        <Medal size={32} color={rankStyle.color} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: rankStyle.color }}>#{index + 1}</span>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isTop3 ? rankStyle.color : 'white', marginBottom: '0.25rem' }}>
                        {result.userName || 'ผู้ใช้งานไม่ระบุชื่อ'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={12} /> {new Date(result.timestamp).toLocaleString('th-TH')}
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isTop3 ? rankStyle.color : '#3b82f6' }}>
                        {result.score} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#a1a1aa' }}>/ {result.totalQuestions}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ExamLeaderboard;
