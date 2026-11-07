import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, GraduationCap, Users, ExternalLink, BookOpen, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';

const EService = () => {
  const navigate = useNavigate();

  const services = [
    {
      title: 'ระบบชำระเงิน',
      icon: <CreditCard size={32} color="#facc15" />,
      color: '#facc15',
      links: [
        { name: 'ระบบชำระเงินบำรุงการศึกษา', url: 'https://schoolbillingdev31.com/SBSA/Pages/PrintReportPayInForStudent.aspx' },
        { name: 'คู่มือการใช้งานระบบชำระเงิน', url: 'https://drive.google.com/file/d/18it9VyDHcV5Lo_tHYVAHHD3ISwBHzVEv/view?usp=sharing' }
      ]
    },
    {
      title: 'SGS สำหรับนักเรียนและผู้ปกครอง',
      icon: <GraduationCap size={32} color="#3b82f6" />,
      color: '#3b82f6',
      links: [
        { name: 'ตรวจสอบผลการเรียน SGS (ระบบ Dek SA เร็วและจำข้อมูล)', url: '/sgs', internal: true },
        { name: 'ระบบ SGS ของ สพฐ. (เว็บนอก)', url: 'https://sgs.bopp-obec.info/sgss/Security/SignIn.aspx' },
        { name: 'คู่มือการใช้งานระบบตรวจสอบผลการเรียน', url: 'https://drive.google.com/file/d/1NRFXzcYzk22Ko0oCxQCZ5yk8jPBL6aS_/view' }
      ]
    },
    {
      title: 'SGS สำหรับครู',
      icon: <Users size={32} color="#ec4899" />,
      color: '#ec4899',
      links: [
        { name: 'เข้าสู่ระบบ SGS สำหรับครู', url: 'https://sgs.bopp-obec.info/sgs/Security/SignIn.aspx?MasterPage=../Master%20Pages/HorizontalMenu.master&Target=' },
        { name: 'คู่มือการใช้งานระบบ SGS สำหรับครู', url: 'https://drive.google.com/file/d/1P2iaAA4_lqAbTsjFPUw5C9IF-cm5Flpf/view?usp=sharing' }
      ]
    }
  ];

  return (
    <div style={{ minHeight: 'calc(var(--vh, 1vh) * 100)', background: 'transparent', color: 'white', paddingBottom: '5rem' }}>
      {/* Header */}
      <Header />

      {/* Hero */}
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#2563eb', backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '1rem' }}>DEK SA Service</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: '600px' }}>บริการอิเล็กทรอนิกส์ ระบบชำระเงิน และระบบตรวจสอบผลการเรียน (SGS)</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '-3rem auto 0', padding: '0 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {services.map((service, idx) => (
            <div key={idx} style={{ background: '#18181b', borderRadius: '1rem', padding: '2rem', border: '1px solid #27272a', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '1rem', background: `${service.color}20`, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `2px solid ${service.color}` }}>
                  {service.icon}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{service.title}</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {service.links.map((link, lidx) => (
                  <a 
                    key={lidx} 
                    href={link.internal ? undefined : link.url} 
                    target={link.internal ? undefined : "_blank"} 
                    rel={link.internal ? undefined : "noopener noreferrer"} 
                    onClick={(e) => {
                      if (link.internal) {
                        e.preventDefault();
                        navigate(link.url);
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: '#121212', borderRadius: '0.5rem', textDecoration: 'none', color: '#d4d4d8', border: '1px solid #27272a', transition: 'all 0.2s', cursor: 'pointer' }} 
                    onMouseEnter={e => { e.currentTarget.style.borderColor = service.color; e.currentTarget.style.color = 'white'; }} 
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#d4d4d8'; }}
                  >
                    {link.name.includes('คู่มือ') ? <BookOpen size={18} style={{ minWidth: '18px', marginTop: '2px' }} color={service.color} /> : <ExternalLink size={18} style={{ minWidth: '18px', marginTop: '2px' }} color={service.color} />}
                    <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EService;
