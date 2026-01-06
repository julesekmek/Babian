import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MarketCountdownProps {
  durationSeconds: number;
  lastUpdateAt: Date;
  onFinish: () => void;
}

export const MarketCountdown: React.FC<MarketCountdownProps> = ({ 
  durationSeconds, 
  lastUpdateAt, 
  onFinish 
}) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date().getTime();
    const lastUpdate = new Date(lastUpdateAt).getTime();
    const elapsed = Math.floor((now - lastUpdate) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const lastUpdate = new Date(lastUpdateAt).getTime();
      const elapsed = Math.floor((now - lastUpdate) / 1000);
      return Math.max(0, durationSeconds - elapsed);
    };

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onFinish();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [durationSeconds, lastUpdateAt, onFinish]);

  const progress = (timeLeft / durationSeconds) * 100;

  return (
    <div className="relative w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 mb-8">
      <motion.div
        className="absolute top-0 left-0 h-full bg-linear-to-r from-rose-500 to-orange-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
        initial={{ width: "100%" }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: "linear", duration: 1 }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-tighter mix-blend-difference text-white">
          Prochain cycle : {timeLeft}s
        </span>
      </div>
    </div>
  );
};
