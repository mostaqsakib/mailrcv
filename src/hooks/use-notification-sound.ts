import { useCallback, useRef, useState } from "react";

export type SoundType = "tritone" | "bamboo" | "crystal" | "pulse" | "soft" | "messenger" | "gentle";

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
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// Sound configurations for different notification tones
const SOUND_CONFIGS: Record<SoundType, { name: string; play: (ctx: AudioContext, now: number) => void }> = {
  tritone: {
    name: "Tri-tone (iPhone style)",
    play: (ctx, now) => {
      // Classic iPhone tri-tone
      playTone(ctx, 1046.5, now, 0.1, 0.15);         // C6
      playTone(ctx, 1318.5, now + 0.12, 0.1, 0.12);  // E6
      playTone(ctx, 1568, now + 0.24, 0.15, 0.1);    // G6
    }
  },
  bamboo: {
    name: "Bamboo (মৃদু)",
    play: (ctx, now) => {
      // Soft wooden knock sound
      playTone(ctx, 800, now, 0.08, 0.12);
      playTone(ctx, 1200, now + 0.1, 0.12, 0.08);
    }
  },
  crystal: {
    name: "Crystal (স্বচ্ছ)",
    play: (ctx, now) => {
      // Sparkly crystal chime
      playTone(ctx, 2093, now, 0.2, 0.08);           // C7
      playTone(ctx, 2637, now + 0.05, 0.25, 0.06);   // E7
      playTone(ctx, 3136, now + 0.1, 0.3, 0.04);     // G7
    }
  },
  pulse: {
    name: "Pulse (WhatsApp style)",
    play: (ctx, now) => {
      // WhatsApp-like double pulse
      playTone(ctx, 587.33, now, 0.08, 0.15);        // D5
      playTone(ctx, 880, now + 0.1, 0.1, 0.12);      // A5
    }
  },
  soft: {
    name: "Soft Glow (কোমল)",
    play: (ctx, now) => {
      // Very gentle, warm tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  },
  messenger: {
    name: "Messenger (Pop)",
    play: (ctx, now) => {
      // Facebook Messenger style pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  },
  gentle: {
    name: "Gentle Breeze (শান্ত)",
    play: (ctx, now) => {
      // Soft ascending chord
      playTone(ctx, 523.25, now, 0.25, 0.06);        // C5
      playTone(ctx, 659.25, now + 0.08, 0.22, 0.05); // E5
      playTone(ctx, 783.99, now + 0.16, 0.2, 0.04);  // G5
    }
  }
};

export const AVAILABLE_SOUNDS = Object.entries(SOUND_CONFIGS).map(([key, value]) => ({
  id: key as SoundType,
  name: value.name
}));

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [selectedSound, setSelectedSound] = useState<SoundType>(() => {
    return (localStorage.getItem('notification-sound') as SoundType) || 'tritone';
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
