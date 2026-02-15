import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketCountdownProps {
  durationSeconds: number;
  lastUpdateAt: Date;
  onFinish: () => void;
  onCycleEnd?: () => void;
}

export const MarketCountdown: React.FC<MarketCountdownProps> = ({ 
  durationSeconds, 
  lastUpdateAt, 
  onFinish,
  onCycleEnd
}) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date().getTime();
    const lastUpdate = new Date(lastUpdateAt).getTime();
    const elapsed = Math.floor((now - lastUpdate) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  });

  useEffect(() => {
    // Calculate precise expiry time once
    const expiryTime = new Date(lastUpdateAt).getTime() + (durationSeconds * 1000);

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((expiryTime - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onCycleEnd?.();
        onFinish();
      }
    };

    // Run immediately
    updateTimer();

    // Sync efficiently
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [durationSeconds, lastUpdateAt, onFinish, onCycleEnd]);

  const isUrgent = timeLeft <= 10;
  
  // Format MM:SS or just SS if < 60
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes > 0 ? `${minutes}:` : ''}${seconds < 10 && minutes > 0 ? '0' : ''}${seconds}`;

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-primary-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-500">
             Prochain cycle
        </span>
      </div>
      
      <AnimatePresence mode="popLayout">
          <motion.div 
            key={timeLeft}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`text-5xl md:text-6xl font-black italic tracking-tighter tabular-nums leading-none ${
                isUrgent ? 'text-primary-500' : 'text-white'
            }`}
          >
            {formattedTime}
          </motion.div>
      </AnimatePresence>
    </div>
  );
};
