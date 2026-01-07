import { MarketSession, MarketConfig, MarketEvent } from '../types';

export interface IMarketSessionRepository {
  getActiveSession(barmanId: string): Promise<MarketSession | null>;
  createSession(barmanId: string): Promise<MarketSession>;
  incrementCycle(sessionId: string): Promise<number>;
  getConfig(barmanId: string): Promise<MarketConfig | null>;
  updateConfig(config: MarketConfig): Promise<void>;
  closeSession(sessionId: string): Promise<void>;
  acquireCycleLock(sessionId: string, currentCycle: number, lastUpdateThreshold: Date): Promise<boolean>;
  
  getEvents(barmanId: string): Promise<MarketEvent[]>;
  getActiveEvents(barmanId: string): Promise<MarketEvent[]>;
  getTemplateEvents(barmanId: string): Promise<MarketEvent[]>;
  createEvent(event: Omit<MarketEvent, 'id'>): Promise<MarketEvent>;
  activateEvent(eventId: string, durationMinutes: number): Promise<MarketEvent>;
  deleteEvent(eventId: string): Promise<void>;
  savePriceHistory(entries: {
    drink_id: string;
    session_id: string;
    cycle_number: number;
    price: number;
    variation: number;
  }[]): Promise<void>;
}
