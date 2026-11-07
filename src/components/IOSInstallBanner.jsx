import React, { useState, useEffect, useRef } from 'react';

/* ─── helpers ─────────────────────────────────────────────── */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

/* ─── styles ──────────────────────────────────────────────── */
const CSS = `
  @keyframes ib-slide-up {
    from { transform: translateY(110%); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }
  @keyframes ib-slide-down {
    from { transform: translateY(0);   opacity: 1; }
    to   { transform: translateY(110%); opacity: 0; }
  }
  @keyframes ib-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,.45); }
    50%      { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
  }
  @keyframes ib-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .ib-overlay {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 10000;
    padding: 0 12px 80px 12px;   /* 80px = above MobileNav */
    pointer-events: none;
  }
  .ib-card {
    background: linear-gradient(145deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);
    border: 1px solid rgba(99,102,241,.35);
    border-radius: 22px;
    box-shadow:
      0 -2px 40px rgba(99,102,241,.18),
      0 24px 64px rgba(0,0,0,.7),
      inset 0 1px 0 rgba(255,255,255,.07);
    pointer-events: all;
    overflow: hidden;
    position: relative;
  }
  .ib-card.entering { animation: ib-slide-up  .45s cubic-bezier(.34,1.56,.64,1) forwards; }
  .ib-card.leaving  { animation: ib-slide-down .35s ease-in forwards; }

  /* shimmer top-line */
  .ib-card::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(139,92,246,.7),rgba(99,102,241,.7),transparent);
  }

  .ib-inner { padding: 18px 18px 20px; }

  /* ── header ── */
  .ib-header {
    display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;
  }
  .ib-title-row { display:flex; align-items:center; gap:11px; }
  .ib-app-icon {
    width:44px; height:44px; border-radius:11px; object-fit:cover;
    box-shadow:0 4px 14px rgba(0,0,0,.45);
  }
  .ib-name { font-size:15px; font-weight:700; color:#fff; font-family:'Kanit',sans-serif; }
  .ib-desc { font-size:11.5px; color:rgba(161,161,170,.85); font-family:'Kanit',sans-serif; margin-top:2px; }

  .ib-close {
    width:30px; height:30px; border-radius:50%;
    background:rgba(255,255,255,.07); border:none;
    color:rgba(255,255,255,.45); font-size:13px;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:all .2s; flex-shrink:0;
  }
  .ib-close:active { background:rgba(255,255,255,.15); transform:scale(.9); }

  /* ── Android CTA ── */
  .ib-android-cta {
    display:flex; gap:10px; align-items:stretch;
  }
  .ib-install-btn {
    flex:1; padding:13px 18px;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    border:none; border-radius:14px; color:#fff;
    font-size:14px; font-weight:700; font-family:'Kanit',sans-serif;
    cursor:pointer; transition:all .2s ease;
    animation: ib-pulse 2.2s infinite;
    display:flex; align-items:center; justify-content:center; gap:8px;
  }
  .ib-install-btn:active { transform:scale(.97); opacity:.9; }
  .ib-install-btn.loading { animation:none; opacity:.7; cursor:not-allowed; }
  .ib-install-btn .spinner {
    width:16px; height:16px; border:2px solid rgba(255,255,255,.3);
    border-top-color:#fff; border-radius:50%;
    animation: ib-spin .7s linear infinite;
  }

  .ib-later-btn {
    padding:13px 14px;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    border-radius:14px; color:rgba(255,255,255,.5);
    font-size:13px; font-family:'Kanit',sans-serif;
    cursor:pointer; transition:all .2s;
  }
  .ib-later-btn:active { background:rgba(255,255,255,.12); }

  .ib-benefit-row {
    display:flex; gap:8px; margin-bottom:14px;
  }
  .ib-benefit {
    flex:1; padding:9px 8px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.06);
    border-radius:12px; text-align:center;
  }
  .ib-benefit-icon { font-size:18px; margin-bottom:3px; }
  .ib-benefit-text {
    font-size:10.5px; color:rgba(255,255,255,.65);
    font-family:'Kanit',sans-serif; line-height:1.3;
  }

  /* ── iOS steps ── */
  .ib-steps { display:flex; flex-direction:column; gap:9px; margin-bottom:14px; }
  .ib-step {
    display:flex; align-items:center; gap:11px;
    padding:10px 12px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.06);
    border-radius:13px;
  }
  .ib-step-num {
    width:24px; height:24px; border-radius:50%;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; color:#fff;
    flex-shrink:0; font-family:'Kanit',sans-serif;
  }
  .ib-step-text {
    flex:1; font-size:13px; color:rgba(255,255,255,.85);
    font-family:'Kanit',sans-serif; line-height:1.4;
  }
  .ib-step-emoji { font-size:18px; flex-shrink:0; }

  .ib-ios-dismiss {
    width:100%; padding:11px;
    border-radius:13px; border:1px solid rgba(99,102,241,.25);
    background:rgba(99,102,241,.08); color:rgba(161,161,170,.75);
    font-size:13px; font-family:'Kanit',sans-serif;
    cursor:pointer; transition:all .2s;
  }
  .ib-ios-dismiss:active { background:rgba(99,102,241,.18); }

  /* ── iOS Share Button ── */
  .ib-ios-share-btn {
    width: 100%; padding: 13px 18px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none; border-radius: 14px; color: #fff;
    font-size: 14px; font-weight: 700; font-family: 'Kanit', sans-serif;
    cursor: pointer; transition: all .2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-bottom: 10px;
    animation: ib-pulse 2.2s infinite;
  }
  .ib-ios-share-btn:active { transform: scale(.97); opacity:.9; }

  .ib-ios-steps-toggle {
    width: 100%; padding: 10px;
    background: transparent; border: none;
    color: rgba(161,161,170,.7);
    font-size: 12px; font-family: 'Kanit', sans-serif;
    cursor: pointer; text-decoration: underline;
    margin-bottom: 4px;
  }

  .ib-ios-manual {
    display: none;
  }
  .ib-ios-manual.visible {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-bottom: 10px;
  }
`;

