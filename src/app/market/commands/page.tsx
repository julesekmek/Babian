"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { SupabaseMarketRepository } from '@/infrastructure/supabase/SupabaseMarketRepository';
import { OrderService } from '@/application/OrderService';
import { MarketService } from '@/application/MarketService';
import { Drink, MarketSession, MarketConfig } from '@/domain/types';
import { Plus, RefreshCw, XCircle, ExternalLink, Wine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/infrastructure/supabase/client';
import { MarketCountdown } from '@/features/market/components/MarketCountdown';

export default function MarketCommandsPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [session, setSession] = useState<MarketSession | null>(null);
  const [config, setConfig] = useState<MarketConfig | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const drinkRepo = useMemo(() => new SupabaseDrinkRepository(), []);
  const marketRepo = useMemo(() => new SupabaseMarketRepository(), []);
  const orderService = useMemo(() => new OrderService(), []);
  const marketService = useMemo(() => new MarketService(drinkRepo, marketRepo, orderService), [drinkRepo, marketRepo, orderService]);

  const fetchMarketData = useCallback(async (userId: string) => {
    const [active, activeConfig] = await Promise.all([
        marketRepo.getActiveSession(userId),
        marketRepo.getConfig(userId)
    ]);

    if (!active) {
      router.push('/dashboard');
      return;
    }
    setSession(active);
    setConfig(activeConfig);
    
    const [list, currentCounts] = await Promise.all([
      drinkRepo.getDrinksByOwner(userId),
      orderService.getOrderCountsForCycle(active.id, active.currentCycleNumber)
    ]);
    setDrinks(list);
    setCounts(currentCounts);
  }, [marketRepo, drinkRepo, orderService, router]);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser({ id: user.id });
      fetchMarketData(user.id);
    };
    checkAuth();
  }, [fetchMarketData, router]);

  const handleOrder = async (drinkId: string) => {
    if (!session) return;
    try {
      await orderService.placeOrder(drinkId, session.id, session.currentCycleNumber);
      setCounts(prev => ({ ...prev, [drinkId]: (prev[drinkId] || 0) + 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCycleTick = useCallback(async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      await marketService.processCycleEnd(user.id);
      await fetchMarketData(user.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, marketService, fetchMarketData]);

  const closeSession = async () => {
    if (!user || !session) return;
    if (confirm("Voulez-vous vraiment clore la bourse ? Tous les compteurs seront arrêtés.")) {
      await marketRepo.closeSession(session.id);
      router.push('/dashboard');
    }
  };

  if (!user || !session) return null;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4">
        
        {/* Session Info Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-[2rem] bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-6">
             <div className="text-center">
                <p className="text-[10px] font-black text-neutral-500 uppercase">Cycle Actuel</p>
                <p className="text-4xl font-black tabular-nums text-rose-500 italic">#{session.currentCycleNumber}</p>
             </div>
             <div className="h-10 w-px bg-neutral-800" />
             <div className="space-y-2">
                <button 
                  onClick={() => window.open(`/public/${user.id}`, '_blank')}
                  className="flex items-center gap-2 text-xs font-black text-white px-4 py-2 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"
                >
                  <ExternalLink size={14} />
                  VOIR L&apos;AFFICHAGE PUBLIC
                </button>
                {config && (
                    <div className="w-48">
                        <MarketCountdown 
                            durationSeconds={config.cycleDurationSeconds}
                            lastUpdateAt={session.lastPriceUpdateAt}
                            onFinish={handleCycleTick}
                        />
                    </div>
                )}
             </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={handleCycleTick}
               disabled={isProcessing}
               className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-black hover:bg-neutral-200 transition-all disabled:opacity-50 shadow-lg"
             >
               <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
               FORCER FIN DE CYCLE
             </button>
             <button 
               onClick={closeSession}
               className="p-3 text-neutral-500 hover:text-rose-500 transition-colors"
               title="Clore la session"
             >
               <XCircle size={28} />
             </button>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {drinks.map(drink => (
            <motion.div
              layout
              key={drink.id}
              className="relative"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOrder(drink.id)}
                className="w-full aspect-square p-6 rounded-[2.5rem] bg-neutral-900 border-2 border-neutral-800 hover:border-rose-500/50 flex flex-col items-center justify-center text-center gap-2 transition-all group shadow-xl"
              >
                <span className="text-lg font-black leading-tight group-hover:text-rose-500 transition-colors">{drink.name}</span>
                <span className="text-[10px] font-black text-neutral-500 tabular-nums">{drink.currentPrice.toFixed(2)}€</span>
                
                <div className="mt-4 w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                   <Plus size={24} />
                </div>
              </motion.button>
              
              <AnimatePresence>
                {counts[drink.id] > 0 && (
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    key={`badge-${drink.id}-${counts[drink.id]}`}
                    className="absolute -top-3 -right-3 min-w-10 h-10 px-2 rounded-full bg-rose-500 border-4 border-black flex items-center justify-center text-sm font-black text-white shadow-xl pointer-events-none"
                  >
                    {counts[drink.id]}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        { drinks.length === 0 && (
          <div className="p-20 text-center space-y-4 rounded-[3rem] border-2 border-dashed border-neutral-900">
             <Wine size={48} className="mx-auto text-neutral-800" />
             <p className="text-neutral-500 font-bold">Aucune boisson configurée.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
