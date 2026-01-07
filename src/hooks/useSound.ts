import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook to play sound notifications in the browser.
 * Handles autoplay policies by requiring user interaction first.
 */
export function useSound(soundUrl: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isEnabledRef = useRef(false);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = 0.5;

    // Enable sound on first user interaction
    const enableSound = () => {
      isEnabledRef.current = true;
      document.removeEventListener('click', enableSound);
      document.removeEventListener('touchstart', enableSound);
    };

    document.addEventListener('click', enableSound);
    document.addEventListener('touchstart', enableSound);

    return () => {
      document.removeEventListener('click', enableSound);
      document.removeEventListener('touchstart', enableSound);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl]);

  const play = useCallback(() => {
    if (audioRef.current && isEnabledRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.warn('Sound playback failed:', err);
      });
    }
  }, []);

  return { play };
}
