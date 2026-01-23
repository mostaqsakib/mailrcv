import { useCallback, useRef } from "react";

// A subtle, pleasant notification sound using Web Audio API
export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (required for some browsers)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Create a gentle, pleasant two-tone notification
      const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        // Gentle envelope for smooth sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play a subtle two-note chime (like a soft "ding-dong")
      playTone(880, now, 0.15, 0.08);        // A5 - first note
      playTone(1174.66, now + 0.1, 0.2, 0.06); // D6 - second note (higher, softer)
      
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }, []);

  return { playSound };
};
