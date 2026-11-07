import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, GraduationCap, Users, BookOpen, 
  MapPin, Search, Calendar, FileUp, FolderSync, 
  HeartHandshake, Bell, AlertTriangle, MessageSquare, 
  HelpCircle, BookmarkCheck, Timer, Flame, Map,
  ChevronRight, Sparkles, CheckCircle2, Hammer, Cloud
} from 'lucide-react';
import Header from '../components/Header';

const ServicesHub = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const servicesList = [
    // 1. การเรียน & ผลการเรียน
    {
      id: 'grades',
      title: 'ดูเกรด (SGS)',
      desc: 'ระบบตรวจสอบผลการเรียน SGS สำหรับนักเรียน ผู้ปกครอง และครู',
      icon: <GraduationCap size={24} color="#60a5fa" />,
      category: 'การเรียน & ผลการเรียน',
      status: 'ready',
      action: () => navigate('/sgs')
    },
    {
      id: 'learning',
      title: 'การเรียน (คอร์ส & สรุป)',
      desc: 'คลังคอร์สเรียน แบบฝึกหัดเตรียมสอบ และชีทสรุปเนื้อหาทุกกลุ่มสาระ',
      icon: <BookOpen size={24} color="#10b981" />,
      category: 'การเรียน & ผลการเรียน',
      status: 'ready',
      action: () => navigate('/student')
    },
    {
      id: 'assignment',
      title: 'ระบบส่งงาน',
      desc: 'อัปโหลดการบ้าน ส่งรายงาน และตรวจสอบกำหนดส่งงานรายวิชา',
      icon: <FileUp size={24} color="#f59e0b" />,
      category: 'การเรียน & ผลการเรียน',
      status: 'ready',
      action: () => navigate('/assignments')
    },
    {
      id: 'missing-work',
      title: 'แจ้งเตือนไม่ส่งงาน',
      desc: 'ระบบตรวจเช็คและแจ้งเตือนการบ้านค้างส่งก่อนหมดเวลาส่งงาน',
      icon: <AlertTriangle size={24} color="#ef4444" />,
      category: 'การเรียน & ผลการเรียน',
      status: 'wip',
      action: () => navigate('/service/missing-work?title=แจ้งเตือนไม่ส่งงาน&category=การเรียน')
    },
    {
      id: 'period-timer',
      title: 'ระบบตารางก่อนหมดเวลา',
      desc: 'นับถอยหลังเวลาเรียนแต่ละคาบ และแจ้งเตือนล่วงหน้าก่อนหมดคาบเรียน',
      icon: <Timer size={24} color="#06b6d4" />,
      category: 'การเรียน & ผลการเรียน',
      status: 'wip',
      action: () => navigate('/service/period-timer?title=ระบบตารางก่อนหมดเวลา&category=การเรียน')
    },

    // 2. ชีวิตในโรงเรียน
    {
      id: 'school-map',
      title: 'แผนที่โรงเรียน',
      desc: 'แผนผังอาคารเรียน ห้องเรียน จุดสำคัญ และเส้นทางภายในโรงเรียน',
      icon: <Map size={24} color="#8b5cf6" />,
      category: 'ชีวิตในโรงเรียน',
      status: 'wip',
      action: () => navigate('/service/school-map?title=แผนที่โรงเรียน&category=ชีวิตในโรงเรียน')
    },
    {
      id: 'lost-found',
      title: 'แจ้งของหาย',
      desc: 'กระดานประกาศของหายและตามหาเจ้าของสิ่งของภายในโรงเรียน',
      icon: <Search size={24} color="#ec4899" />,
      category: 'ชีวิตในโรงเรียน',
      status: 'wip',
      action: () => navigate('/service/lost-found?title=แจ้งของหาย&category=ชีวิตในโรงเรียน')
    },
    {
      id: 'book-desk',
      title: 'จองโต๊ะเรียน',
      desc: 'ระบบจองโต๊ะอ่านหนังสือและที่นั่งทำการบ้านในห้องสมุดและจุดติว',
      icon: <BookmarkCheck size={24} color="#3b82f6" />,
      category: 'ชีวิตในโรงเรียน',
      status: 'wip',
      action: () => navigate('/service/book-desk?title=จองโต๊ะเรียน&category=ชีวิตในโรงเรียน')
    },
    {
      id: 'activities',
      title: 'กิจกรรมโรงเรียน',
      desc: 'ปฏิทินกิจกรรม ชุมนุม กีฬาสี และอีเวนต์สำคัญตลอดปีการศึกษา',
      icon: <Calendar size={24} color="#f97316" />,
      category: 'ชีวิตในโรงเรียน',
      status: 'wip',
      action: () => navigate('/service/activities?title=กิจกรรมโรงเรียน&category=ชีวิตในโรงเรียน')
    },
    {
      id: 'tutoring',
      title: 'แนะสถานที่ติวใกล้โรงเรียน',
      desc: 'รวมพิกัดสถาบันกวดวิชา ร้านกาแฟสำหรับอ่านหนังสือ และจุดติวใกล้เคียง',
      icon: <MapPin size={24} color="#ef4444" />,
      category: 'ชีวิตในโรงเรียน',
      status: 'wip',
      action: () => navigate('/service/tutoring?title=แนะสถานที่ติวใกล้โรงเรียน&category=ชีวิตในโรงเรียน')
    },

    // 3. เครื่องมือ & ชุมชน
    {
      id: 'file-share',
      title: 'ระบบฝากไฟล์',
      desc: 'พื้นที่ฝากและแชร์ไฟล์การเรียน เอกสารสรุป และสื่อการสอนออนไลน์',
      icon: <Cloud size={24} color="#38bdf8" />,
      category: 'เครื่องมือ & ชุมชน',
      status: 'ready',
      action: () => navigate('/service/file-share')
    },
    {
      id: 'streak',
      title: 'มาโรงสะสมไฟ',
      desc: 'เช็คชื่อมาโรงเรียนตรงเวลา สะสมวันสตรีคไฟ (Streak) และรับรางวัล',
      icon: <Flame size={24} color="#f97316" />,
      category: 'เครื่องมือ & ชุมชน',
      status: 'wip',
      action: () => navigate('/service/streak?title=มาโรงสะสมไฟ&category=เครื่องมือ')
    },
    {
      id: 'counselor',
      title: 'คอนแท็กครูแนะแนว แนะสายการเรียน',
      desc: 'ปรึกษาการเลือกสายการเรียน แผนการศึกษาต่อ และช่องทางติดต่อครูแนะแนว',
      icon: <HeartHandshake size={24} color="#ec4899" />,
      category: 'เครื่องมือ & ชุมชน',
      status: 'wip',
      action: () => navigate('/service/counselor?title=คอนแท็กครูแนะแนว&category=แนะแนว')
    },

    // 4. ติดต่อ & ช่วยเหลือ
    {
      id: 'announcements',
      title: 'ระบบประกาศแจ้งเตือน',
      desc: 'ประกาศด่วนจากโรงเรียน ข่าวสารการศึกษา และการแจ้งเตือนจากระบบ',
      icon: <Bell size={24} color="#eab308" />,
      category: 'ติดต่อ & ช่วยเหลือ',
      status: 'ready',
      action: () => navigate('/news')
    },
    {
      id: 'contact-admin',
      title: 'ติดต่อสอบถาม ADMIN',
      desc: 'แจ้งปัญหาการใช้งานระบบ แจ้งข้อผิดพลาด และสอบถามข้อมูลเพิ่มเติม',
      icon: <MessageSquare size={24} color="#60a5fa" />,
      category: 'ติดต่อ & ช่วยเหลือ',
      status: 'wip',
      action: () => navigate('/service/contact-admin?title=ติดต่อสอบถาม+ADMIN&category=ช่วยเหลือ')
    },
    {
      id: 'feedback',
      title: 'กล่องเสนอความคิดเห็น',
      desc: 'ร่วมส่งข้อเสนอแนะและไอเดียพัฒนาโรงเรียนและระบบ Dek SA 2.0',
      icon: <Sparkles size={24} color="#a855f7" />,
      category: 'ติดต่อ & ช่วยเหลือ',
      status: 'wip',
      action: () => navigate('/service/feedback?title=กล่องเสนอความคิดเห็น&category=ช่วยเหลือ')
    }
  ];

  const filteredServices = servicesList.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['ทั้งหมด', 'การเรียน & ผลการเรียน', 'ชีวิตในโรงเรียน', 'เครื่องมือ & ชุมชน', 'ติดต่อ & ช่วยเหลือ'];
  const [selectedCat, setSelectedCat] = useState('ทั้งหมด');

  const displayed = filteredServices.filter(item => 
    selectedCat === 'ทั้งหมด' ? true : item.category === selectedCat
  );

  return (
    <div className="services-page">
      <Header />

      <main className="services-container">
        {/* Hero Section */}
        <div className="services-hero">
          <div className="hero-pill-badge">
            <Sparkles size={14} color="#3b82f6" />
            <span>DEK SA 2.0 SERVICES</span>
          </div>
          <h1 className="services-hero-title">ศูนย์รวมบริการ Dek SA</h1>
          <p className="services-hero-desc">
            รวบรวมระบบดิจิทัลสำหรับนักเรียนและคุณครู ครอบคลุมทั้งการเรียน ผลการเรียน ชีวิตในโรงเรียน และการสนับสนุน
          </p>

          {/* Search Bar */}
          <div className="services-search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text"
              placeholder="ค้นหาบริการ เช่น ดูเกรด, ส่งงาน, แผนที่, ของหาย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>ล้าง</button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="category-tabs-bar">
          {categories.map((cat, idx) => (
            <button 
              key={idx}
              className={`cat-pill-btn ${selectedCat === cat ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="services-cards-grid">
          {displayed.map((service) => (
            <div 
              key={service.id} 
              className="service-card"
              onClick={service.action}
            >
              <div className="service-card-top">
                <div className="service-icon-box">
                  {service.icon}
                </div>
                {service.status === 'ready' ? (
                  <span className="status-badge ready">
                    <CheckCircle2 size={12} />
                    <span>พร้อมใช้งาน</span>
                  </span>
                ) : (
                  <span className="status-badge wip">
                    <Hammer size={12} />
                    <span>กำลังทำ</span>
                  </span>
                )}
              </div>

              <h3 className="service-card-title">{service.title}</h3>
              <p className="service-card-desc">{service.desc}</p>

              <div className="service-card-footer">
                <span className="service-cat-name">{service.category}</span>
                <span className="service-arrow-btn">
                  <span>เข้าสู่บริการ</span>
                  <ChevronRight size={15} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        .services-page {
          min-height: calc(var(--vh, 1vh) * 100);
          background-color: transparent;
          color: #ffffff;
          padding-bottom: 5rem;
        }

        .services-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }

        .services-hero {
          text-align: center;
          margin-bottom: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-pill-badge {
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
          letter-spacing: 0.5px;
        }

        .services-hero-title {
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0 0 0.75rem;
          color: #ffffff;
        }

        .services-hero-desc {
          max-width: 620px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0 0 1.75rem;
        }

        .services-search-bar {
          position: relative;
          width: 100%;
          max-width: 520px;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          color: rgba(255, 255, 255, 0.45);
        }

        .search-input {
          width: 100%;
          height: 48px;
          padding: 0 70px 0 46px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          color: #ffffff;
          font-size: 14.5px;
          font-family: inherit;
          outline: none;
          transition: all 0.25s ease;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.09);
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25), 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .search-clear {
          position: absolute;
          right: 14px;
          background: rgba(255, 255, 255, 0.1);
          border: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          cursor: pointer;
        }

        /* Category Tabs */
        .category-tabs-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .category-tabs-bar::-webkit-scrollbar {
          display: none;
        }

        .cat-pill-btn {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          padding: 7px 16px;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .cat-pill-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .cat-pill-btn.active {
          color: #ffffff;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        /* Cards Grid */
        .services-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }

        .service-card {
          background: linear-gradient(180deg, rgba(28, 28, 36, 0.8), rgba(18, 18, 24, 0.9));
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
        }

        .service-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15);
        }

        .service-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .service-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .service-emoji {
          font-size: 1.6rem;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .status-badge.ready {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-badge.wip {
          background: rgba(245, 158, 11, 0.15);
          color: #fde68a;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .service-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.4rem;
        }

        .service-card-desc {
          font-size: 0.86rem;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.5;
          margin: 0 0 1.25rem;
          flex: 1;
        }

        .service-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .service-cat-name {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
        }

        .service-arrow-btn {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
};

export default ServicesHub;
