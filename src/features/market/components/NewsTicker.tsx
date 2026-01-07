import React from 'react';
import { MarketEvent, Drink } from '@/domain/types';
import { Zap, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface NewsTickerProps {
  events: MarketEvent[];
  topDrinks?: Drink[]; // For stats
  variations?: Record<string, number>;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ events, topDrinks = [], variations = {} }) => {
  // Combine all items into a single list for the ticker
  const tickerItems = [
    // 1. Events (High Priority)
    ...events.map(event => ({
      type: 'event' as const,
      id: event.id,
      content: `${event.name} - ${event.type === 'discount' ? 'PROMO' : 'EVENT'}`,
      detail: 'EN COURS',
      color: 'text-yellow-400'
    })),
    // 2. Market Status (Medium Priority)
    {
      type: 'status',
      id: 'market-status',
      content: 'BOURSE EN DIRECT',
      detail: 'LA DEMANDE FAIT LE PRIX',
      color: 'text-rose-500'
    },
    // 3. Top Movers with Stats
    ...topDrinks.map(drink => {
       const variation = variations[drink.id] || 0;
       // Mock order count for now or use passed prop if available (we will add 'totalOrders' to Drink or pass a map)
       // For now, let's use a generic 'Commandes' label if we don't have exact counts, 
       // but wait, the plan said "Affiche statistiques globales". 
       // I will assume the parent passes 'ordersCount' in a future iteration or I'll add a prop now.
       // Let's rely on `variations` as a proxy for activity if no explicit count is passed, 
       // but typically we want "X commandes".
       // Since I haven't wired up the "orders count" fetch yet, I'll use a placeholder or derived value if possible.
       // Actually, I'll update the interface first.
       return {
         type: 'quote' as const,
         id: drink.id,
         content: drink.name,
         detail: `${drink.currentPrice.toFixed(2)}€ (${variation > 0 ? '+' : ''}${variation.toFixed(2)}€)`,
         color: variation > 0 ? 'text-green-500' : variation < 0 ? 'text-red-500' : 'text-neutral-400'
       };
    })
  ];

  // If empty, don't show anything (or show generic)
  if (tickerItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-neutral-900 border-t border-neutral-800 flex items-center overflow-hidden">
        {/* Label Fixed Left */}
        <div className="shrink-0 bg-rose-600 h-full px-6 flex items-center justify-center z-10 shadow-xl relative after:absolute after:right-[-20px] after:top-0 after:border-t-32 after:border-t-transparent after:border-l-20 after:border-l-rose-600 after:border-b-32 after:border-b-transparent">
            <span className="font-black italic text-white uppercase tracking-tighter text-lg">
                FLASH INFOS
            </span>
        </div>

        {/* Marquee Container */}
        <div className="flex-1 overflow-hidden relative flex items-center h-full bg-black pl-8">
             <div className="flex animate-marquee-slow whitespace-nowrap items-center gap-12 w-max">
                 {[...tickerItems, ...tickerItems].map((item, i) => (
                     <div key={`${item.id}-${i}`} className="flex items-center gap-3">
                         {item.type === 'event' && <Zap size={18} className="text-yellow-400 animate-pulse" />}
                         {item.type === 'status' && <Info size={18} className="text-rose-500" />}
                         {item.type === 'quote' && (
                             item.color.includes('green') ? <TrendingUp size={18} className="text-green-500" /> :
                             item.color.includes('red') ? <TrendingDown size={18} className="text-red-500" /> : null
                         )}
                         
                         <span className={`font-bold uppercase tracking-wide text-xl ${item.color}`}>
                             {item.content}
                         </span>
                         <span className="text-neutral-500 font-medium text-sm border-l border-neutral-800 pl-3">
                             {item.detail}
                         </span>
                         
                         <span className="text-neutral-800 mx-2">{"///"}</span>
                     </div>
                 ))}
             </div>
        </div>
    </div>
  );
};
