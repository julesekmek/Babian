import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drink } from '@/domain/types';
import { PriceTicker } from './PriceTicker';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MarketGridProps {
  drinks: Drink[];
  variations: Record<string, number>;
}

export const MarketGrid: React.FC<MarketGridProps> = ({ drinks, variations }) => {
  // Calculate optimal grid layout to FIT without scroll
  // We prioritize filling the screen.
  const gridStyle = useMemo(() => {
    const count = drinks.length;
    let cols = 3;
    let rows = 1;

    // Heuristics for 16:9 landscape screens mainly
    if (count <= 3) { cols = count; rows = 1; }
    else if (count <= 6) { cols = 3; rows = 2; }
    else if (count <= 8) { cols = 4; rows = 2; }
    else if (count <= 12) { cols = 4; rows = 3; }
    else if (count <= 15) { cols = 5; rows = 3; }
    else if (count <= 20) { cols = 5; rows = 4; }
    else if (count <= 24) { cols = 6; rows = 4; }
    else if (count <= 30) { cols = 6; rows = 5; }
    else { cols = 8; rows = Math.ceil(count / 8); } // Fallback for huge menus

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    };
  }, [drinks.length]);

  const getSizeClass = () => {
      const count = drinks.length;
      if (count <= 6) return 'large';
      if (count <= 12) return 'medium';
      if (count <= 20) return 'small';
      return 'tiny';
  };

  const size = getSizeClass();

  // Dynamic Tailwind classes based on density
  const cardPadding = size === 'large' ? 'p-6' : size === 'medium' ? 'p-4' : size === 'small' ? 'p-2' : 'p-1';
  const nameSize = size === 'large' ? 'text-3xl' : size === 'medium' ? 'text-xl' : size === 'small' ? 'text-sm' : 'text-xs';
  const priceSize = size === 'large' ? 'text-7xl' : size === 'medium' ? 'text-5xl' : size === 'small' ? 'text-3xl' : 'text-xl';
  const iconSize = size === 'large' ? 32 : size === 'medium' ? 24 : size === 'small' ? 16 : 12;

  return (
    <div style={gridStyle} className="h-full w-full gap-2 md:gap-4 p-2">
        {drinks.map((drink, index) => {
          const variation = variations[drink.id] || 0;
          const isUp = variation > 0;
          const isDown = variation < 0;
          const isNeutral = !isUp && !isDown;

          // Color logic: Green/Red/Neutral
          const borderColor = isUp ? 'border-green-500' : isDown ? 'border-red-600' : 'border-neutral-800';
          const bgColor = isUp ? 'bg-green-950/20' : isDown ? 'bg-red-950/20' : 'bg-neutral-900';
          const textColor = isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-neutral-500';

          return (
            <motion.div
              layout
              key={drink.id}
              transition={{ 
                layout: {
                  type: "spring",
                  stiffness: 200,
                  damping: 30
                }
              }}
              className={`
                relative flex flex-col justify-between
                rounded-2xl border-2 ${borderColor} ${bgColor} 
                ${cardPadding} transition-colors duration-500 shadow-xl overflow-hidden
              `}
            >
               {/* Background Glow */}
               <div className={`absolute inset-0 opacity-10 ${isUp ? 'bg-green-500' : isDown ? 'bg-red-600' : 'bg-transparent'}`} />

              {/* Header: Name & Trend */}
              <div className="flex justify-between items-start z-10">
                <h2 className={`${nameSize} font-black uppercase tracking-tight leading-none text-white line-clamp-2 w-full pr-2`}>
                    {drink.name}
                </h2>
                
                {/* Visual Indicator of Trend */}
                <div className={`flex flex-col items-end ${textColor}`}>
                     {isUp && <TrendingUp size={iconSize} />}
                     {isDown && <TrendingDown size={iconSize} />}
                     {isNeutral && <Minus size={iconSize} />}
                </div>
              </div>

              {/* Price Area */}
              <div className="flex items-end justify-between z-10 mt-auto">
                 <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs text-neutral-400 font-mono uppercase tracking-widest opacity-70">Cours actuel</span>
                    <div className={`${priceSize} font-black italic tracking-tighter tabular-nums leading-none text-white drop-shadow-lg flex items-baseline gap-1`}>
                        <PriceTicker value={drink.currentPrice} />
                        <span className="text-sm md:text-lg opacity-50 font-normal">€</span>
                    </div>
                 </div>

                 {/* Variation Badge */}
                 <div className={`
                    rounded-lg px-2 py-1 flex items-center gap-1 font-bold font-mono tracking-tighter
                    ${isUp ? 'bg-green-500 text-black' : isDown ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'}
                 `}>
                    <span className="text-xs md:text-sm">
                        {variation > 0 ? '+' : ''}{variation.toFixed(2)}
                    </span>
                 </div>
              </div>
            </motion.div>
          );
        })}
    </div>
  );
};
