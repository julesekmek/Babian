"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { SupabaseMarketRepository } from '@/infrastructure/supabase/SupabaseMarketRepository';
import { OrderService } from '@/application/OrderService';
import { MarketService } from '@/application/MarketService';
import { Drink, MarketSession, MarketConfig } from '@/domain/types';
import { Plus, RefreshCw, XCircle, ExternalLink, Wine, Zap, Clock, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/infrastructure/supabase/client';
import { MarketCountdown } from '@/features/market/components/MarketCountdown';
import { EventTemplateCard } from '@/features/market/components/EventTemplateCard';
import { MarketEvent } from '@/domain/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function MarketCommandsPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [session, setSession] = useState<MarketSession | null>(null);
  const [config, setConfig] = useState<MarketConfig | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [globalCounts, setGlobalCounts] = useState<Record<string, number>>({});
  const [templateEvents, setTemplateEvents] = useState<MarketEvent[]>([]);
  const [activeEvents, setActiveEvents] = useState<MarketEvent[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activatingEventId, setActivatingEventId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDashboardConfirm, setShowDashboardConfirm] = useState(false);
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
    
    const [list, currentCounts, globalStats, templates, activeEvts] = await Promise.all([
      drinkRepo.getDrinksByOwner(userId),
      orderService.getOrderCountsForCycle(active.id, active.currentCycleNumber),
      orderService.getSessionOrderCounts(active.id),
      marketRepo.getTemplateEvents(userId),
      marketRepo.getActiveEvents(userId)
    ]);
    setDrinks(list);
    setCounts(currentCounts);
    setGlobalCounts(globalStats);
    setTemplateEvents(templates);
    setActiveEvents(activeEvts);
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
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!user?.id) return;
    
    fetchMarketData(user.id);
    const interval = setInterval(() => fetchMarketData(user.id), 5000);
    return () => clearInterval(interval);
  }, [user?.id, fetchMarketData]);

  const handleOrder = async (drinkId: string) => {
    if (!session) return;
    try {
      console.log(`Placing order for drink ${drinkId} in session ${session.id}, cycle ${session.currentCycleNumber}`);
      await orderService.placeOrder(drinkId, session.id, session.currentCycleNumber);
      // Optimistic updates
      setCounts(prev => ({ ...prev, [drinkId]: (prev[drinkId] || 0) + 1 }));
      setGlobalCounts(prev => ({ ...prev, [drinkId]: (prev[drinkId] || 0) + 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCycleTick = async () => {
    if (!session || !user || isProcessing) return;
    setIsProcessing(true);
    try {
      // Call server-side API for secure price updates
      const res = await fetch('/api/market/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barmanId: user.id })
      });
      
      if (!res.ok) {
        throw new Error('Cycle update failed');
      }

      await fetchMarketData(user.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateEvent = async (eventId: string, durationMinutes: number) => {
    if (!user || activatingEventId) return;
    setActivatingEventId(eventId);
    try {
      await marketRepo.activateEvent(eventId, durationMinutes);
      await fetchMarketData(user.id); // Refresh to remove from templates
    } catch (err) {
      console.error('Error activating event:', err);
      alert('Erreur lors de l\'activation de l\'événement');
    } finally {
      setActivatingEventId(null);
    }
  };

  const closeSession = async () => {
    if (!user || !session) return;
    if (confirm("Voulez-vous vraiment clore la bourse ? Tous les compteurs seront arrêtés.")) {
      await marketRepo.closeSession(session.id);
      router.push('/dashboard');
    }
  };

  const handleReturnToDashboard = () => {
    if (showDashboardConfirm) {
      router.push('/dashboard');
    } else {
      setShowDashboardConfirm(true);
      setTimeout(() => setShowDashboardConfirm(false), 3000);
    }
  };

  if (!user || !session) return null;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 pb-24">
        
        {/* Navigation Header */}
        <div className="flex justify-start">
          <button
            onClick={handleReturnToDashboard}
            className={`flex items-center gap-2 transition-all px-4 py-2 rounded-xl font-bold text-sm uppercase ${
              showDashboardConfirm 
                ? 'bg-primary-500 text-white shadow-lg hover:bg-primary-600' 
                : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {showDashboardConfirm ? (
              <>Vraiment quitter ?</>
            ) : (
              <>
                <ChevronDown className="rotate-90" size={20} />
                <span>Retour au Dashboard</span>
              </>
            )}
          </button>
        </div>

        {/* Session Info Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-[2rem] bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-6">
             <div className="text-center">
                <p className="text-[10px] font-black text-neutral-500 uppercase">Cycle Actuel</p>
                <p className="text-4xl font-black tabular-nums text-primary-500 italic">#{session.currentCycleNumber}</p>
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
               className="p-3 text-neutral-500 hover:text-primary-500 transition-colors"
               title="Clore la session"
             >
               <XCircle size={28} />
             </button>
          </div>
        </div>

        {/* Active Events Display */}
        {activeEvents.length > 0 && (
          <div className="bg-gradient-to-r from-primary-900/50 to-neutral-900 border border-primary-500/20 rounded-3xl p-6 relative overflow-hidden">
             <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-primary-500 text-white rounded-xl animate-pulse">
                    <Zap size={24} />
                </div>
                <div>
                   <h2 className="font-black text-xl italic uppercase text-white">Événements en cours</h2>
                   <div className="flex gap-4 mt-2">
                      {activeEvents.map(evt => (
                          <div key={evt.id} className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary-500/30 flex items-center gap-2">
                              <span className="font-bold text-primary-200">{evt.name}</span>
                              <span className="text-xs text-primary-500 font-black px-2 py-0.5 bg-primary-950 rounded uppercase">{evt.type}</span>
                          </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Template Events Section */}
        {templateEvents.length > 0 && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full p-6 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-xl">
                  <Zap className="text-primary-500" size={20} />
                </div>
                <div className="text-left">
                  <h2 className="font-black text-lg uppercase tracking-tight">Événements Pré-Créés</h2>
                  <p className="text-xs text-neutral-500 font-bold">{templateEvents.length} événement{templateEvents.length > 1 ? 's' : ''} prêt{templateEvents.length > 1 ? 's' : ''} à activer</p>
                </div>
              </div>
              {showTemplates ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {showTemplates && (
              <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templateEvents.map(event => (
                  <EventTemplateCard
                    key={event.id}
                    event={event}
                    onActivate={handleActivateEvent}
                    isActivating={activatingEventId === event.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
                className="w-full aspect-square p-6 rounded-[2.5rem] bg-neutral-900 border-2 border-neutral-800 hover:border-primary-500/50 flex flex-col items-center justify-center text-center gap-2 transition-all group shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                     <Trophy size={12} className="text-yellow-500" />
                     <span className="text-[10px] font-black text-neutral-400">{globalCounts[drink.id] || 0}</span>
                </div>

                <span className="text-lg font-black leading-tight group-hover:text-primary-500 transition-colors mt-2">{drink.name}</span>
                <span className="text-[10px] font-black text-neutral-500 tabular-nums">{drink.currentPrice.toFixed(2)}€</span>
                
                <div className="mt-4 w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                   <Plus size={24} />
                </div>
              </motion.button>
              
              <AnimatePresence>
                {counts[drink.id] > 0 && (
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    key={`badge-${drink.id}-${counts[drink.id]}`}
                    className="absolute -top-3 -right-3 min-w-10 h-10 px-2 rounded-full bg-primary-500 border-4 border-black flex items-center justify-center text-sm font-black text-white shadow-xl pointer-events-none z-10"
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
