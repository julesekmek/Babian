"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { SupabaseMarketRepository } from '@/infrastructure/supabase/SupabaseMarketRepository';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { MarketEvent, Drink } from '@/domain/types';
import { Calendar, Plus, Trash2, ChevronLeft, Zap, Sparkles, TrendingDown, X, Check } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/client';
import { motion } from 'framer-motion';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [newEvent, setNewEvent] = useState({
    name: '',
    type: 'discount' as MarketEvent['type'],
    value: '30',
    durationMinutes: '15',
    timing: 'immediate' as 'immediate' | 'scheduled',
    scheduledTime: '',
    selectedDrinkIds: [] as string[]
  });

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
    
    try {
      const [eventList, drinkList] = await Promise.all([
        marketRepo.getEvents(user.id),
        drinkRepo.getDrinksByOwner(user.id)
      ]);
      setEvents(eventList);
      setDrinks(drinkList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [drinkRepo, marketRepo, router]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    init();
  }, [init]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);
    
    try {
      const startAt = newEvent.timing === 'immediate' 
        ? new Date() 
        : new Date(newEvent.scheduledTime);
      
      const endAt = new Date(startAt.getTime() + parseInt(newEvent.durationMinutes) * 60000);

      const created = await marketRepo.createEvent({
        barmanId: user.id,
        name: newEvent.name,
        type: newEvent.type,
        value: parseFloat(newEvent.value),
        startAt,
        endAt,
        drinkIds: newEvent.selectedDrinkIds
      });

      setEvents(prev => [created, ...prev]);
      setShowModal(false);
      // Reset form
      setNewEvent({
        name: '',
        type: 'discount',
        value: '30',
        durationMinutes: '15',
        timing: 'immediate',
        scheduledTime: '',
        selectedDrinkIds: []
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'événement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;
    try {
      await marketRepo.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDrink = (id: string) => {
    setNewEvent(prev => ({
      ...prev,
      selectedDrinkIds: prev.selectedDrinkIds.includes(id)
        ? prev.selectedDrinkIds.filter(did => did !== id)
        : [...prev.selectedDrinkIds, id]
    }));
  };

  const getEventStatus = (event: MarketEvent) => {
    const now = new Date();
    if (now >= event.startAt && now <= event.endAt) return 'active';
    if (now < event.startAt) return 'scheduled';
    return 'finished';
  };

  if (loading) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-bold text-xs uppercase"
        >
          <ChevronLeft size={16} />
          Retour au Bureau
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-900 rounded-2xl text-rose-500">
              <Calendar size={32} />
            </div>
            <h1 className="text-4xl font-black italic tracking-tight uppercase">ÉVÉNEMENTS <span className="text-rose-500">SPÉCIAUX</span></h1>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-black text-xs hover:bg-neutral-200 transition-colors shadow-2xl"
          >
            <Plus size={18} />
            NOUVEL ÉVÉNEMENT
          </button>
        </div>

        {/* Categories helper */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[2rem] bg-neutral-900/50 border border-neutral-800 flex flex-col gap-3">
                <Zap className="text-yellow-500" />
                <h3 className="font-bold uppercase italic text-sm">Flash Discount</h3>
                <p className="text-[10px] text-neutral-500 font-medium">Baisse immédiate sur une sélection.</p>
            </div>
            <div className="p-6 rounded-[2rem] bg-neutral-900/50 border border-neutral-800 flex flex-col gap-3">
                <TrendingDown className="text-rose-500" />
                <h3 className="font-bold uppercase italic text-sm">Krach Boursier</h3>
                <p className="text-[10px] text-neutral-500 font-medium">Tous les prix chutent simultanément.</p>
            </div>
            <div className="p-6 rounded-[2rem] bg-neutral-900/50 border border-neutral-800 flex flex-col gap-3">
                <Sparkles className="text-blue-500" />
                <h3 className="font-bold uppercase italic text-sm">Prix Fixe</h3>
                <p className="text-[10px] text-neutral-500 font-medium">Bloque le prix d&apos;un cocktail.</p>
            </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-neutral-500 uppercase px-1 tracking-widest">Chronologie des événements</h2>
          
          {events.length === 0 ? (
            <div className="p-20 rounded-[2.5rem] bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
                   <Calendar size={32} className="text-neutral-500" />
                </div>
                <div className="space-y-2">
                   <h3 className="font-black italic uppercase text-xl text-neutral-400">Aucun événement</h3>
                   <p className="text-sm text-neutral-500 max-w-xs mx-auto">Boostez l&apos;ambiance de votre bar en créant un Krach ou des Flash Discounts.</p>
                </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {events.map(event => {
                const status = getEventStatus(event);
                const Icon = event.type === 'crash' ? TrendingDown : event.type === 'discount' ? Zap : Sparkles;
                const iconColor = event.type === 'crash' ? 'text-rose-500' : event.type === 'discount' ? 'text-yellow-500' : 'text-blue-500';

                return (
                  <div key={event.id} className={`p-5 rounded-2xl bg-neutral-900 border flex items-center justify-between group transition-all ${status === 'active' ? 'border-rose-500/30 ring-1 ring-rose-500/20' : 'border-neutral-800'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center ${iconColor}`}>
                         <Icon size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                           <span className="font-black text-sm uppercase italic">{event.name}</span>
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                             status === 'active' ? 'bg-rose-500 text-white animate-pulse' : 
                             status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' : 
                             'bg-neutral-800 text-neutral-500'
                           }`}>
                             {status === 'active' ? 'EN COURS' : status === 'scheduled' ? 'PLANIFIÉ' : 'TERMINÉ'}
                           </span>
                        </div>
                        <div className="text-[10px] font-black text-neutral-500 uppercase flex gap-3 mt-1">
                          <span>{event.type.replace('_', ' ')}: {event.type === 'fixed_price' ? `${event.value}€` : `-${event.value}%`}</span>
                          <span>•</span>
                          <span>{event.drinkIds.length === 0 ? 'Global' : `${event.drinkIds.length} cocktails`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-neutral-500 uppercase">Durée</p>
                          <p className="text-xs font-bold">{Math.round((event.endAt.getTime() - event.startAt.getTime()) / 60000)} MIN</p>
                       </div>
                       <button 
                         onClick={() => handleDeleteEvent(event.id)}
                         className="p-3 text-neutral-700 hover:text-rose-500 transition-colors"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
               <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tight">Nouvel <span className="text-rose-500">Événement</span></h2>
                  <p className="text-[10px] font-black text-neutral-500 uppercase">Paramétrez votre temps fort boursier</p>
               </div>
               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500">
                  <X size={24} />
               </button>
            </div>

            <form onSubmit={handleCreateEvent} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               <div className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Nom de l&apos;événement</label>
                    <input 
                      type="text" 
                      required
                      placeholder="ex: Krach de Minuit, Flash Mojito..."
                      value={newEvent.name}
                      onChange={e => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold focus:ring-2 focus:ring-rose-500 transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Type */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Type d&apos;impact</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['discount', 'crash', 'fixed_price'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewEvent(prev => ({ ...prev, type, value: type === 'fixed_price' ? '2.00' : '30' }))}
                            className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2 ${
                              newEvent.type === type 
                              ? 'bg-rose-500 border-rose-500 text-white shadow-lg' 
                              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                            }`}
                          >
                            {type === 'discount' && <Zap size={16} />}
                            {type === 'crash' && <TrendingDown size={16} />}
                            {type === 'fixed_price' && <Sparkles size={16} />}
                            <span className="truncate w-full text-center">{type.replace('_', ' ')}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Value */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase px-1">
                        {newEvent.type === 'fixed_price' ? 'Prix (€)' : 'Baisse (%)'}
                      </label>
                      <input 
                        type="number" 
                        step={newEvent.type === 'fixed_price' ? '0.1' : '1'}
                        value={newEvent.value}
                        onChange={e => setNewEvent(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full bg-neutral-800 border-none rounded-xl p-4 font-black text-xl text-center focus:ring-2 focus:ring-rose-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Timing */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Lancement</label>
                        <div className="flex bg-neutral-800 p-1 rounded-xl">
                           <button
                             type="button"
                             onClick={() => setNewEvent(prev => ({ ...prev, timing: 'immediate' }))}
                             className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${newEvent.timing === 'immediate' ? 'bg-neutral-700 text-white shadow-md' : 'text-neutral-500'}`}
                           >Immédiat</button>
                           <button
                             type="button"
                             onClick={() => setNewEvent(prev => ({ ...prev, timing: 'scheduled' }))}
                             className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${newEvent.timing === 'scheduled' ? 'bg-neutral-700 text-white shadow-md' : 'text-neutral-500'}`}
                           >Planifié</button>
                        </div>
                        {newEvent.timing === 'scheduled' && (
                           <input 
                             type="datetime-local"
                             required
                             value={newEvent.scheduledTime}
                             onChange={e => setNewEvent(prev => ({ ...prev, scheduledTime: e.target.value }))}
                             className="w-full bg-neutral-800 border-none rounded-xl p-3 font-bold mt-2 text-xs"
                           />
                        )}
                     </div>

                     {/* Duration */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Durée (minutes)</label>
                        <select 
                          value={newEvent.durationMinutes}
                          onChange={e => setNewEvent(prev => ({ ...prev, durationMinutes: e.target.value }))}
                          className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-sm focus:ring-2 focus:ring-rose-500 transition-all"
                        >
                          <option value="5">5 minutes</option>
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 heure</option>
                          <option value="120">2 heures</option>
                        </select>
                     </div>
                  </div>

                  {/* Drink Selection */}
                  <div className="space-y-3">
                     <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-neutral-500 uppercase">Cocktails visés</label>
                        <button 
                          type="button"
                          onClick={() => setNewEvent(prev => ({ ...prev, selectedDrinkIds: prev.selectedDrinkIds.length === drinks.length ? [] : drinks.map(d => d.id) }))}
                          className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                        >
                          {newEvent.selectedDrinkIds.length === drinks.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {drinks.map(drink => {
                          const isSelected = newEvent.selectedDrinkIds.includes(drink.id);
                          return (
                            <button
                              key={drink.id}
                              type="button"
                              onClick={() => toggleDrink(drink.id)}
                              className={`p-3 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-between gap-2 text-left ${
                                isSelected 
                                ? 'bg-rose-500/10 border-rose-500/50 text-white' 
                                : 'bg-neutral-800/50 border-neutral-700 text-neutral-500 hover:border-neutral-600'
                              }`}
                            >
                              <span className="truncate">{drink.name}</span>
                              {isSelected && <Check size={12} className="text-rose-500 shrink-0" />}
                            </button>
                          );
                        })}
                     </div>
                     <p className="text-[10px] text-neutral-600 px-1 italic">Si aucun cocktail n&apos;est sélectionné, l&apos;événement s&apos;appliquera à TOUT le catalogue.</p>
                  </div>
               </div>

               <button 
                 type="submit"
                 disabled={isSaving || !newEvent.name}
                 className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-xl disabled:opacity-50"
               >
                 {isSaving ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <Sparkles size={20} />
                 )}
                 LANCER L&apos;ÉVÉNEMENT
               </button>
            </form>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
