import { PriceEngine } from '../domain/services/PriceEngine';
import { IDrinkRepository } from '../domain/repositories/IDrinkRepository';
import { IMarketSessionRepository } from '../domain/repositories/IMarketSessionRepository';
import { OrderService } from './OrderService';
import { createClient } from '../infrastructure/supabase/client';

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

    // Safety: Ensure enough time has passed from last update (buffer of 1s)
    const now = new Date();
    const lastUpdate = new Date(session.lastPriceUpdateAt);
    const secondsSinceLast = (now.getTime() - lastUpdate.getTime()) / 1000;
    
    if (secondsSinceLast < (config.cycleDurationSeconds - 1)) {
       console.log("Cycle trigger skipped: too soon");
       return;
    }

    const [drinks, orderCounts, activeEvents] = await Promise.all([
      this.drinkRepo.getDrinksByOwner(barmanId),
      this.orderService.getOrderCountsForCycle(session.id, session.currentCycleNumber),
      this.sessionRepo.getActiveEvents(barmanId)
    ]);

    // 1. Calculate new prices (passing active events)
    const snapshots = PriceEngine.calculateNewPrices(drinks, orderCounts, config, activeEvents);

    // 2. Update DB in a pseudo-transaction (Supabase JS doesn't support real transactions well, 
    // but we can chain them or use RPC)
    await this.drinkRepo.updatePrices(snapshots.map(s => ({ drinkId: s.drinkId, price: s.price })));

    // 3. Save to history
    const historyEntries = snapshots.map(s => ({
      drink_id: s.drinkId,
      session_id: session.id,
      cycle_number: session.currentCycleNumber,
      price: s.price,
      variation: s.variation
    }));
    
    const client = createClient();
    const { error: historyError } = await client.from('price_history').insert(historyEntries);
    if (historyError) throw historyError;

    // 4. Increment cycle count
    await this.sessionRepo.incrementCycle(session.id);
  }
}
