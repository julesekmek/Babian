"use client";

import React, { useEffect, useState, useMemo, useCallback, use } from 'react';
import { MarketGrid } from '@/features/market/components/MarketGrid';
import { MarketCountdown } from '@/features/market/components/MarketCountdown';
import { NewsTicker } from '@/features/market/components/NewsTicker';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { SupabaseMarketRepository } from '@/infrastructure/supabase/SupabaseMarketRepository';
import { Drink, MarketSession, MarketConfig, MarketEvent } from '@/domain/types';
import { createClient } from '@/infrastructure/supabase/client';
import { useSound } from '@/hooks/useSound';
import { BarChart3 } from 'lucide-react';

export default function PublicPage({ params }: { params: Promise<{ barId: string }> }) {
  const { barId } = use(params);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [session, setSession] = useState<MarketSession | null>(null);
  const [config, setConfig] = useState<MarketConfig | null>(null);
  const [activeEvents, setActiveEvents] = useState<MarketEvent[]>([]);
  const [variations, setVariations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const drinkRepo = useMemo(() => new SupabaseDrinkRepository(), []);
  const marketRepo = useMemo(() => new SupabaseMarketRepository(), []);
  
  // Sound notification
  const { play: playSound } = useSound('/sounds/cycle-end.mp3');

  // Memoize sorted drinks to avoid re-sorting on every variations update unnecessarily
  const sortedDrinks = useMemo(() => {
    return [...drinks].sort((a, b) => {
      const varA = variations[a.id] || 0;
      const varB = variations[b.id] || 0;
      return varB - varA;
    });
  }, [drinks, variations]);

  const fetchData = useCallback(async () => {
    try {
      const activeSession = await marketRepo.getActiveSession(barId);
      setSession(activeSession);

      if (activeSession) {
        const [drinkList, marketConfig, events] = await Promise.all([
          drinkRepo.getDrinksByOwner(barId),
          marketRepo.getConfig(barId),
          marketRepo.getActiveEvents(barId)
        ]);
        
        setDrinks(drinkList);
        setConfig(marketConfig);
        setActiveEvents(events);

        // Fetch last variations from history
        const client = createClient();
        const { data: history } = await client
          .from('price_history')
          .select('drink_id, variation')
          .eq('session_id', activeSession.id)
          .eq('cycle_number', activeSession.currentCycleNumber);
        
        const varMap: Record<string, number> = {};
        history?.forEach(h => varMap[h.drink_id] = Number(h.variation));
        setVariations(varMap);
      }
    } catch (err: unknown) {
      console.error("Error fetching market data for barId:", barId);
    } finally {
      setLoading(false);
    }
  }, [barId, marketRepo, drinkRepo]); // Removed variations from here!

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling safety
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCycleEnd = useCallback(async () => {
    console.log("🔔 Cycle end triggered!");
    playSound();
    if (session?.barmanId) {
        try {
            const res = await fetch('/api/market/cycle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barmanId: session.barmanId })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                console.error("❌ Cycle API Error:", errorData.error, errorData.details);
            } else {
                console.log("✅ Cycle processed successfully");
                fetchData();
            }
        } catch (e) {
            console.error("Failed to call cycle API:", e);
        }
    } else {
         console.warn("Session not ready for cycle increment");
    }
  }, [playSound, fetchData, session?.barmanId]);

  if (loading) return (
    <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
       <div className="text-rose-500 font-black italic text-4xl animate-pulse tracking-tighter">CHARGEMENT DU MARCHÉ...</div>
    </div>
  );

  if (!session) return (
    <div className="h-screen w-screen bg-black flex items-center justify-center p-8 overflow-hidden">
       <div className="text-center space-y-4">
          <BarChart3 size={80} className="mx-auto text-neutral-800" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Bourse Fermée</h1>
          <p className="text-neutral-500 font-bold max-w-xs mx-auto">Le marché n&apos;est pas encore ouvert pour ce bar. Revenez bientôt !</p>
       </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
      
      {/* Header - Fixed Height */}
      <div className="shrink-0 px-6 py-4 md:px-8 border-b border-neutral-900 bg-black/50 backdrop-blur-md z-10 flex justify-between items-end">
          <div className="space-y-4">
             {/* Title & Concept */}
             <div className="flex flex-col gap-2">
                 <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter leading-none text-white uppercase">
                     LA BOURSE <span className="text-rose-500">DES BOISSONS EN DIRECT</span>
                 </h1>

                 <p className="text-neutral-400 text-xs md:text-sm font-medium leading-relaxed">
                    Chaque commande change le prix en temps réel. Les boissons populaires <span className="text-green-500 font-bold">augmentent</span>, celles moins demandées <span className="text-rose-500 font-bold">diminuent</span>. Soyez attentifs !
                 </p>
             </div>
          </div>

          {config && (
            <div className="mb-1">
              <MarketCountdown 
                durationSeconds={config.cycleDurationSeconds}
                lastUpdateAt={session.lastPriceUpdateAt}
                onFinish={() => {}} // No-op, handled by onCycleEnd
                onCycleEnd={handleCycleEnd}
              />
            </div>
          )}
      </div>

      {/* Market Grid - Flexible Height */}
      <div className="flex-1 overflow-hidden relative">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
          
          <MarketGrid drinks={sortedDrinks} variations={variations} />
      </div>

      {/* News Ticker - Fixed Height (Placeholder height is handled by component fixed positioning) */}
      <div className="h-16 shrink-0">
         <NewsTicker 
            events={activeEvents} 
            topDrinks={sortedDrinks} 
            variations={variations}
         />
      </div>
    </div>
  );
}
