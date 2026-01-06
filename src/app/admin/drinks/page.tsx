"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { Drink } from '@/domain/types';
import { Plus, Trash2, ChevronLeft, Edit2, Check, X } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/client';

export default function AdminDrinksPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [newDrink, setNewDrink] = useState({ 
    name: '', 
    price: '5.00',
    min: '3.00',
    max: '12.00'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    min: '',
    max: ''
  });
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      const list = await drinkRepo.getDrinksByOwner(user.id);
      setDrinks(list);
    } catch (err: any) {
      setError("Erreur de chargement: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [drinkRepo, router]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    init();
  }, [init]);

  const handleAddDrink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user || !newDrink.name) return;
    try {
      const created = await drinkRepo.createDrink({
        name: newDrink.name,
        basePrice: parseFloat(newDrink.price),
        minPrice: parseFloat(newDrink.min),
        maxPrice: parseFloat(newDrink.max),
        ownerId: user.id
      });
      setDrinks(prev => [...prev, created]);
      setNewDrink({ name: '', price: '5.00', min: '3.00', max: '12.00' });
    } catch (err: any) {
      console.error("Erreur detaillée:", err);
      setError("Erreur lors de l'ajout: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleDeleteDrink = async (id: string) => {
    if (!confirm("Supprimer ce cocktail ?")) return;
    setError(null);
    try {
      await drinkRepo.deleteDrink(id);
      setDrinks(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError("Erreur lors de la suppression: " + err.message);
    }
  };

  const startEdit = (drink: Drink) => {
    setEditingId(drink.id);
    setEditForm({
      name: drink.name,
      price: drink.basePrice.toString(),
      min: drink.minPrice.toString(),
      max: drink.maxPrice.toString()
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setError(null);
    try {
      const updatedDrink: Drink = {
        ...drinks.find(d => d.id === editingId)!,
        name: editForm.name,
        basePrice: parseFloat(editForm.price),
        minPrice: parseFloat(editForm.min),
        maxPrice: parseFloat(editForm.max)
      };
      await drinkRepo.updateDrink(updatedDrink);
      setDrinks(prev => prev.map(d => d.id === editingId ? updatedDrink : d));
      setEditingId(null);
    } catch (err: any) {
      setError("Erreur lors de la modification: " + err.message);
    }
  };

  if (loading) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-bold text-xs uppercase"
        >
          <ChevronLeft size={16} />
          Retour au Bureau
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black italic tracking-tight uppercase">Catalogue <span className="text-rose-500">Cocktails</span></h1>
        </div>

        {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold animate-shake">
                {error}
                <p className="mt-1 opacity-70">Avez-vous bien exécuté migration_v2.sql sur Supabase ?</p>
            </div>
        )}

        {/* Add Drink Form */}
        <form onSubmit={handleAddDrink} className="p-8 rounded-4xl bg-neutral-900 border border-neutral-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Nom du cocktail</label>
              <input 
                type="text" 
                placeholder="ex: Mojito Passion"
                value={newDrink.name}
                onChange={e => setNewDrink(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Départ (€)</label>
                 <input 
                   type="number" step="0.10"
                   value={newDrink.price}
                   onChange={e => setNewDrink(prev => ({ ...prev, price: e.target.value }))}
                   className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-center"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Min (€)</label>
                 <input 
                   type="number" step="0.10"
                   value={newDrink.min}
                   onChange={e => setNewDrink(prev => ({ ...prev, min: e.target.value }))}
                   className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-center text-rose-500"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Max (€)</label>
                 <input 
                   type="number" step="0.10"
                   value={newDrink.max}
                   onChange={e => setNewDrink(prev => ({ ...prev, max: e.target.value }))}
                   className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-center text-rose-500"
                 />
               </div>
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full py-4 bg-rose-500 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors shadow-lg"
          >
            <Plus size={20} />
            AJOUTER AU CATALOGUE
          </button>
        </form>

        {/* Drink List */}
        <div className="grid grid-cols-1 gap-3">
          {drinks.map(drink => (
            <div key={drink.id} className="p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between group hover:border-neutral-700 transition-all">
              
              {editingId === drink.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
                   <input 
                     className="bg-neutral-800 rounded-lg p-2 font-bold col-span-1"
                     value={editForm.name}
                     onChange={e => setEditForm(prev => ({...prev, name: e.target.value}))}
                   />
                   <input 
                     type="number" step="0.1"
                     className="bg-neutral-800 rounded-lg p-2 font-bold text-center"
                     value={editForm.price}
                     onChange={e => setEditForm(prev => ({...prev, price: e.target.value}))}
                   />
                   <input 
                     type="number" step="0.1"
                     className="bg-neutral-800 rounded-lg p-2 font-bold text-center text-rose-500"
                     value={editForm.min}
                     onChange={e => setEditForm(prev => ({...prev, min: e.target.value}))}
                   />
                   <input 
                     type="number" step="0.1"
                     className="bg-neutral-800 rounded-lg p-2 font-bold text-center text-rose-500"
                     value={editForm.max}
                     onChange={e => setEditForm(prev => ({...prev, max: e.target.value}))}
                   />
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-rose-500 font-black">
                     {drink.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{drink.name}</div>
                    <div className="flex gap-4 text-[10px] font-black text-neutral-500 uppercase">
                      <span>Base: {drink.basePrice.toFixed(2)}€</span>
                      <span>Min: {drink.minPrice.toFixed(2)}€</span>
                      <span>Max: {drink.maxPrice.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {editingId === drink.id ? (
                  <>
                    <button onClick={handleUpdate} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                       <Check size={18} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-3 bg-neutral-800 text-neutral-400 rounded-xl">
                       <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => startEdit(drink)}
                      className="p-3 text-neutral-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteDrink(drink.id)}
                      className="p-3 text-neutral-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {drinks.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-neutral-900 rounded-4xl">
                  <p className="text-neutral-500 font-bold uppercase text-xs">Aucun cocktail dans votre catalogue.</p>
              </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
