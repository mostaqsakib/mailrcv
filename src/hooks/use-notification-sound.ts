import { useCallback, useRef } from "react";

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Helper to play a tone
      const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Tri-tone (iPhone style)
      playTone(1046.5, now, 0.1, 0.15);         // C6
      playTone(1318.5, now + 0.12, 0.1, 0.12);  // E6
      playTone(1568, now + 0.24, 0.15, 0.1);    // G6
      
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }, []);

  return { playSound };
};
