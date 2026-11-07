import React, { useState, useEffect } from 'react';

const isIOS = () => {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};
const isAndroid = () => /android/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

export default function InstallGate({ children }) {
  // Synchronous check: blocks rendering of children immediately if not standalone
  const [showGate, setShowGate] = useState(() => !isInStandaloneMode());
  const [platform, setPlatform] = useState(() => {
    if (isIOS()) return 'ios';
    if (isAndroid()) return 'android';
    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')) return 'ios';
    return 'android';
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [downloadedProfile, setDownloadedProfile] = useState(false);

  useEffect(() => {
    if (!showGate) return;

    if (platform === 'android') {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [showGate, platform]);

  if (!showGate) {
    return children;
  }

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowGate(false);
    }
    setDeferredPrompt(null);
  };

  const handleIOSInstall = () => {
    // Trigger download of the .mobileconfig file
    window.location.href = '/install.mobileconfig';
    setDownloadedProfile(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(160deg, #09090b 0%, #171717 50%, #000000 100%)',
      color: 'white', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.5rem', fontFamily: "'Kanit', sans-serif",
      overflowY: 'auto'
    }}>
      <style>{`
        .install-btn {
          width: 100%; max-width: 320px; padding: 16px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          border: none; border-radius: 16px; color: white;
          font-size: 18px; font-weight: bold; font-family: 'Kanit', sans-serif;
          cursor: pointer; box-shadow: 0 8px 25px rgba(37,99,235,0.4);
          transition: transform 0.2s;
        }
        .install-btn:active { transform: scale(0.96); }
        .ios-steps {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 16px; margin-top: 20px; width: 100%; max-width: 320px;
        }
        .ios-step { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
        .ios-step:last-child { margin-bottom: 0; }
        .step-num { 
          background: #3b82f6; width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: bold; flex-shrink: 0;
        }
      `}</style>

      <img src="/favicon.png" alt="App Icon" style={{ width: '100px', height: '100px', borderRadius: '22px', marginBottom: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
      <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', fontStyle: 'italic' }}>Dek SA</h1>
      <p style={{ color: '#a1a1aa', textAlign: 'center', margin: '10px 0 30px 0', fontSize: '15px' }}>
        กรุณาติดตั้งแอพลงบนเครื่องก่อนเข้าใช้งาน
      </p>

      {platform === 'android' && (
        <>
          <button 
            className="install-btn" 
            onClick={deferredPrompt ? handleAndroidInstall : () => alert('กรุณากดไอคอนจุด 3 จุดที่มุมขวาบนของ Chrome แล้วเลือก "เพิ่มลงในหน้าจอหลัก" (Add to Home screen)')}
          >
            ⬇️ ติดตั้งแอพทันที
          </button>
          {!deferredPrompt && (
            <div className="ios-steps" style={{ marginTop: '20px' }}>
              <div style={{ color: '#facc15', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                วิธีติดตั้งด้วยตนเอง:
              </div>
              <div className="ios-step">
                <div className="step-num">1</div>
                <div style={{ fontSize: '14px', color: '#e4e4e7' }}>กดไอคอน <strong>⋮</strong> (จุด 3 จุด) ที่มุมขวาบนเบราว์เซอร์</div>
              </div>
              <div className="ios-step">
                <div className="step-num">2</div>
                <div style={{ fontSize: '14px', color: '#e4e4e7' }}>เลือก <strong>"เพิ่มลงในหน้าจอหลัก"</strong> (Add to Home screen)</div>
              </div>
            </div>
          )}
        </>
      )}

      {platform === 'ios' && (
        <>
          <button className="install-btn" onClick={handleIOSInstall}>
            ⬇️ ดาวน์โหลดโปรไฟล์ติดตั้ง
          </button>
          
          {downloadedProfile && (
            <div className="ios-steps">
              <div style={{ color: '#facc15', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                หลังจากกดดาวน์โหลด ให้ทำตามนี้:
              </div>
              <div className="ios-step">
                <div className="step-num">1</div>
                <div style={{ fontSize: '14px', color: '#e4e4e7' }}>กด <strong>"อนุญาต" (Allow)</strong> ในป๊อปอัพ Safari</div>
              </div>
              <div className="ios-step">
                <div className="step-num">2</div>
                <div style={{ fontSize: '14px', color: '#e4e4e7' }}>ไปที่แอพ <strong>การตั้งค่า (Settings)</strong> ของ iPhone</div>
              </div>
              <div className="ios-step">
                <div className="step-num">3</div>
                <div style={{ fontSize: '14px', color: '#e4e4e7' }}>กด <strong>"ดาวน์โหลดโปรไฟล์แล้ว" (Profile Downloaded)</strong> ที่อยู่ด้านบนสุด</div>
              </div>
              <div className="ios-step">
                <div className="step-num">4</div>
                <div style={{ fontSize: '14px', color: '#e4e4e7' }}>กด <strong>"ติดตั้ง" (Install)</strong> มุมขวาบน</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Skip Button */}
      <div 
        onClick={() => setShowGate(false)}
        style={{
          marginTop: '30px',
          color: '#a1a1aa',
          fontSize: '14px',
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: '10px'
        }}
      >
        ข้ามไปก่อน (ใช้งานผ่านเบราว์เซอร์)
      </div>
    </div>
  );
}
