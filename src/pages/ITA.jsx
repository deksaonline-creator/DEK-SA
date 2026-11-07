import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, ChevronDown, ChevronUp, CheckCircle, ExternalLink } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import Header from '../components/Header';
import { getItas } from '../store/mockDb';

const ITA = () => {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState(0);
  const [itaData, setItaData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItas = async () => {
      const data = await getItas();
      setItaData(data);
      setLoading(false);
    };
    fetchItas();
  }, []);

  return (
    <PageTransition>
      <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white', paddingBottom: '5rem' }}>
        
        {/* Header */}
        <Header />

        {/* Content */}
        <div style={{ padding: '2rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' }}>
              <ShieldCheck size={40} />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-1px' }}>
              การประเมิน <span style={{ color: '#3b82f6' }}>ITA</span>
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              การประเมินคุณธรรมและความโปร่งใสในการดำเนินงานของหน่วยงานภาครัฐ (Integrity and Transparency Assessment)
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#a1a1aa' }}>
                <p>กำลังโหลดข้อมูล...</p>
              </div>
            ) : itaData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#a1a1aa', background: '#18181b', borderRadius: '1rem' }}>
                <p>ยังไม่มีข้อมูลการประเมิน ITA ในขณะนี้</p>
              </div>
            ) : itaData.map((cat, idx) => (
              <div key={idx} style={{ background: '#18181b', borderRadius: '1rem', border: `1px solid ${openCategory === idx ? '#3b82f6' : '#27272a'}`, overflow: 'hidden', transition: 'all 0.3s' }}>
                
                {/* Accordion Header */}
                <div 
                  onClick={() => setOpenCategory(openCategory === idx ? -1 : idx)}
                  style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: openCategory === idx ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: openCategory === idx ? '#60a5fa' : 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={20} color={openCategory === idx ? '#3b82f6' : '#a1a1aa'} />
                    {cat.category}
                  </h3>
                  {openCategory === idx ? <ChevronUp size={24} color="#3b82f6" /> : <ChevronDown size={24} color="#71717a" />}
                </div>

                {/* Accordion Body */}
                <div style={{ maxHeight: openCategory === idx ? '2000px' : '0', overflow: 'hidden', transition: 'max-height 0.4s ease-in-out', background: '#121212' }}>
                  <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {cat.items.map(item => (
                      <a 
                        key={item.id} 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', textDecoration: 'none', color: '#e2e8f0', transition: 'all 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: '#60a5fa', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {item.id}
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{item.title}</span>
                        </div>
                        <ExternalLink size={16} color="#71717a" />
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default ITA;
