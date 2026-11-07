import React, { useState, useEffect } from 'react';
import { getExams, getExamResultsByExamId } from '../../store/mockDb';
import { Search, Trophy, Clock, Medal } from 'lucide-react';

const ExamResultsManager = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      const allExams = await getExams();
      setExams(allExams);
      if (allExams.length > 0) {
        setSelectedExamId(allExams[0].id);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedExamId) return;
      setLoading(true);
      const allResults = await getExamResultsByExamId(selectedExamId);
      
      // Sort by score (desc), then timestamp (asc)
      allResults.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      setResults(allResults);
      setLoading(false);
    };
    fetchResults();
  }, [selectedExamId]);

  const filteredResults = results.filter(r => 
    (r.userName && r.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.userId && r.userId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>ผลการสอบ (Exam Results)</h2>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">เลือกวิชาที่ต้องการดูผลสอบ</label>
            <select 
              className="input-field" 
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {exams.length === 0 && <option value="">ไม่มีข้อมูลวิชาสอบ</option>}
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">ค้นหาชื่อนักเรียน</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="พิมพ์ชื่อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} color="#a1a1aa" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={20} color="#fbbf24" /> 
            สรุปผลคะแนนสอบ
          </h3>
          <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>มีผู้ทำข้อสอบทั้งหมด {results.length} คน</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#a1a1aa' }}>กำลังโหลดข้อมูล...</div>
        ) : filteredResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a1a1aa', border: '1px dashed #3f3f46', borderRadius: '0.5rem' }}>
            ยังไม่มีผู้ทำข้อสอบในวิชานี้ หรือไม่พบชื่อที่ค้นหา
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #27272a', color: '#a1a1aa', fontSize: '0.9rem' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>อันดับ</th>
                  <th style={{ padding: '1rem 0.5rem' }}>ชื่อนักเรียน</th>
                  <th style={{ padding: '1rem 0.5rem' }}>เวลาที่ส่งข้อสอบ</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>คะแนนที่ได้</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, index) => {
                  let rankColor = '#a1a1aa';
                  if (index === 0) rankColor = '#fbbf24';
                  if (index === 1) rankColor = '#94a3b8';
                  if (index === 2) rankColor = '#ea580c';

                  return (
                    <tr key={result.id} style={{ borderBottom: '1px solid #27272a', transition: 'background 0.2s', ':hover': { background: '#27272a' } }}>
                      <td style={{ padding: '1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {index < 3 ? <Medal size={18} color={rankColor} /> : <span style={{ color: '#52525b', paddingLeft: '2px' }}>#{index + 1}</span>}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{result.userName || 'ไม่ระบุ'}</td>
                      <td style={{ padding: '1rem 0.5rem', color: '#a1a1aa', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          {new Date(result.timestamp).toLocaleString('th-TH')}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 'bold', color: index < 3 ? rankColor : '#3b82f6' }}>
                        {result.score} / {result.totalQuestions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResultsManager;
