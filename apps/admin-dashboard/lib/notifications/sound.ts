// Web Audio API concierge chime synthesizer
// Produces clean, rich, 5-star hotel bell tones without external mp3 files

export function playChimeSound(type: "new_booking" | "cancellation" | "test" = "new_booking") {
    if (typeof window === "undefined") return;

    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;

        if (type === "cancellation") {
            // Two-tone warning tone (urgent minor chord: F4 -> D4)
            const playTone = (freq: number, start: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, now + start);
                gain.gain.setValueAtTime(0.25, now + start);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + start);
                osc.stop(now + start + duration);
            };
            playTone(392.0, 0, 0.25);   // G4
            playTone(329.63, 0.18, 0.5); // E4
            return;
        }

        // Two-tone cheerful hotel desk bell (A5: 880Hz -> E6: 1318.5Hz) with natural decay
        const playBell = (freq: number, start: number, duration: number, peakVol: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + start);
            
            gain.gain.setValueAtTime(0.0001, now + start);
            gain.gain.linearRampToValueAtTime(peakVol, now + start + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };

        // Primary fundamental bell
        playBell(880.0, 0, 0.45, 0.28);
        // Overtone chime
        playBell(1318.5, 0.12, 0.9, 0.32);
        // Harmonic sparkle
        playBell(2637.0, 0.13, 0.6, 0.08);

    } catch (err) {
        console.warn("[ConciergeSound] Web Audio playback error:", err);
    }
}
