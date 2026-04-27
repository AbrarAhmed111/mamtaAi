/** Short double-beep for new notifications (Web Audio; may stay silent until user gesture on some browsers). */
export function playNotificationBeep(): void {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const schedule = (start: number, freq: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.start(t0);
      osc.stop(t0 + duration);
    };
    schedule(0, 880, 0.12, 0.11);
    schedule(0.18, 1046, 0.12, 0.09);
    const closeAt = Math.ceil((0.18 + 0.12) * 1000) + 80;
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, closeAt);
  } catch {
    // ignore
  }
}