/* ─── iOS Share Section sub-component ─────────────────────── */
function IOSShareSection({ onShare, onDismiss, onLater }) {
  const [showManual, setShowManual] = useState(false);
  const hasShareApi = !!navigator.share;

  return (
    <>
      {/* Primary: Open Share Sheet button */}
      {hasShareApi ? (
        <>
          <button className="ib-ios-share-btn" onClick={onShare}>
            <span style={{ fontSize: '18px' }}>⬆️</span>
            กดเพื่อเปิดเมนูแชร์ Safari
          </button>
          <div style={{ fontSize: '11px', color: 'rgba(161,161,170,.65)', textAlign: 'center', fontFamily: 'Kanit,sans-serif', marginBottom: '8px' }}>
            จากนั้นกด <strong style={{ color: 'rgba(255,255,255,.6)' }}>"เพิ่มไปยังหน้าจอโฮม"</strong> → <strong style={{ color: 'rgba(255,255,255,.6)' }}>"เพิ่ม"</strong>
          </div>
        </>
      ) : (
        /* Fallback if share API unavailable — show full manual steps */
        <div className={`ib-ios-manual visible`}>
          <div className="ib-step">
            <div className="ib-step-num">1</div>
            <div className="ib-step-text">กดปุ่ม <strong>"แชร์" ⬆️</strong> ที่แถบล่าง Safari</div>
          </div>
          <div className="ib-step">
            <div className="ib-step-num">2</div>
            <div className="ib-step-text">กด <strong>"เพิ่มไปยังหน้าจอโฮม" ➕</strong></div>
          </div>
          <div className="ib-step">
            <div className="ib-step-num">3</div>
            <div className="ib-step-text">กด <strong>"เพิ่ม"</strong> มุมขวาบน 🎉</div>
          </div>
        </div>
      )}

      {/* Collapsible manual guide (when share API available) */}
      {hasShareApi && (
        <>
          <button
            className="ib-ios-steps-toggle"
            onClick={() => setShowManual(v => !v)}
          >
            {showManual ? '▲ ซ่อนคำแนะนำ' : '▼ ดูวิธีเพิ่มแบบละเอียด'}
          </button>
          <div className={`ib-ios-manual${showManual ? ' visible' : ''}`}>
            <div className="ib-step">
              <div className="ib-step-num">1</div>
              <div className="ib-step-text">กดปุ่ม <strong>"แชร์" ⬆️</strong> ที่แถบล่าง Safari</div>
            </div>
            <div className="ib-step">
              <div className="ib-step-num">2</div>
              <div className="ib-step-text">กด <strong>"เพิ่มไปยังหน้าจอโฮม" ➕</strong></div>
            </div>
            <div className="ib-step">
              <div className="ib-step-num">3</div>
              <div className="ib-step-text">กด <strong>"เพิ่ม"</strong> มุมขวาบน 🎉</div>
            </div>
          </div>
        </>
      )}

      {/* Bottom row */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
        <button className="ib-ios-dismiss" style={{ flex: 1 }} onClick={onDismiss}>เข้าใจแล้ว</button>
        <button className="ib-later-btn" onClick={onLater}>ภายหลัง</button>
      </div>
    </>
  );
}

/* ─── component ───────────────────────────────────────────── */
export default function InstallBanner() {
  const [phase, setPhase] = useState('hidden'); // hidden | entering | visible | leaving
  const [platform, setPlatform] = useState(null); // 'android' | 'ios' | null
  const [installing, setInstalling] = useState(false);
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // Already installed — don't show
    if (isInStandaloneMode()) return;

    const dismissed = localStorage.getItem('install-banner-dismissed-v2');
    if (dismissed) return;

    const plt = isIOS() ? 'ios' : isAndroid() ? 'android' : null;
    if (!plt) {
      // Desktop — still capture beforeinstallprompt for Chrome desktop
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      if (!plt) setPlatform('android'); // treat desktop Chrome as android flow
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS we can show right away (no event needed)
    if (plt === 'ios') setPlatform('ios');
    // For Android the platform is set when the event fires
    if (plt === 'android') setPlatform('android'); // show even without event (guide fallback)

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Trigger entrance animation once platform is known
  useEffect(() => {
    if (!platform) return;
    const t = setTimeout(() => {
      setPhase('entering');
      setTimeout(() => setPhase('visible'), 450);
    }, 1800);
    return () => clearTimeout(t);
  }, [platform]);

  const dismiss = (permanent = true) => {
    setPhase('leaving');
    setTimeout(() => {
      setPhase('hidden');
      if (permanent) localStorage.setItem('install-banner-dismissed-v2', 'true');
    }, 380);
  };

  const handleInstallClick = async () => {
    if (deferredPromptRef.current) {
      // Native Android install
      setInstalling(true);
      try {
        deferredPromptRef.current.prompt();
        const { outcome } = await deferredPromptRef.current.userChoice;
        if (outcome === 'accepted') {
          dismiss(true);
        } else {
          setInstalling(false);
        }
      } catch {
        setInstalling(false);
      }
      deferredPromptRef.current = null;
    }
    // If no deferred prompt (older Android) — banner already shows guide text
  };

  // iOS: try to open native share sheet so user just needs to tap "Add to Home Screen"
  const handleIOSShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dek SA',
          text: 'เพิ่ม Dek SA ไปหน้าโฮม เพื่อใช้งานแบบแอพ',
          url: window.location.href,
        });
      } catch (e) {
        // User cancelled or share failed — do nothing
      }
    }
  };


  if (phase === 'hidden' || !platform) return null;

  const cardClass = `ib-card ${phase === 'entering' ? 'entering' : phase === 'leaving' ? 'leaving' : ''}`;

  return (
    <>
      <style>{CSS}</style>
      <div className="ib-overlay">
        <div className={cardClass}>
          <div className="ib-inner">

            {/* ── Header ── */}
            <div className="ib-header">
              <div className="ib-title-row">
                <img src="/favicon.png" alt="Dek SA" className="ib-app-icon" />
                <div>
                  <div className="ib-name">Dek SA</div>
                  <div className="ib-desc">เพิ่มไปหน้าโฮม ใช้งานแบบแอพเลย</div>
                </div>
              </div>
              <button className="ib-close" onClick={() => dismiss(true)} aria-label="ปิด">✕</button>
            </div>

            {/* ── Benefits ── */}
            <div className="ib-benefit-row">
              <div className="ib-benefit">
                <div className="ib-benefit-icon">⚡</div>
                <div className="ib-benefit-text">เร็วกว่า<br/>เบราว์เซอร์</div>
              </div>
              <div className="ib-benefit">
                <div className="ib-benefit-icon">📴</div>
                <div className="ib-benefit-text">ใช้งาน<br/>ออฟไลน์ได้</div>
              </div>
              <div className="ib-benefit">
                <div className="ib-benefit-icon">🔔</div>
                <div className="ib-benefit-text">รับการ<br/>แจ้งเตือน</div>
              </div>
            </div>

            {/* ── Android: Install button ── */}
            {platform === 'android' && (
              <div className="ib-android-cta">
                <button
                  className={`ib-install-btn${installing ? ' loading' : ''}`}
                  onClick={handleInstallClick}
                  disabled={installing}
                >
                  {installing
                    ? <><span className="spinner" /> กำลังติดตั้ง...</>
                    : <>📲 เพิ่มไปหน้าโฮม</>}
                </button>
                <button className="ib-later-btn" onClick={() => dismiss(false)}>ภายหลัง</button>
              </div>
            )}

            {/* ── iOS: Share button + collapsible manual guide ── */}
            {platform === 'ios' && (
              <IOSShareSection
                onShare={handleIOSShare}
                onDismiss={() => dismiss(true)}
                onLater={() => dismiss(false)}
              />
            )}

          </div>
        </div>
      </div>
    </>
  );
}
