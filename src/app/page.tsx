"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/infrastructure/supabase/client';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LandingLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      } else {
        setInitialLoading(false);
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = isLogin 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  if (initialLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
    </div>;
  }

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 px-4">
        {/* Identity Section */}
        <div className="text-center lg:text-left space-y-6 max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter italic">
              VOTRE BAR.<br />
              <span className="text-primary-500">VOTRE BOURSE.</span>
            </h1>
            <p className="text-neutral-500 text-lg md:text-xl font-medium max-w-md">
              L&apos;outil de gamification ultime pour transformer vos boissons en actifs cotés.
            </p>
          </motion.div>

          <div className="hidden lg:grid grid-cols-2 gap-4 pt-8">
            <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
               <div className="text-primary-500 font-bold mb-1">DYNAMIQUE</div>
               <p className="text-xs text-neutral-500">Les prix s&apos;ajustent en temps réel selon la demande.</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
               <div className="text-primary-500 font-bold mb-1">INTERACTIF</div>
               <p className="text-xs text-neutral-500">Créez l&apos;événement et boostez vos ventes.</p>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 shadow-2xl space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                {isLogin ? 'Accès Barman' : 'Inscription'}
              </h2>
              <p className="text-xs font-bold text-neutral-500 italic">Identifiez-vous pour gérer votre salle</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Email professionnel</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-neutral-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-neutral-700"
                placeholder="nom@bar.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Mot de passe</label>
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-neutral-800 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-neutral-700"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : isLogin ? (
                <>
                  <span>SE CONNECTER</span>
                  <LogIn size={20} />
                </>
              ) : (
                <>
                  <span>CRÉER LE BAR</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black text-neutral-600 hover:text-primary-500 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              {isLogin ? (
                <>Pas encore de compte ? <span className="underline decoration-neutral-800 underline-offset-4 decoration-2">S&apos;inscrire</span></>
              ) : (
                <>Déjà inscrit ? <span className="underline decoration-neutral-800 underline-offset-4 decoration-2">Connexion</span></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
