import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Sparkles, Terminal, Layers, Cpu, GitBranch, ExternalLink, Hammer } from 'lucide-react';
import Header from '../components/Header';

const DevPage = () => {
  const navigate = useNavigate();

  return (
    <div className="dev-page">
      <Header />

      <main className="dev-wrap">
        <div className="dev-hero">
          <div className="dev-badge">
            <Code2 size={14} color="#a855f7" />
            <span>DEVELOPER & ARCHITECTURE</span>
          </div>
          <h1 className="dev-title">ทีมพัฒนา Dek SA 2.0</h1>
          <p className="dev-desc">
            สถาปัตยกรรมระบบ เทคโนโลยีที่เลือกใช้ และเบื้องหลังการพัฒนา Dek SA 2.0
          </p>

          <div className="dev-status-pill">
            <Hammer size={15} color="#f59e0b" />
            <span>กำลังพัฒนา Dek SA 2.0 อย่างต่อเนื่อง</span>
          </div>
        </div>

        {/* Tech Stack Cards */}
        <div className="dev-grid">
          <div className="dev-card">
            <div className="dev-card-icon"><Terminal size={22} color="#60a5fa" /></div>
            <h3>Frontend Engine</h3>
            <p>React 18, Vite 5, React Router v6 และ Vanilla Glassmorphism CSS พร้อมแอนิเมชันระดับ 60 FPS</p>
          </div>

          <div className="dev-card">
            <div className="dev-card-icon"><Cpu size={22} color="#a855f7" /></div>
            <h3>Backend & Cloud</h3>
            <p>Node.js Express Server, Supabase Cloud Database, Row-Level Security (RLS) และ Email OTP Authentication</p>
          </div>

          <div className="dev-card">
            <div className="dev-card-icon"><Layers size={22} color="#10b981" /></div>
            <h3>High Availability</h3>
            <p>ระบบเซิร์ฟเวอร์ Local Host พร้อม One-Click Launcher (`start-server.bat`) และการแคชข้อมูลประสิทธิภาพสูง</p>
          </div>
        </div>
      </main>

      <style>{`
        .dev-page {
          min-height: calc(var(--vh, 1vh) * 100);
          background-color: transparent;
          color: #ffffff;
          padding-bottom: 5rem;
        }

        .dev-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }

        .dev-hero {
          text-align: center;
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .dev-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          font-size: 0.78rem;
          font-weight: 700;
          color: #c084fc;
          margin-bottom: 1rem;
        }

        .dev-title {
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          margin: 0 0 0.75rem;
        }

        .dev-desc {
          max-width: 600px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0 0 1.5rem;
        }

        .dev-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 18px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fde68a;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .dev-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .dev-card {
          background: linear-gradient(180deg, rgba(28, 28, 36, 0.8), rgba(18, 18, 24, 0.9));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          padding: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }

        .dev-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .dev-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .dev-card p {
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.88rem;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default DevPage;
