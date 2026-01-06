import { createClient } from './client';
import { Drink } from '../../domain/types';
import { IDrinkRepository } from '../../domain/repositories/IDrinkRepository';
import { DrinkRow } from './types';

export class SupabaseDrinkRepository implements IDrinkRepository {
  private client = createClient();

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

  async updatePrices(snapshots: { drinkId: string; price: number }[]): Promise<void> {
    // Supabase doesn't have a multi-row update by ID in a single query easily without RPC
    // But we can use an 'upsert' or a loop if the number of drinks is small (< 50)
    // For a senior implementation, an RPC would be better, but let's stick to base for now.
    const promises = snapshots.map((s) =>
      this.client
        .from('drinks')
        .update({ current_price: s.price })
        .eq('id', s.drinkId)
    );

    const results = await Promise.all(promises);
    const error = results.find(r => r.error);
    if (error) throw error.error;
  }

  async createDrink(drink: Omit<Drink, 'id' | 'currentPrice' | 'isActive'>): Promise<Drink> {
    const { data, error } = await this.client
      .from('drinks')
      .insert({
        name: drink.name,
        base_price: drink.basePrice,
        current_price: drink.basePrice,
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
      .update({ current_price: price })
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
      minPrice: Number(row.min_price),
      maxPrice: Number(row.max_price),
      imageUrl: row.image_url,
      ownerId: row.owner_id,
      isActive: row.is_active
    };
  }
}
