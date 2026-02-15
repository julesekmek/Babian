"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { SupabaseMarketRepository } from '@/infrastructure/supabase/SupabaseMarketRepository';
import { MarketConfig } from '@/domain/types';
import { Settings, ChevronLeft, Save } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/client';

export default function AdminConfigPage() {
  const [config, setConfig] = useState<MarketConfig | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    increasePerOrder: '0.10',
    decreaseOthers: '0.05',
    cycleDurationSeconds: '60'
  });

  const router = useRouter();
  const marketRepo = useMemo(() => new SupabaseMarketRepository(), []);

  const init = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    setUser({ id: user.id });
    
    try {
      const currentConfig = await marketRepo.getConfig(user.id);
      if (currentConfig) {
        setConfig(currentConfig);
        setFormData({
          increasePerOrder: currentConfig.increasePerOrder.toString(),
          decreaseOthers: currentConfig.decreaseOthers.toString(),
          cycleDurationSeconds: currentConfig.cycleDurationSeconds.toString()
        });
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  }, [marketRepo, router]);

  useEffect(() => {
    init();
  }, [init]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedConfig: MarketConfig = {
        barmanId: user.id,
        increasePerOrder: parseFloat(formData.increasePerOrder),
        decreaseOthers: parseFloat(formData.decreaseOthers),
        cycleDurationSeconds: parseInt(formData.cycleDurationSeconds)
      };

      await marketRepo.updateConfig(updatedConfig);
      setConfig(updatedConfig);
      setSuccessMessage("Configuration sauvegardée avec succès !");
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Error saving config:", errorMessage, err);
      setError(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-bold text-xs uppercase"
        >
          <ChevronLeft size={16} />
          Retour au Bureau
        </button>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-neutral-900 rounded-2xl text-primary-500">
            <Settings size={32} />
          </div>
          <h1 className="text-4xl font-black italic tracking-tight uppercase">
            RÈGLES DU <span className="text-primary-500">MARCHÉ</span>
          </h1>
        </div>

        {error && (
          <div className="p-6 rounded-2xl bg-primary-500/10 border border-primary-500/30 text-primary-500">
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500">
            <p className="font-bold text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 space-y-8">
            
            {/* Increase Per Order */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">
                  Augmentation par commande (€)
                </span>
                <p className="text-xs text-neutral-600 px-1 mt-1 mb-3">
                  Montant ajouté au prix d&apos;une boisson à chaque fois qu&apos;elle est commandée.
                </p>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.increasePerOrder}
                  onChange={e => setFormData(prev => ({ ...prev, increasePerOrder: e.target.value }))}
                  className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-lg focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </label>
            </div>

            {/* Decrease Others */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">
                  Baisse des autres boissons (€)
                </span>
                <p className="text-xs text-neutral-600 px-1 mt-1 mb-3">
                  Montant retiré du prix des boissons NON commandées à chaque cycle.
                </p>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.decreaseOthers}
                  onChange={e => setFormData(prev => ({ ...prev, decreaseOthers: e.target.value }))}
                  className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-lg focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </label>
            </div>

            {/* Cycle Duration */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">
                  Durée d&apos;un cycle (secondes)
                </span>
                <p className="text-xs text-neutral-600 px-1 mt-1 mb-3">
                  Intervalle de temps entre chaque recalcul automatique des prix.
                </p>
                <select
                  value={formData.cycleDurationSeconds}
                  onChange={e => setFormData(prev => ({ ...prev, cycleDurationSeconds: e.target.value }))}
                  className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-lg focus:ring-2 focus:ring-primary-500 transition-all"
                >
                  <option value="10">10 secondes (test rapide)</option>
                  <option value="30">30 secondes</option>
                  <option value="60">1 minute</option>
                  <option value="120">2 minutes</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                </select>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-5 bg-primary-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary-600 transition-all shadow-xl disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ENREGISTREMENT...
              </>
            ) : (
              <>
                <Save size={20} />
                SAUVEGARDER LES RÈGLES
              </>
            )}
          </button>
        </form>

        {config && (
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
            <p className="text-[10px] font-black text-neutral-500 uppercase mb-3">Configuration actuelle</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-primary-500">{config.increasePerOrder.toFixed(2)}€</p>
                <p className="text-[10px] text-neutral-600 uppercase font-bold mt-1">Hausse/commande</p>
              </div>
              <div>
                <p className="text-2xl font-black text-blue-500">{config.decreaseOthers.toFixed(2)}€</p>
                <p className="text-[10px] text-neutral-600 uppercase font-bold mt-1">Baisse autres</p>
              </div>
              <div>
                <p className="text-2xl font-black text-yellow-500">{config.cycleDurationSeconds}s</p>
                <p className="text-[10px] text-neutral-600 uppercase font-bold mt-1">Durée cycle</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
