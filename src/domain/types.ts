export interface Drink {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  imageUrl?: string;
  ownerId: string;
  isActive: boolean;
}

export interface MarketConfig {
  barmanId: string;
  increasePerOrder: number;
  decreaseOthers: number;
  cycleDurationSeconds: number;
}

export interface MarketSession {
  id: string;
  barmanId: string;
  isActive: boolean;
  currentCycleNumber: number;
  startedAt?: Date;
  lastPriceUpdateAt: Date;
}

export interface Order {
  id: string;
  drinkId: string;
  sessionId: string;
  cycleNumber: number;
  createdAt: Date;
}

export interface PriceSnapshot {
  drinkId: string;
  price: number;
  variation: number;
}

export interface MarketEvent {
  id: string;
  barmanId: string;
  name: string;
  type: 'fixed_price' | 'discount' | 'crash';
  value: number;
  startAt: Date;
  endAt: Date;
  drinkIds: string[]; // Associated drinks
}
