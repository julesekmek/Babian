"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { SupabaseDrinkRepository } from '@/infrastructure/supabase/SupabaseDrinkRepository';
import { SupabaseStorageService } from '@/infrastructure/supabase/SupabaseStorageService';
import { Drink } from '@/domain/types';
import { Plus, Trash2, ChevronLeft, Edit2, Check, X } from 'lucide-react';
import { createClient } from '@/infrastructure/supabase/client';

export default function AdminDrinksPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [newDrink, setNewDrink] = useState({ 
    name: '', 
    price: '5.00',
    min: '3.00',
    max: '12.00',
    imageUrl: '',
    volume: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    min: '',
    max: '',
    imageUrl: '',
    volume: ''
  });

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const drinkRepo = useMemo(() => new SupabaseDrinkRepository(), []);
  const storageService = useMemo(() => new SupabaseStorageService(), []);

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
    
    let imageUrl = newDrink.imageUrl;

    try {
      // Handle file upload if present
      if (selectedFile) {
        imageUrl = await storageService.uploadDrinkImage(selectedFile);
      }

      const created = await drinkRepo.createDrink({
        name: newDrink.name,
        basePrice: parseFloat(newDrink.price),
        minPrice: parseFloat(newDrink.min),
        maxPrice: parseFloat(newDrink.max),
        ownerId: user.id,
        imageUrl: imageUrl,
        volume: newDrink.volume
      });
      setDrinks(prev => [...prev, created]);
      setNewDrink({ name: '', price: '5.00', min: '3.00', max: '12.00', imageUrl: '', volume: '' });
      setSelectedFile(null);
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
      max: drink.maxPrice.toString(),
      imageUrl: drink.imageUrl || '',
      volume: drink.volume || ''
    });
    setEditFile(null);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setError(null);
    
    let imageUrl = editForm.imageUrl;

    try {
      if (editFile) {
         imageUrl = await storageService.uploadDrinkImage(editFile);
      }

      const updatedDrink: Drink = {
        ...drinks.find(d => d.id === editingId)!,
        name: editForm.name,
        basePrice: parseFloat(editForm.price),
        minPrice: parseFloat(editForm.min),
        maxPrice: parseFloat(editForm.max),
        imageUrl: imageUrl,
        volume: editForm.volume
      };
      await drinkRepo.updateDrink(updatedDrink);
      setDrinks(prev => prev.map(d => d.id === editingId ? updatedDrink : d));
      setEditingId(null);
      setEditFile(null);
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
          <h1 className="text-4xl font-black italic tracking-tight uppercase">Catalogue <span className="text-primary-500">Cocktails</span></h1>
        </div>

        {error && (
            <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-bold animate-shake">
                {error}
                <p className="mt-1 opacity-70">Vérifiez que le bucket "drinks" existe et est public sur Supabase.</p>
            </div>
        )}

        {/* Add Drink Form */}
        <form onSubmit={handleAddDrink} className="p-8 rounded-4xl bg-neutral-900 border border-neutral-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Quantité (ex: 33cl)</label>
                <input 
                  type="text" 
                  placeholder="33cl"
                  value={newDrink.volume}
                  onChange={e => setNewDrink(prev => ({ ...prev, volume: e.target.value }))}
                  className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Image du cocktail</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                    className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
                  />
                  {selectedFile && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              </div>
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
                   className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-center text-primary-500"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-neutral-500 uppercase px-1">Max (€)</label>
                 <input 
                   type="number" step="0.10"
                   value={newDrink.max}
                   onChange={e => setNewDrink(prev => ({ ...prev, max: e.target.value }))}
                   className="w-full bg-neutral-800 border-none rounded-xl p-4 font-bold text-center text-primary-500"
                 />
               </div>
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full py-4 bg-primary-500 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors shadow-lg"
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
                   <div className="col-span-1 space-y-2">
                     <input 
                       className="w-full bg-neutral-800 rounded-lg p-2 font-bold"
                       value={editForm.name}
                       onChange={e => setEditForm(prev => ({...prev, name: e.target.value}))}
                       placeholder="Nom"
                     />
                     <input 
                       className="w-full bg-neutral-800 rounded-lg p-2 font-bold text-xs"
                       value={editForm.volume}
                       onChange={e => setEditForm(prev => ({...prev, volume: e.target.value}))}
                       placeholder="Vol. (33cl)"
                     />
                     <div className="relative">
                        <input 
                          type="file"
                          accept="image/*"
                          className="w-full bg-neutral-800 rounded-lg p-2 font-bold text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-neutral-700 file:text-white"
                          onChange={e => {
                            if (e.target.files?.[0]) setEditFile(e.target.files[0]);
                          }}
                        />
                        {editFile && <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full" />}
                     </div>
                   </div>
                   <input 
                     type="number" step="0.1"
                     className="bg-neutral-800 rounded-lg p-2 font-bold text-center h-10"
                     value={editForm.price}
                     onChange={e => setEditForm(prev => ({...prev, price: e.target.value}))}
                   />
                   <input 
                     type="number" step="0.1"
                     className="bg-neutral-800 rounded-lg p-2 font-bold text-center text-primary-500 h-10"
                     value={editForm.min}
                     onChange={e => setEditForm(prev => ({...prev, min: e.target.value}))}
                   />
                   <input 
                     type="number" step="0.1"
                     className="bg-neutral-800 rounded-lg p-2 font-bold text-center text-primary-500 h-10"
                     value={editForm.max}
                     onChange={e => setEditForm(prev => ({...prev, max: e.target.value}))}
                   />
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  {drink.imageUrl ? (
                    <div className="w-12 h-12 rounded-xl bg-cover bg-center border border-neutral-800 shadow-inner" style={{ backgroundImage: `url(${drink.imageUrl})` }} />
                  ) : (
                    <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-primary-500 font-black">
                       {drink.name[0].toUpperCase()}
                    </div>
                  )}
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
                      className="p-3 text-neutral-500 hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100"
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
