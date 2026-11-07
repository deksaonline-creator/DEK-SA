/**
 * iOS Safari Viewport Height Utilities
 *
 * iOS Safari includes the browser chrome (address bar) in 100vh,
 * which causes content to be clipped.
 *
 * main.jsx sets --vh = window.innerHeight * 0.01 and updates it on resize.
 * Use these helpers for any element that needs full viewport height.
 */

/** CSS string for full viewport height — safe on iOS Safari */
export const fullVh = 'calc(var(--vh, 1vh) * 100)';

/**
 * Returns a style object with minHeight set to the iOS-safe full viewport.
 * Usage: <div style={{ ...minFullVh, ... }}>
 */
export const minFullVh = { minHeight: fullVh };

/**
 * Returns a style object with height set to the iOS-safe full viewport.
 * Usage: <div style={{ ...heightFullVh, ... }}>
 */
export const heightFullVh = { height: fullVh };
