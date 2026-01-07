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
      
      // 1. Calculate internal Market Price (Supply/Demand)
      // We ALWAYS start from the previous marketPrice to avoid compounding event effects
      let newMarketPrice = drink.marketPrice;

      if (orders > 0) {
        newMarketPrice += orders * config.increasePerOrder;
      } else {
        newMarketPrice -= config.decreaseOthers;
      }

      // Enforce configured min/max limits on market price
      if (newMarketPrice < drink.minPrice) newMarketPrice = drink.minPrice;
      if (newMarketPrice > drink.maxPrice) newMarketPrice = drink.maxPrice;

      // 2. Calculate Display Price (Market Price + Events Overlay)
      let newDisplayPrice = newMarketPrice;

      // Apply Events
      for (const event of activeEvents) {
        const isTargeted = event.drinkIds.length === 0 || event.drinkIds.includes(drink.id);
        
        if (!isTargeted) continue;

        switch (event.type) {
          case 'discount':
            // Value is percentage (ex: 30 for 30% off)
            newDisplayPrice *= (1 - event.value / 100);
            break;
          case 'crash':
            // Value is drop percentage (ex: 50 for 50% drop)
            newDisplayPrice *= (1 - event.value / 100);
            break;
          case 'fixed_price':
            // Value is the target price
            newDisplayPrice = event.value;
            break;
        }
      }

      // 3. Final Rounding
      newMarketPrice = Math.round(newMarketPrice * 100) / 100;
      newDisplayPrice = Math.round(newDisplayPrice * 100) / 100;

      return {
        drinkId: drink.id,
        price: newDisplayPrice,
        marketPrice: newMarketPrice,
        variation: Math.round((newDisplayPrice - drink.currentPrice) * 100) / 100,
      };
    });
  }
}
