import { useCallback, useRef, useState } from "react";

export type SoundType = "chime" | "pop" | "bell" | "drop" | "ping";

// Sound configurations for different notification tones
const SOUND_CONFIGS: Record<SoundType, { name: string; play: (ctx: AudioContext, now: number) => void }> = {
  chime: {
    name: "Chime (ডিং-ডং)",
    play: (ctx, now) => {
      playTone(ctx, 880, now, 0.15, 0.1);
      playTone(ctx, 1174.66, now + 0.1, 0.2, 0.08);
    }
  },
  pop: {
    name: "Pop (পপ)",
    play: (ctx, now) => {
      playTone(ctx, 600, now, 0.08, 0.15, 'sine');
      playTone(ctx, 900, now + 0.03, 0.1, 0.1, 'sine');
    }
  },
  bell: {
    name: "Bell (ঘণ্টা)",
    play: (ctx, now) => {
      playTone(ctx, 1200, now, 0.3, 0.12, 'sine');
      playTone(ctx, 1800, now, 0.2, 0.06, 'sine');
      playTone(ctx, 2400, now, 0.15, 0.03, 'sine');
    }
  },
  drop: {
    name: "Water Drop (জল)",
    play: (ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  },
  ping: {
    name: "Ping (পিং)",
    play: (ctx, now) => {
      playTone(ctx, 1000, now, 0.12, 0.12, 'triangle');
    }
  }
};

// Helper function to play a single tone
const playTone = (
  ctx: AudioContext, 
  frequency: number, 
  startTime: number, 
  duration: number, 
  volume: number,
  type: OscillatorType = 'sine'
) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

export const AVAILABLE_SOUNDS = Object.entries(SOUND_CONFIGS).map(([key, value]) => ({
  id: key as SoundType,
  name: value.name
}));

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [selectedSound, setSelectedSound] = useState<SoundType>(() => {
    return (localStorage.getItem('notification-sound') as SoundType) || 'chime';
  });

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((soundType?: SoundType) => {
    try {
      const ctx = getContext();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const sound = soundType || selectedSound;
      SOUND_CONFIGS[sound].play(ctx, now);
      
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }, [getContext, selectedSound]);

  const changeSound = useCallback((sound: SoundType) => {
    setSelectedSound(sound);
    localStorage.setItem('notification-sound', sound);
  }, []);

  return { playSound, selectedSound, changeSound };
};
