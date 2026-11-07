import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Sparkles, School, BookOpen, Compass, Shield, Users, Clock, Hammer } from 'lucide-react';
import Header from '../components/Header';

const InfoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page">
      <Header />

      <main className="info-wrap">
        <div className="info-hero">
          <div className="info-badge">
            <Info size={14} color="#3b82f6" />
            <span>DEK SA 2.0 INFO</span>
          </div>
          <h1 className="info-title">ข้อมูลระบบ Dek SA</h1>
          <p className="info-desc">
            แพลตฟอร์มการเรียนรู้และระบบบริการการศึกษาแบบ All-in-One เพื่อนักเรียนและบุคลากรทางการศึกษา
          </p>

          <div className="info-status-pill">
            <Hammer size={15} color="#f59e0b" />
            <span>กำลังรวบรวมและจัดทำข้อมูล Dek SA 2.0 ฉบับสมบูรณ์</span>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-icon blue"><School size={24} /></div>
            <h3>วิสัยทัศน์ของระบบ</h3>
            <p>ยกระดับการศึกษาด้วยเครื่องมือดิจิทัลที่ทันสมัย ใช้งานง่าย รวดเร็ว และเข้าถึงได้ทุกที่ทุกเวลาบนทุกอุปกรณ์</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon purple"><BookOpen size={24} /></div>
            <h3>คลังความรู้และการเรียน</h3>
            <p>รวบรวมชีทสรุปบทเรียน คลังข้อสอบเตรียมสอบ และระบบรายงานผลการเรียน SGS เชื่อมตรงสู่มือนักเรียน</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon green"><Shield size={24} /></div>
            <h3>ความปลอดภัยและความเป็นส่วนตัว</h3>
            <p>ระบบฐานข้อมูล Supabase เข้ารหัสความปลอดภัยมาตรฐานสากล พร้อมระบบยืนยันตัวตนผ่าน OTP</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon orange"><Compass size={24} /></div>
            <h3>Dek SA 2.0 Roadmap</h3>
            <p>กำลังพัฒนาฟีเจอร์ใหม่: แจ้งของหาย, แผนที่โรงเรียน, ระบบส่งงาน, จองโต๊ะเรียน และมินิเกมสะสมแต้ม</p>
          </div>
        </div>
      </main>

      <style>{`
        .info-page {
          min-height: calc(var(--vh, 1vh) * 100);
          background-color: transparent;
          color: #ffffff;
          padding-bottom: 5rem;
        }

        .info-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }

        .info-hero {
          text-align: center;
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .info-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          font-size: 0.78rem;
          font-weight: 700;
          color: #60a5fa;
          margin-bottom: 1rem;
        }

        .info-title {
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          margin: 0 0 0.75rem;
        }

        .info-desc {
          max-width: 600px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0 0 1.5rem;
        }

        .info-status-pill {
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

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .info-card {
          background: linear-gradient(180deg, rgba(28, 28, 36, 0.8), rgba(18, 18, 24, 0.9));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          padding: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }

        .info-card-icon {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .info-card-icon.blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .info-card-icon.purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
        .info-card-icon.green { background: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }
        .info-card-icon.orange { background: rgba(249, 115, 22, 0.2); color: #fdba74; border: 1px solid rgba(249, 115, 22, 0.3); }

        .info-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .info-card p {
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default InfoPage;
