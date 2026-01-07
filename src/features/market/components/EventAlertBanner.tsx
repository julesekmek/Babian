import React from 'react';
import { motion } from 'framer-motion';
import { MarketEvent } from '@/domain/types';
import { Zap, TrendingDown, Lock } from 'lucide-react';

interface EventAlertBannerProps {
  events: MarketEvent[];
}

export const EventAlertBanner: React.FC<EventAlertBannerProps> = ({ events }) => {
  if (events.length === 0) return null;

  const getEventIcon = (type: MarketEvent['type']) => {
    switch (type) {
      case 'discount': return <Zap size={20} />;
      case 'crash': return <TrendingDown size={20} />;
      case 'fixed_price': return <Lock size={20} />;
    }
  };

  const getEventColor = (type: MarketEvent['type']) => {
    switch (type) {
      case 'discount': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
      case 'crash': return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
      case 'fixed_price': return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
    }
  };

  const getTimeRemaining = (endAt: Date) => {
    const now = new Date();
    const diff = endAt.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return minutes > 0 ? `${minutes}min` : `${seconds}s`;
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t-2 border-neutral-900"
    >
      <div className="overflow-hidden py-4">
        <div className="flex gap-8 animate-marquee-slow">
          {events.map(event => (
            <div
              key={event.id}
              className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 whitespace-nowrap ${getEventColor(event.type)}`}
            >
              <div className="flex items-center gap-2">
                {getEventIcon(event.type)}
                <span className="font-black uppercase text-sm tracking-wider">
                  {event.name}
                </span>
              </div>
              
              <div className="h-6 w-px bg-current opacity-30" />
              
              <div className="flex items-center gap-2 text-xs font-bold uppercase">
                <span className="opacity-70">
                  {event.drinkIds.length === 0 ? 'GLOBAL' : `${event.drinkIds.length} cocktails`}
                </span>
                <span>•</span>
                <span className="tabular-nums">
                  {getTimeRemaining(event.endAt)}
                </span>
              </div>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {events.map(event => (
            <div
              key={`dup-${event.id}`}
              className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 whitespace-nowrap ${getEventColor(event.type)}`}
            >
              <div className="flex items-center gap-2">
                {getEventIcon(event.type)}
                <span className="font-black uppercase text-sm tracking-wider">
                  {event.name}
                </span>
              </div>
              
              <div className="h-6 w-px bg-current opacity-30" />
              
              <div className="flex items-center gap-2 text-xs font-bold uppercase">
                <span className="opacity-70">
                  {event.drinkIds.length === 0 ? 'GLOBAL' : `${event.drinkIds.length} cocktails`}
                </span>
                <span>•</span>
                <span className="tabular-nums">
                  {getTimeRemaining(event.endAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
