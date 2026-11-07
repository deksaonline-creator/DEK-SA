import React, { useState } from 'react';

/**
 * IOSGate
 *
 * ถ้าผู้ใช้เปิดเว็บบน iOS Safari (ไม่ใช่ standalone mode)
 * จะแสดงหน้าเต็มจอสอนให้ Add to Home Screen ก่อนใช้งาน
 * เพราะแอพนี้ออกแบบให้ทำงานเป็น PWA เท่านั้น
 */

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

export default function IOSGate({ children }) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  // ถ้าไม่ใช่ iOS หรือเป็น standalone แล้ว → ผ่านได้เลย
  if (!isIOS() || isInStandaloneMode()) {
    return children;
  }

  const handleShare = async () => {
    setSharing(true);
    try {
      await navigator.share({
        title: 'Dek SA',
        text: 'เปิดด้วยแอพ Dek SA เพื่อใช้งานได้ครบทุกฟีเจอร์',
        url: window.location.href,
      });
      setShared(true);
    } catch {
      // user cancelled
    }
    setSharing(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(160deg, #09090b 0%, #0f172a 50%, #0c1a3a 100%)',
      color: 'white', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.5rem',
      fontFamily: "'Kanit', sans-serif",
      overflowY: 'auto',
    }}>
      <style>{`
        @keyframes ios-float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ios-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          70% { box-shadow: 0 0 0 20px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        @keyframes ios-shine {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .ios-gate-share-btn {
          width: 100%; max-width: 360px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none; border-radius: 18px; color: white;
          font-size: 17px; font-weight: 700;
          font-family: 'Kanit', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.2s;
          animation: ios-pulse-ring 2s infinite;
          box-shadow: 0 8px 30px rgba(99,102,241,0.4);
        }
        .ios-gate-share-btn:active {
          transform: scale(0.97);
          opacity: 0.9;
        }
        .ios-step-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 12px 16px;
          display: flex; align-items: center; gap: 14px;
          width: 100%; max-width: 360px;
        }
        .ios-step-num {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
        }
        .ios-step-text {
          font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.4;
        }
      `}</style>

      {/* App Icon */}
      <div style={{ marginBottom: '1.5rem' }}>
        <img
          src="/favicon.png"
          alt="Dek SA"
          style={{
            width: '96px', height: '96px',
            borderRadius: '22px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            animation: 'ios-float 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '1.9rem', fontWeight: 900, fontStyle: 'italic',
        letterSpacing: '-0.5px', margin: 0, textAlign: 'center',
      }}>
        Dek <span style={{ color: '#6366f1' }}>SA</span>
      </h1>
      <p style={{
        color: 'rgba(161,161,170,0.9)', fontSize: '14px',
        textAlign: 'center', marginTop: '8px', marginBottom: '2rem',
        lineHeight: 1.5, maxWidth: '300px',
      }}>
        แอพนี้ทำงานได้ดีที่สุดเมื่อติดตั้งบนหน้าจอโฮม<br/>
        กรุณาเพิ่มแอพก่อนใช้งาน
      </p>

      {/* Share button */}
      {!shared ? (
        <>
          <button
            className="ios-gate-share-btn"
            onClick={handleShare}
            disabled={sharing}
            style={{ marginBottom: '14px' }}
          >
            {sharing ? (
              '⏳ กำลังเปิดเมนู...'
            ) : (
              <>
                <span style={{ fontSize: '22px' }}>⬆️</span>
                กดเพื่อเปิดเมนูแชร์ Safari
              </>
            )}
          </button>
          <p style={{
            fontSize: '12px', color: 'rgba(161,161,170,0.65)',
            textAlign: 'center', marginBottom: '2rem',
          }}>
            แล้วกด <strong style={{ color: 'rgba(255,255,255,0.6)' }}>"เพิ่มไปยังหน้าจอโฮม"</strong>
            {' → '}
            <strong style={{ color: 'rgba(255,255,255,0.6)' }}>"เพิ่ม"</strong>
          </p>
        </>
      ) : (
        <div style={{
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '14px', padding: '14px 20px', marginBottom: '14px',
          textAlign: 'center', maxWidth: '360px', width: '100%',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>✅</div>
          <div style={{ fontSize: '14px', color: '#86efac', fontWeight: 700 }}>
            เปิดเมนูแชร์แล้ว!
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(134,239,172,0.8)', marginTop: '4px' }}>
            กด "เพิ่มไปยังหน้าจอโฮม" แล้วเปิดแอพจาก Home Screen
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        width: '100%', maxWidth: '360px', marginBottom: '1.25rem',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '12px', color: 'rgba(161,161,170,0.5)' }}>
          หรือทำด้วยตัวเอง
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      </div>

      {/* Manual steps */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '10px',
        width: '100%', maxWidth: '360px',
      }}>
        <div className="ios-step-card">
          <div className="ios-step-num">1</div>
          <div className="ios-step-text">
            กดปุ่ม <strong>"แชร์" ⬆️</strong> ที่แถบล่างของ Safari
          </div>
        </div>
        <div className="ios-step-card">
          <div className="ios-step-num">2</div>
          <div className="ios-step-text">
            เลือก <strong>"เพิ่มไปยังหน้าจอโฮม" ➕</strong>
          </div>
        </div>
        <div className="ios-step-card">
          <div className="ios-step-num">3</div>
          <div className="ios-step-text">
            กด <strong>"เพิ่ม"</strong> มุมขวาบน แล้วเปิดแอพจาก Home Screen 🎉
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p style={{
        fontSize: '11px', color: 'rgba(161,161,170,0.4)',
        textAlign: 'center', marginTop: '2rem',
        maxWidth: '280px', lineHeight: 1.5,
      }}>
        iOS Safari ไม่รองรับการติดตั้งอัตโนมัติ<br/>
        Apple กำหนดให้ต้องทำผ่านเมนูแชร์เท่านั้น
      </p>
    </div>
  );
}
