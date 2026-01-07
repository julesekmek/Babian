import { PriceEngine } from '../domain/services/PriceEngine';
import { IDrinkRepository } from '../domain/repositories/IDrinkRepository';
import { IMarketSessionRepository } from '../domain/repositories/IMarketSessionRepository';
import { OrderService } from './OrderService';

export class MarketService {
  constructor(
    private drinkRepo: IDrinkRepository,
    private sessionRepo: IMarketSessionRepository,
    private orderService: OrderService
  ) {}

  /**
   * Main logic to advance the market by one cycle.
   * Calculates new prices and updates the database.
   */
  async processCycleEnd(barmanId: string): Promise<void> {
    const session = await this.sessionRepo.getActiveSession(barmanId);
    if (!session) throw new Error("No active session found");

    const config = await this.sessionRepo.getConfig(barmanId);
    if (!config) throw new Error("No market configuration found");

    const lastUpdate = new Date(session.lastPriceUpdateAt);

    // 3. Atomic claim of the cycle (Compare and Swap)
    // We use a threshold to be resistant to clock drift/precision issues
    // Threshold = 1s before the cycle is supposed to end
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - (config.cycleDurationSeconds - 1) * 1000);
    
    const nextCycle = session.currentCycleNumber + 1;
    const acquired = await this.sessionRepo.acquireCycleLock(session.id, session.currentCycleNumber, thresholdDate);
    
    if (!acquired) {
      return;
    }

    console.log(`[MarketService] Cycle Processing Started: Session=${session.id}, Cycle=${session.currentCycleNumber} -> ${nextCycle}`);

    const [drinks, orderCounts, activeEvents] = await Promise.all([
      this.drinkRepo.getDrinksByOwner(barmanId),
      this.orderService.getOrderCountsSince(session.id, lastUpdate),
      this.sessionRepo.getActiveEvents(barmanId)
    ]);

    console.log(`[MarketService] Trace:`);
    console.log(` - Orders since last update:`, JSON.stringify(orderCounts));

    // 1. Calculate new prices (passing active events)
    const snapshots = PriceEngine.calculateNewPrices(drinks, orderCounts, config, activeEvents);

    drinks.forEach(d => {
      const snap = snapshots.find(s => s.drinkId === d.id);
      const orders = orderCounts[d.id] || 0;
      console.log(` - ${d.name}: Old=${d.currentPrice}, New=${snap?.price}, Var=${snap?.variation}, Orders=${orders}`);
    });

    // 2. Update DB in a pseudo-transaction
    await this.drinkRepo.updatePrices(snapshots.map(s => ({ 
      drinkId: s.drinkId, 
      price: s.price,
      marketPrice: s.marketPrice 
    })));

    // 3. Save to history (using the NEW cycle number)
    const historyEntries = snapshots.map(s => ({
      drink_id: s.drinkId,
      session_id: session.id,
      cycle_number: nextCycle,
      price: s.price,
      variation: s.variation
    }));
    
    await this.sessionRepo.savePriceHistory(historyEntries);

    // 4. Final step: Increment cycle count to signal readiness to clients
    await this.sessionRepo.incrementCycle(session.id);
    console.log(`[MarketService] Cycle Finished: Session=${session.id}, New Cycle=${nextCycle}`);
  }
}
