import React from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Hammer, Sparkles, Clock, Compass } from 'lucide-react';
import Header from '../components/Header';

const UnderConstruction = ({ title: propTitle, category: propCategory, icon: propIcon }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { serviceName } = useParams();

  const title = propTitle || searchParams.get('title') || serviceName || 'ฟีเจอร์นี้';
  const category = propCategory || searchParams.get('category') || 'Dek SA 2.0';
  const icon = propIcon || searchParams.get('icon') || '🚧';

  return (
    <div className="wip-container">
      <Header />

      <main className="wip-main">
        {/* Ambient Glow */}
        <div className="wip-glow-orb"></div>

        <div className="wip-card">
          {/* Badge */}
          <div className="wip-badge">
            <Sparkles size={13} color="#f59e0b" />
            <span>Dek SA 2.0 Roadmap</span>
          </div>

          {/* Icon */}
          <div className="wip-icon-box">
            <Hammer size={38} color="#f59e0b" className="wip-hammer-main" />
          </div>

          {/* Title */}
          <h1 className="wip-title">{title}</h1>
          <div className="wip-category-tag">{category}</div>

          {/* Status Capsule */}
          <div className="wip-status-capsule">
            <Hammer size={16} className="wip-hammer-icon" />
            <span>กำลังทำ (Under Development)</span>
          </div>

          {/* Description */}
          <p className="wip-desc">
            หน้านี้อยู่ในแผนงานพัฒนา <strong>Dek SA 2.0</strong> ระบบกำลังจัดทำและจะเปิดให้ทดสอบทีละขั้นตอนตามลำดับ
          </p>

          <div className="wip-timeline-note">
            <Clock size={14} color="#a1a1aa" />
            <span>สถานะ: รอดำเนินการพัฒนาตามลำดับคิว</span>
          </div>

          {/* Action Buttons */}
          <div className="wip-actions-row">
            <button 
              type="button" 
              className="wip-btn wip-btn-back"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} />
              <span>ย้อนกลับ</span>
            </button>
            <button 
              type="button" 
              className="wip-btn wip-btn-home"
              onClick={() => navigate('/')}
            >
              <Home size={16} />
              <span>กลับสู่หน้าหลัก</span>
            </button>
            <button 
              type="button" 
              className="wip-btn wip-btn-services"
              onClick={() => navigate('/services')}
            >
              <Compass size={16} />
              <span>ดูบริการทั้งหมด</span>
            </button>
          </div>
        </div>
      </main>

      <style>{`
        .wip-container {
          min-height: calc(var(--vh, 1vh) * 100);
          background-color: transparent;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        .wip-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          position: relative;
        }

        .wip-glow-orb {
          position: absolute;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(245, 158, 11, 0.1) 50%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .wip-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 540px;
          background: linear-gradient(180deg, rgba(24, 24, 32, 0.9), rgba(15, 15, 20, 0.95));
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 2.5rem 2rem;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.25);
          animation: wipPop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes wipPop {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .wip-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          font-size: 0.78rem;
          font-weight: 700;
          color: #fbbf24;
          letter-spacing: 0.3px;
          margin-bottom: 1.25rem;
        }

        .wip-icon-box {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.25rem;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
        }

        .wip-emoji {
          font-size: 2.5rem;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
        }

        .wip-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 6px;
          letter-spacing: -0.3px;
        }

        .wip-category-tag {
          font-size: 0.85rem;
          font-weight: 600;
          color: #93c5fd;
          margin-bottom: 1.25rem;
        }

        .wip-status-capsule {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.08));
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #fde68a;
          font-size: 0.88rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.2);
        }

        .wip-hammer-icon {
          color: #f59e0b;
          animation: hammerSwing 2s ease-in-out infinite;
        }

        @keyframes hammerSwing {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-20deg); }
        }

        .wip-desc {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.6;
          margin: 0 0 1.25rem;
        }

        .wip-desc strong {
          color: #60a5fa;
        }

        .wip-timeline-note {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #a1a1aa;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 2rem;
        }

        .wip-actions-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .wip-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 42px;
          padding: 0 18px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 0;
        }

        .wip-btn-back {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .wip-btn-back:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .wip-btn-home {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }

        .wip-btn-home:hover {
          background: linear-gradient(135deg, #60a5fa, #2563eb);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.55);
        }

        .wip-btn-services {
          background: rgba(255, 255, 255, 0.08);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .wip-btn-services:hover {
          background: rgba(59, 130, 246, 0.15);
          color: #ffffff;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default UnderConstruction;
