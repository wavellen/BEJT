import { v4 as uuidv4 } from 'uuid';

export interface Order {
  id: number;
  userId: string;
  amount: number;
  createdAt: Date;
}

export const orderTable: Order[] = [];
let nextOrderId = 1;

export const idempotencyCache = new Map<string, { status: 'STARTED' | 'COMPLETED'; response?: any }>();

export function generateNextOrderId(): number {
  return nextOrderId++;
}

export function seedDatabase() {
  const now = Date.now();
  for (let i = 1; i <= 50; i++) {
    orderTable.push({
      id: nextOrderId++,
      userId: `user_${Math.floor(Math.random() * 5) + 1}`,
      amount: Math.floor(Math.random() * 500) + 10,
      createdAt: new Date(now - (50 - i) * 60000) // incrementally older records
    });
  }
}
