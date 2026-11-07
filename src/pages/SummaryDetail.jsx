import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { getSummaryById } from '../store/mockDb';

const SummaryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      const found = await getSummaryById(id);
      setSummary(found);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleDownloadPdf = (summaryItem) => {
    if (!summaryItem.pdfData) return;
    const link = document.createElement('a');
    link.href = summaryItem.pdfData;
    link.download = `${summaryItem.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSlides = (summaryItem) => {
    if (!summaryItem.images || summaryItem.images.length === 0) return;
    summaryItem.images.forEach((img, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = img;
        link.download = `${summaryItem.title}_page_${idx + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 300);
    });
  };

  if (loading) {
    return <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>กำลังโหลดข้อมูล...</div>;
  }

  if (!summary) {
    return <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
      <h2>ไม่พบสรุปวิชานี้</h2>
      <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '1rem' }}>กลับหน้าหลัก</button>
    </div>;
  }

  return (
    <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', background: '#09090b', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#a1a1aa'}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${summary.color || '#3b82f6'}20`, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `2px solid ${summary.color || '#3b82f6'}` }}>
            <FileText size={20} color={summary.color || '#3b82f6'} />
          </div>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>{summary.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {summary.pdfData && (
            <button onClick={() => handleDownloadPdf(summary)} className="summary-dl-btn" style={{ background: '#10b981' }}>
              <Download size={16} /> <span className="dl-text">โหลด PDF</span>
            </button>
          )}
          {!summary.pdfData && summary.images && summary.images.length > 0 && (
            <button onClick={() => handleDownloadSlides(summary)} className="summary-dl-btn" style={{ background: '#3b82f6' }}>
              <Download size={16} /> <span className="dl-text">โหลดสไลด์ทั้งหมด</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {summary.description && (
          <div style={{ width: '100%', background: '#18181b', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #27272a', marginBottom: '1rem' }}>
            <h3 style={{ color: 'white', marginTop: 0, marginBottom: '0.5rem' }}>รายละเอียด / ระดับชั้น</h3>
            <p style={{ color: '#a1a1aa', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{summary.description}</p>
          </div>
        )}

        {summary.pdfData ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: '#18181b', borderRadius: '1rem', border: '1px solid #27272a' }}>
            <FileText size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>สรุปวิชานี้เป็นรูปแบบ PDF</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>กรุณากดปุ่ม "โหลด PDF" ด้านบนเพื่ออ่าน</p>
            <button onClick={() => handleDownloadPdf(summary)} className="summary-dl-btn large" style={{ background: '#10b981' }}>
              <Download size={20} /> ดาวน์โหลด PDF ทันที
            </button>
          </div>
        ) : summary.images && summary.images.length > 0 ? (
          summary.images.map((img, idx) => (
            <img key={idx} src={img} alt={`Page ${idx + 1}`} style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
          ))
        ) : (
          <p style={{ color: '#a1a1aa' }}>ยังไม่มีรูปภาพในสรุปวิชานี้</p>
        )}
      </div>
    </div>
  );
};

export default SummaryDetail;
