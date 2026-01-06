"use client";

import React, { useEffect, useState, useMemo, useCallback, use } from 'react';
import { PriceTicker } from '@/features/market/components/PriceTicker';
import { MarketCountdown } from '@/features/market/components/MarketCountdown';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { SupabaseMarketRepository } from '@/infrastructure/supabase/SupabaseMarketRepository';
import { Drink, MarketSession, MarketConfig } from '@/domain/types';
import { createClient } from '@/infrastructure/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

export default function PublicPage({ params }: { params: Promise<{ barId: string }> }) {
  const { barId } = use(params);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [session, setSession] = useState<MarketSession | null>(null);
  const [config, setConfig] = useState<MarketConfig | null>(null);
  const [variations, setVariations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const drinkRepo = useMemo(() => new SupabaseDrinkRepository(), []);
  const marketRepo = useMemo(() => new SupabaseMarketRepository(), []);

  const fetchData = useCallback(async () => {
    try {
      const activeSession = await marketRepo.getActiveSession(barId);
      setSession(activeSession);

      if (activeSession) {
        const [drinkList, marketConfig] = await Promise.all([
          drinkRepo.getDrinksByOwner(barId),
          marketRepo.getConfig(barId),
        ]);
        
        // Sort drinks by variation (top performing first)
        const sortedDrinks = [...drinkList].sort((a, b) => {
          const varA = variations[a.id] || 0;
          const varB = variations[b.id] || 0;
          return varB - varA;
        });
        
        setDrinks(sortedDrinks);
        setConfig(marketConfig);

        // Fetch last variations from history
        const client = createClient();
        const { data: history } = await client
          .from('price_history')
          .select('drink_id, variation')
          .eq('session_id', activeSession.id)
          .eq('cycle_number', activeSession.currentCycleNumber - 1);
        
        const varMap: Record<string, number> = {};
        history?.forEach(h => varMap[h.drink_id] = Number(h.variation));
        setVariations(varMap);
      }
    } catch (err) {
      console.error("Error fetching market data:", err);
    } finally {
      setLoading(false);
    }
  }, [barId, marketRepo, drinkRepo, variations]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling safety
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
       <div className="text-rose-500 font-black italic text-4xl animate-pulse tracking-tighter">CHARGEMENT DU MARCHÉ...</div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
       <div className="text-center space-y-4">
          <BarChart3 size={80} className="mx-auto text-neutral-800" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Bourse Fermée</h1>
          <p className="text-neutral-500 font-bold max-w-xs">Le marché n&apos;est pas encore ouvert pour ce bar. Revenez bientôt !</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 space-y-12 overflow-hidden">
      
      {/* Header Display */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-neutral-900 pb-12">
        <div className="space-y-2 text-center md:text-left">
           <h1 className="text-6xl font-black italic tracking-tighter leading-none">
             BÉBÉ <span className="text-rose-500 italic">BOURSICOTE</span>
           </h1>
           <p className="text-neutral-500 font-black text-xs uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              COTATION EN DIRECT • CYCLE #{session.currentCycleNumber}
           </p>
        </div>

        {config && (
          <div className="w-full md:w-96">
            <MarketCountdown 
              durationSeconds={config.cycleDurationSeconds}
              lastUpdateAt={session.lastPriceUpdateAt}
              onFinish={() => setTimeout(fetchData, 2000)}
            />
          </div>
        )}
      </div>

      {/* Market Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {drinks.map((drink, index) => {
            const variation = variations[drink.id] || 0;
            const isUp = variation > 0;
            const isDown = variation < 0;

            return (
              <motion.div
                layout
                key={drink.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-8 rounded-[2.5rem] bg-neutral-900 border-2 transition-all duration-500 shadow-2xl ${
                  isUp ? 'border-green-500/20' : isDown ? 'border-rose-500/20' : 'border-neutral-800'
                }`}
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center text-rose-500">
                      <BarChart3 size={28} />
                    </div>
                    <div className={`flex items-center gap-1 font-black text-sm italic ${
                      isUp ? 'text-green-500' : isDown ? 'text-rose-500' : 'text-neutral-500'
                    }`}>
                      {isUp && <TrendingUp size={16} />}
                      {isDown && <TrendingDown size={16} />}
                      {!isUp && !isDown && <Minus size={16} />}
                      {variation > 0 ? '+' : ''}{variation.toFixed(2)}€
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tight truncate">{drink.name}</h2>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Prix actuel</p>
                  </div>

                  <div className="flex items-end justify-between">
                     <span className="text-5xl font-black italic tracking-tighter tabular-nums drop-shadow-lg">
                       <PriceTicker value={drink.currentPrice} />
                     </span>
                     <span className="mb-2 text-neutral-600 font-bold text-lg italic tracking-tight">EUR</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Ticker Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-900 p-4 h-16 flex items-center overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {drinks.map(d => (
             <div key={`ticker-${d.id}`} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
               <span className="text-neutral-400">{d.name}</span>
               <span className="text-white italic">{d.currentPrice.toFixed(2)}€</span>
               <span className={variations[d.id] > 0 ? 'text-green-500' : variations[d.id] < 0 ? 'text-rose-500' : 'text-neutral-700'}>
                  {(variations[d.id] || 0) > 0 ? '▲' : (variations[d.id] || 0) < 0 ? '▼' : '•'}
               </span>
             </div>
          ))}
          {/* Duplicate for seamless marquee if needed, simplified here */}
        </div>
      </div>
    </div>
  );
}
