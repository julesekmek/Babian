import { MarketSession, MarketConfig, MarketEvent } from '../types';

export interface IMarketSessionRepository {
  getActiveSession(barmanId: string): Promise<MarketSession | null>;
  createSession(barmanId: string): Promise<MarketSession>;
  incrementCycle(sessionId: string): Promise<number>;
  getConfig(barmanId: string): Promise<MarketConfig | null>;
  updateConfig(config: MarketConfig): Promise<void>;
  closeSession(sessionId: string): Promise<void>;
  
  getEvents(barmanId: string): Promise<MarketEvent[]>;
  getActiveEvents(barmanId: string): Promise<MarketEvent[]>;
  createEvent(event: Omit<MarketEvent, 'id'>): Promise<MarketEvent>;
  deleteEvent(eventId: string): Promise<void>;
}
