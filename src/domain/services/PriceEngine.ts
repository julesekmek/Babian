import { Drink, MarketConfig, PriceSnapshot, MarketEvent } from '../types';

export class PriceEngine {
  /**
   * Calculates new prices for all drinks based on the orders received in the cycle
   * and any active market events.
   */
  static calculateNewPrices(
    drinks: Drink[],
    orderCounts: Record<string, number>,
    config: MarketConfig,
    activeEvents: MarketEvent[] = []
  ): PriceSnapshot[] {
    return drinks.map((drink) => {
      const orders = orderCounts[drink.id] || 0;
      let newPrice = drink.currentPrice;

      // 1. Base Price Variation
      if (orders > 0) {
        newPrice += orders * config.increasePerOrder;
      } else {
        newPrice -= config.decreaseOthers;
      }

      // 2. Apply Events
      for (const event of activeEvents) {
        const isTargeted = event.drinkIds.length === 0 || event.drinkIds.includes(drink.id);
        
        if (!isTargeted) continue;

        switch (event.type) {
          case 'discount':
            // Value is percentage (ex: 30 for 30% off)
            newPrice *= (1 - event.value / 100);
            break;
          case 'crash':
            // Value is drop percentage (ex: 50 for 50% drop)
            newPrice *= (1 - event.value / 100);
            break;
          case 'fixed_price':
            // Value is the target price
            newPrice = event.value;
            break;
        }
      }

      // 3. Enforce configured min/max limits
      if (newPrice < drink.minPrice) {
        newPrice = drink.minPrice;
      }
      if (newPrice > drink.maxPrice) {
        newPrice = drink.maxPrice;
      }

      // 4. Round to 2 decimals
      newPrice = Math.round(newPrice * 100) / 100;

      return {
        drinkId: drink.id,
        price: newPrice,
        variation: Math.round((newPrice - drink.currentPrice) * 100) / 100,
      };
    });
  }
}
