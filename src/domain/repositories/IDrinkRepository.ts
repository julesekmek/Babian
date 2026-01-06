import { Drink } from '../types';

export interface IDrinkRepository {
  getDrinksByOwner(ownerId: string): Promise<Drink[]>;
  getActiveDrinks(): Promise<Drink[]>;
  updatePrices(snapshots: { drinkId: string, price: number }[]): Promise<void>;
  updatePrice(drinkId: string, price: number): Promise<void>;
  createDrink(drink: Omit<Drink, 'id' | 'currentPrice' | 'isActive'>): Promise<Drink>;
}
