import { createClient } from '../infrastructure/supabase/client';

export class OrderService {
  private client = createClient();

  async placeOrder(drinkId: string, sessionId: string, cycleNumber: number): Promise<void> {
    const { error } = await this.client
      .from('orders')
      .insert({
        drink_id: drinkId,
        session_id: sessionId,
        cycle_number: cycleNumber
      });

    if (error) throw error;
  }

  async getOrderCountsForCycle(sessionId: string, cycleNumber: number): Promise<Record<string, number>> {
    // Count orders per drink for the given cycle
    const { data, error } = await this.client
      .from('orders')
      .select('drink_id')
      .eq('session_id', sessionId)
      .eq('cycle_number', cycleNumber);

    if (error) throw error;

    const counts: Record<string, number> = {};
    data?.forEach((o: { drink_id: string }) => {
      counts[o.drink_id] = (counts[o.drink_id] || 0) + 1;
    });

    return counts;
  }
}
