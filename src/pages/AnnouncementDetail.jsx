import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Megaphone } from 'lucide-react';
import { getAnnouncements } from '../store/mockDb';
import PageTransition from '../components/PageTransition';

const AnnouncementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    const loadAnn = async () => {
      const all = await getAnnouncements();
      const found = all.find(a => a.id === id);
      if (found) {
        setAnnouncement(found);
      } else {
        // If not found in mockDb, it might be a school news URL (if we implement hybrid later).
        // For now, just set null to show error.
        setAnnouncement(null);
      }
    };
    loadAnn();
  }, [id]);

  if (announcement === null) {
    return (
      <PageTransition>
        <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Megaphone size={64} color="#3f3f46" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#a1a1aa' }}>ไม่พบประกาศที่ท่านต้องการ</h2>
          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>กลับหน้าหลัก</button>
        </div>
      </PageTransition>
    );
  }

  const renderBlocks = () => {
    if (!announcement.contentBlocks || announcement.contentBlocks.length === 0) {
      // Fallback for old announcements without blocks
      return <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#d4d4d8', whiteSpace: 'pre-wrap' }}>{announcement.content}</p>;
    }

    return announcement.contentBlocks.map(block => {
      if (block.type === 'text') {
        return (
          <p key={block.id} style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#d4d4d8', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
            {block.value}
          </p>
        );
      } else if (block.type === 'image') {
        return (
          <div key={block.id} style={{ marginBottom: '2rem', textAlign: 'center' }}>
            {block.value && <img src={block.value} alt="เนื้อหาข่าว" style={{ maxWidth: '100%', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />}
          </div>
        );
      }
      return null;
    });
  };

  return (
    <PageTransition>
      <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white', paddingBottom: '5rem' }}>
        
        {/* Cover Image */}
        <div style={{ position: 'relative', width: '100%', height: '50vh', minHeight: '400px', backgroundColor: '#18181b' }}>
          {announcement.imageUrl ? (
            <div style={{ width: '100%', height: '100%', backgroundImage: `url(${announcement.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Megaphone size={120} color="rgba(255,255,255,0.2)" />
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #09090b 0%, rgba(9,9,11,0.5) 50%, rgba(9,9,11,0.8) 100%)' }} />
          
          <button 
            onClick={() => navigate('/')}
            style={{ 
              position: 'absolute', top: '2rem', left: '5%',
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '2rem',
              backdropFilter: 'blur(10px)', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
          >
            <ChevronLeft size={20} /> กลับหน้าหลัก
          </button>
        </div>

        {/* Content Wrapper */}
        <div style={{ maxWidth: '800px', margin: '-100px auto 0 auto', position: 'relative', zIndex: 10, padding: '0 5%' }}>
          
          {/* Header Card */}
          <div style={{ background: '#18181b', borderRadius: '1.25rem', padding: '3rem', border: '1px solid #27272a', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', background: '#2563eb', padding: '0.3rem 0.75rem', borderRadius: '1rem', marginBottom: '1.5rem', display: 'inline-block' }}>
              {announcement.type || 'ประกาศ'}
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '1.5rem', lineHeight: 1.3 }}>
              {announcement.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#a1a1aa', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} /> วันที่ประกาศ: {new Date(announcement.createdAt || Date.now()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Main Content Blocks */}
          <div style={{ padding: '0 1rem' }}>
            {renderBlocks()}
          </div>
          
        </div>
      </div>
    </PageTransition>
  );
};

export default AnnouncementDetail;
