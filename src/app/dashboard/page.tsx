"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/infrastructure/supabase/client';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Play, 
  Wine, 
  Calendar, 
  LogOut, 
  ArrowUpRight, 
  BarChart3,
  Dna
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return null;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-12 py-8">
        {/* Header Hub */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-neutral-900 pb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black italic tracking-tighter">BUREAU DU <span className="text-rose-500">BARMAN</span></h1>
            <p className="text-neutral-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
              <Dna size={14} className="text-rose-500" />
              Session: Hors Ligne • {user?.email}
            </p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all font-black text-xs"
          >
            <LogOut size={16} />
            DÉCONNEXION
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Execution Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-10 rounded-[3rem] bg-rose-500 text-white space-y-8 flex flex-col justify-between overflow-hidden relative group"
          >
            <div className="absolute -right-12 -top-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Play size={240} strokeWidth={3} />
            </div>
            
            <div className="space-y-4 relative">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                 <Play fill="white" size={32} />
              </div>
              <h2 className="text-4xl font-black italic leading-tight">LANCER UNE<br />SESSION LIVE</h2>
              <p className="text-rose-100 font-medium max-w-xs">
                Activez la bourse, reset des prix et verrouillage des paramètres pour vos clients.
              </p>
            </div>

            <button 
              onClick={() => router.push('/market/launch')}
              className="w-full py-5 bg-white text-rose-500 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl hover:bg-neutral-100 transition-colors relative"
            >
              C&apos;EST PARTI !
              <ArrowUpRight size={24} />
            </button>
          </motion.div>

          {/* Configuration Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/admin/drinks')}
              className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 flex flex-col items-start gap-4 hover:border-neutral-700 transition-all group"
            >
              <div className="p-4 bg-neutral-800 rounded-2xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                 <Wine size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-xl italic uppercase font-black">Boissons</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase mt-1">Catalogue & Prix</p>
              </div>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/admin/events')}
              className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 flex flex-col items-start gap-4 hover:border-neutral-700 transition-all group"
            >
              <div className="p-4 bg-neutral-800 rounded-2xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                 <Calendar size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-xl italic uppercase font-black">Événements</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase mt-1">Crash & Happy Hours</p>
              </div>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/admin/config')}
              className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 flex flex-col items-start gap-4 hover:border-neutral-700 transition-all group"
            >
              <div className="p-4 bg-neutral-800 rounded-2xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                 <Settings size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-xl italic uppercase font-black">Paramètres</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase mt-1">Règles du marché</p>
              </div>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/admin/stats')}
              className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 flex flex-col items-start gap-4 hover:border-neutral-700 transition-all group opacity-50"
            >
              <div className="p-4 bg-neutral-800 rounded-2xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                 <BarChart3 size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-xl italic uppercase font-black">Rapports</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase mt-1 italic italic">Bientôt disponible</p>
              </div>
            </motion.button>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
