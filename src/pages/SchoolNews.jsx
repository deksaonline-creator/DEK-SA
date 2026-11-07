import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Calendar, ChevronLeft, ExternalLink, Rss } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const SchoolNews = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // We use the proxy configured in vite.config.js
        const response = await fetch('/api/news?format=feed&type=rss');
        
        if (!response.ok) {
          throw new Error('Failed to fetch news feed');
        }
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const items = Array.from(xmlDoc.querySelectorAll('item'));
        
        const parsedNews = items.map(item => ({
          id: item.querySelector('guid')?.textContent || Math.random().toString(),
          title: item.querySelector('title')?.textContent || 'ไม่มีหัวข้อ',
          link: item.querySelector('link')?.textContent || '#',
          pubDate: item.querySelector('pubDate')?.textContent || '',
          description: item.querySelector('description')?.textContent || '',
          category: item.querySelector('category')?.textContent || 'ข่าวประชาสัมพันธ์'
        }));
        
        setNews(parsedNews);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching RSS:', err);
        setError('ไม่สามารถโหลดข้อมูลข่าวสารได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <PageTransition>
      <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white', padding: '2rem 5%' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <button 
            onClick={() => navigate('/')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'none', 
              border: 'none', 
              color: '#a1a1aa', 
              cursor: 'pointer',
              marginBottom: '2rem',
              padding: 0
            }}
            onMouseEnter={e => e.target.style.color='white'} 
            onMouseLeave={e => e.target.style.color='#a1a1aa'}
          >
            <ChevronLeft size={20} /> กลับหน้าหลัก
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #2563eb' }}>
              <Megaphone size={28} color="#3b82f6" />
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', margin: 0 }}>ข่าวประชาสัมพันธ์โรงเรียน</h1>
              <p style={{ color: '#a1a1aa', margin: '0.5rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Rss size={16} /> ดึงข้อมูลจากเว็บไซต์ web.sa.ac.th
              </p>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#a1a1aa' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #27272a', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 1rem auto', animation: 'spin 1s linear infinite' }} />
              กำลังโหลดข้อมูลข่าวสาร...
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!loading && !error && news.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#a1a1aa', background: '#18181b', borderRadius: '1rem', border: '1px solid #27272a' }}>
              ไม่มีข้อมูลข่าวสารในขณะนี้
            </div>
          )}

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {!loading && !error && news.map((item) => (
              <a 
                key={item.id} 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  textDecoration: 'none',
                  background: '#18181b', 
                  borderRadius: '1rem', 
                  border: '1px solid #27272a', 
                  padding: '1.5rem 2rem',
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.borderColor = '#2563eb'; 
                  e.currentTarget.style.transform = 'translateY(-3px)'; 
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                }} 
                onMouseLeave={(e) => { 
                  e.currentTarget.style.borderColor = '#27272a'; 
                  e.currentTarget.style.transform = 'none'; 
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                    {item.title}
                  </h3>
                  <ExternalLink size={20} color="#52525b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #27272a' }}>
                  <span style={{ fontSize: '0.85rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                    {item.category}
                  </span>
                  
                  {item.pubDate && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
                      <Calendar size={14} /> {formatDate(item.pubDate)}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
          
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PageTransition>
  );
};

export default SchoolNews;
