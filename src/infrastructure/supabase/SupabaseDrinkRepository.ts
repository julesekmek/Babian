import { createClient } from './client';
import { Drink } from '../../domain/types';
import { IDrinkRepository } from '../../domain/repositories/IDrinkRepository';
import { DrinkRow } from './types';

import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseDrinkRepository implements IDrinkRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || createClient();
  }

  async getDrinksByOwner(ownerId: string): Promise<Drink[]> {
    const { data, error } = await this.client
      .from('drinks')
      .select('*')
      .eq('owner_id', ownerId)
      .order('name');

    if (error) throw error;
    return data.map(this.mapToDomain);
  }

  async getActiveDrinks(): Promise<Drink[]> {
    const { data, error } = await this.client
      .from('drinks')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data.map(this.mapToDomain);
  }

  async updatePrices(snapshots: { drinkId: string; price: number; marketPrice: number }[]): Promise<void> {
    const promises = snapshots.map((s) =>
      this.client
        .from('drinks')
        .update({ 
          current_price: s.price,
          market_price: s.marketPrice 
        })
        .eq('id', s.drinkId)
    );

    const results = await Promise.all(promises);
    const error = results.find(r => r.error);
    if (error) throw error.error;
  }

  async createDrink(drink: Omit<Drink, 'id' | 'currentPrice' | 'isActive' | 'marketPrice'>): Promise<Drink> {
    const { data, error } = await this.client
      .from('drinks')
      .insert({
        name: drink.name,
        base_price: drink.basePrice,
        current_price: drink.basePrice,
        market_price: drink.basePrice,
        min_price: drink.minPrice,
        max_price: drink.maxPrice,
        owner_id: drink.ownerId,
        image_url: drink.imageUrl
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(data);
  }

  async updatePrice(drinkId: string, price: number): Promise<void> {
    const { error } = await this.client
      .from('drinks')
      .update({ 
        current_price: price,
        market_price: price // Manual override updates both
      })
      .eq('id', drinkId);

    if (error) throw error;
  }


  async deleteDrink(id: string): Promise<void> {
    const { error } = await this.client
      .from('drinks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateDrink(drink: Drink): Promise<void> {
    const { error } = await this.client
      .from('drinks')
      .update({
        name: drink.name,
        base_price: drink.basePrice,
        min_price: drink.minPrice,
        max_price: drink.maxPrice,
      })
      .eq('id', drink.id);

    if (error) throw error;
  }

  private mapToDomain(row: DrinkRow): Drink {
    return {
      id: row.id,
      name: row.name,
      basePrice: Number(row.base_price),
      currentPrice: Number(row.current_price),
      marketPrice: Number(row.market_price ?? row.current_price),
      minPrice: Number(row.min_price),
      maxPrice: Number(row.max_price),
      imageUrl: row.image_url,
      ownerId: row.owner_id,
      isActive: row.is_active
    };
  }
}
