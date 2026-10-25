// src/shared/audio.js
// Tactile audio feedback synthesis using Web Audio API (Paper & Pine design system).
// Conforms to rules: context-reuse-single, envelope-exponential-decay, a11y-toggle-setting.

let audioCtx = null;

function getAudioContext() {
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
}

/**
 * Synthesizes a subtle, tactile wooden-tick click transient for conversion feedback.
 * Uses an exponential decay envelope over 12ms at low gain (0.08) to feel mechanical and physical.
 */
export function playTactileClick() {
  try {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Wood-tick transient: rapid frequency drop from 850Hz to 180Hz over 9ms
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.009);

    // Exponential decay gain envelope (Rule envelope-exponential-decay)
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.014);
  } catch (e) {
    // Fail silently in environments where audio is blocked or unsupported
  }
}

/**
 * Synthesizes a soft, two-tone descending chime for non-blocking error/warning feedback.
 */
export function playErrorChime() {
  try {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Gentle two-tone descending chime: 440Hz -> 330Hz
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.06);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    // Fail silently
  }
}
