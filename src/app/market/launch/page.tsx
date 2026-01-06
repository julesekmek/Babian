"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { SupabaseMarketRepository } from '@/infrastructure/supabase/SupabaseMarketRepository';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { Rocket, ChevronLeft, AlertTriangle, CheckCircle2, Wine } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/client';
import { motion } from 'framer-motion';

export default function MarketLaunchPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [drinkCount, setDrinkCount] = useState(0);
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
      router.push('/market/commands');
      return;
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
            className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto"
          >
            <Rocket size={48} />
          </motion.div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">Prêt pour le <span className="text-rose-500">Décollage ?</span></h1>
          <p className="text-neutral-500 font-medium">Vous allez activer le marché boursier pour vos clients.</p>
        </div>

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
              <div className="flex items-center gap-3 text-sm font-bold text-rose-500">
                 <AlertTriangle size={20} />
                 <span>Paramètres de marché verrouillés pour la session</span>
              </div>
           </div>

           <button 
             onClick={handleLaunch}
             disabled={launching || drinkCount === 0}
             className="w-full py-6 bg-rose-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-rose-600 transition-all shadow-xl disabled:opacity-50"
           >
             {launching ? "LANCEMENT..." : "OUVRIR LA BOURSE"}
             <Rocket size={24} />
           </button>
           
           {drinkCount === 0 && (
             <div className="p-8 text-center space-y-4 rounded-3xl border-2 border-dashed border-neutral-800 mt-4">
               <Wine size={48} className="mx-auto text-neutral-800" />
               <p className="text-neutral-500 font-bold uppercase text-xs">Ajoutez des boissons avant de lancer !</p>
             </div>
           )}
        </div>
      </div>
    </MainLayout>
  );
}
