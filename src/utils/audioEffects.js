// Ultra-subtle, tactile UI sound generator using Web Audio API
// Synthesizes pleasant micro-haptic sound effects with zero external asset latency.

let audioCtx = null;
let lastPlayTime = 0;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const isUiSoundEnabled = () => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('deksa_ui_sound_enabled');
  return saved === null ? true : saved === 'true';
};

export const setUiSoundEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('deksa_ui_sound_enabled', String(enabled));
};

export const toggleUiSound = () => {
  const next = !isUiSoundEnabled();
  setUiSoundEnabled(next);
  if (next) playUiSound('pop');
  return next;
};

/**
 * Play a subtle micro-sound effect
 * @param {'tab'|'click'|'pop'|'toggle'|'back'|'success'} type 
 */
export const playUiSound = (type = 'click') => {
  if (!isUiSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Prevent double triggering within 30ms
    if (now - lastPlayTime < 0.035) return;
    lastPlayTime = now;

    if (type === 'tab' || type === 'menu') {
      // Soft satisfying acoustic tap (like iOS / macOS tab change)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'pop' || type === 'open') {
      // Soft gentle bubble pop for opening dropdowns, modals or bells
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'back' || type === 'close') {
      // Soft low tone for closing or navigating back
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } else if (type === 'success') {
      // Harmonic 2-tone pleasant confirmation
      [659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startT = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startT);

        gain.gain.setValueAtTime(0.06, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startT);
        osc.stop(startT + 0.13);
      });
    } else {
      // Crisp subtle micro-click (tactile mechanical click)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.035);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch {
    // Ignore audio policy errors silently
  }
};

/**
 * Initialize global delegated listener so menu buttons and interactive elements
 * automatically trigger subtle micro-haptic sound effects
 */
export const initGlobalUiSounds = () => {
  if (typeof window === 'undefined') return () => {};

  const handleGlobalClick = (e) => {
    // Do not trigger for plain text inputs, textareas, sliders, or video elements
    if (e.target.closest('input, textarea, select, video, .styled-range-input, .omi-slider')) return;

    const target = e.target.closest(
      'button, [role="button"], .header-tab-btn, .mobile-nav-item, .app-item, .game-card, .quick-em-btn, .emoji-chip, .btn-login-nav, .btn-admin-pill, .capsule-profile-btn, .capsule-logout-btn, .header-bell-btn, .back-link-btn, .header-logo, .dock-tool-btn, .dock-btn-main'
    );
    if (!target) return;

    if (
      target.classList.contains('header-tab-btn') ||
      target.classList.contains('mobile-nav-item') ||
      target.getAttribute('role') === 'tab'
    ) {
      playUiSound('tab');
    } else if (
      target.classList.contains('header-bell-btn') ||
      target.classList.contains('btn-login-nav') ||
      target.dataset.sound === 'pop'
    ) {
      playUiSound('pop');
    } else if (
      target.classList.contains('back-link-btn') ||
      target.classList.contains('chat-close-btn') ||
      target.classList.contains('dialog-close-btn')
    ) {
      playUiSound('back');
    } else {
      playUiSound('click');
    }
  };

  window.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
  return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
};
