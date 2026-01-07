import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketEvent } from '@/domain/types';
import { Zap, TrendingDown, Lock, Play, Check } from 'lucide-react';

interface EventTemplateCardProps {
  event: MarketEvent;
  onActivate: (eventId: string, durationMinutes: number) => void;
  isActivating?: boolean;
}

export const EventTemplateCard: React.FC<EventTemplateCardProps> = ({ 
  event, 
  onActivate,
  isActivating = false 
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const getEventIcon = (type: MarketEvent['type']) => {
    switch (type) {
      case 'discount': return <Zap size={20} className="text-yellow-500" />;
      case 'crash': return <TrendingDown size={20} className="text-rose-500" />;
      case 'fixed_price': return <Lock size={20} className="text-blue-500" />;
    }
  };

  const getEventColor = (type: MarketEvent['type']) => {
    switch (type) {
      case 'discount': return 'border-yellow-500/30 hover:border-yellow-500/50';
      case 'crash': return 'border-rose-500/30 hover:border-rose-500/50';
      case 'fixed_price': return 'border-blue-500/30 hover:border-blue-500/50';
    }
  };

  const getDurationMinutes = () => {
    return Math.round((event.endAt.getTime() - event.startAt.getTime()) / 60000);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showConfirm) {
      onActivate(event.id, getDurationMinutes());
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000); // Auto-reset after 3s
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-2xl bg-neutral-900 border-2 transition-all ${getEventColor(event.type)}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {getEventIcon(event.type)}
          <h3 className="font-black text-sm uppercase tracking-tight">{event.name}</h3>
        </div>
        <button
          onClick={handleClick}
          disabled={isActivating}
          className={`p-2 rounded-xl transition-all disabled:opacity-50 shrink-0 flex items-center gap-2 ${
            showConfirm ? 'bg-green-500 hover:bg-green-600 text-white w-auto px-4' : 'bg-rose-500 hover:bg-rose-600 text-white'
          }`}
        >
          {isActivating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : showConfirm ? (
            <>
              <span className="text-xs font-black uppercase">Confirmer ?</span>
              <Check size={16} />
            </>
          ) : (
            <Play size={16} />
          )}
        </button>
      </div>

      {event.description && (
        <p className="text-xs text-neutral-400 mb-3 line-clamp-2">{event.description}</p>
      )}

      <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-neutral-500">
        <span>
          {event.type === 'fixed_price' ? `${event.value}€` : `-${event.value}%`}
        </span>
        <span>•</span>
        <span>{getDurationMinutes()} min</span>
        <span>•</span>
        <span>{event.drinkIds.length === 0 ? 'Global' : `${event.drinkIds.length} cocktails`}</span>
      </div>
    </motion.div>
  );
};
