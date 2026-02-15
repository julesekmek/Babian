"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { SupabaseMarketRepository } from '@/infrastructure/supabase/SupabaseMarketRepository';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { Rocket, ChevronLeft, AlertTriangle, CheckCircle2, Wine, Play, RotateCcw } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/client';
import { motion } from 'framer-motion';
import { MarketSession } from '@/domain/types';

export default function MarketLaunchPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [drinkCount, setDrinkCount] = useState(0);
  const [activeSession, setActiveSession] = useState<MarketSession | null>(null);
  const router = useRouter();

  const marketRepo = useMemo(() => new SupabaseMarketRepository(), []);
  const drinkRepo = useMemo(() => new SupabaseDrinkRepository(), []);

  const init = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    setUser({ id: user.id });
    
    // Check if session already active
    const active = await marketRepo.getActiveSession(user.id);
    if (active) {
      setActiveSession(active);
    }

    const drinks = await drinkRepo.getDrinksByOwner(user.id);
    setDrinkCount(drinks.length);
    setLoading(false);
  }, [marketRepo, drinkRepo, router]);

  useEffect(() => {
    init();
  }, [init]);

  const handleLaunch = async () => {
    if (!user) return;
    setLaunching(true);
    try {
      // 1. Reset all prices to base for this barman
      const drinks = await drinkRepo.getDrinksByOwner(user.id);
      await Promise.all(drinks.map(d => 
        drinkRepo.updatePrice(d.id, d.basePrice)
      ));

      // 2. Create the session
      await marketRepo.createSession(user.id);
      
      router.push('/market/commands');
    } catch (err) {
      console.error(err);
      setLaunching(false);
    }
  };

  const handleResume = () => {
    router.push('/market/commands');
  };

  const handleReset = async () => {
    if (!user || !activeSession) return;
    if (!confirm("Attention: Cela va clore la session actuelle et réinitialiser tous les prix. Êtes-vous sûr ?")) return;
    
    setLaunching(true);
    try {
      // 1. Close active session
      await marketRepo.closeSession(activeSession.id);
      
      // 2. Launch new one via existing logic
      await handleLaunch();
    } catch (err) {
      console.error("Error during reset:", err);
      setLaunching(false);
    }
  };

  if (loading) return null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-12 space-y-12">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-bold text-xs uppercase"
        >
          <ChevronLeft size={16} />
          Retour au Bureau
        </button>

        <div className="text-center space-y-6">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 bg-primary-500/10 text-primary-500 rounded-3xl flex items-center justify-center mx-auto"
          >
            <Rocket size={48} />
          </motion.div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">
             {activeSession ? "Session En Cours" : "Prêt pour le "}
             {!activeSession && <span className="text-primary-500">Décollage ?</span>}
          </h1>
          <p className="text-neutral-500 font-medium">
             {activeSession 
               ? "Une session de bourse est déjà active. Que voulez-vous faire ?"
               : "Vous allez activer le marché boursier pour vos clients."
             }
          </p>
        </div>

        {activeSession ? (
            // ACTIVE SESSION CHOICES
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handleResume}
                  className="p-8 bg-neutral-900 border border-neutral-800 rounded-[2rem] hover:bg-neutral-800 transition-all text-left space-y-4 group"
                >
                    <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play size={24} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Reprendre</h3>
                        <p className="text-neutral-500 text-sm font-medium mt-1">
                            Continuer le cycle #{activeSession.currentCycleNumber} sans toucher aux prix actuels.
                        </p>
                    </div>
                </button>

                <button 
                  onClick={handleReset}
                  className="p-8 bg-neutral-900 border border-neutral-800 rounded-[2rem] hover:bg-primary-900/20 hover:border-primary-500/50 transition-all text-left space-y-4 group"
                >
                    <div className="w-12 h-12 bg-primary-500/10 text-primary-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RotateCcw size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Nouvelle Bourse</h3>
                        <p className="text-neutral-500 text-sm font-medium mt-1">
                            Clore la session, réinitialiser les prix à zéro et repartir du cycle #1.
                        </p>
                    </div>
                </button>
            </div>
        ) : (
            // STANDARD LAUNCH CARD
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-10 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold">
                     <CheckCircle2 size={20} className="text-green-500" />
                     <span>{drinkCount} boissons prêtes à être cotées</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm font-bold">
                     <CheckCircle2 size={20} className="text-green-500" />
                     <span>Prix réinitialisés à leur valeur de départ</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-primary-500">
                     <AlertTriangle size={20} />
                     <span>Paramètres de marché verrouillés pour la session</span>
                  </div>
               </div>

               <button 
                 onClick={handleLaunch}
                 disabled={launching || drinkCount === 0}
                 className="w-full py-6 bg-primary-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-primary-600 transition-all shadow-xl disabled:opacity-50"
               >
                 {launching ? "LANCEMENT..." : "OUVRIR LA BOURSE"}
                 <Rocket size={24} />
               </button>
               
               {drinkCount === 0 && (
                 <div className="p-8 text-center space-y-4 rounded-3xl border-2 border-dashed border-neutral-900 mt-4">
                   <Wine size={48} className="mx-auto text-neutral-800" />
                   <p className="text-neutral-500 font-bold uppercase text-xs">Ajoutez des boissons avant de lancer !</p>
                 </div>
               )}
            </div>
        )}
      </div>
    </MainLayout>
  );
}
