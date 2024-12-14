import { NextResponse } from 'next/server';
import crypto from 'crypto';

type BuyIn = {
  amount: number;
  method: string;
};

type Player = {
  name: string;
  buyIns: BuyIn[];
};

type StoredData = {
  players: Player[];
  initialBuyIn: number;
  globalBuyInSet: boolean;
};

const database = new Map<string, StoredData>(); // In-memory storage

export async function POST(request: Request) {
  const { players, initialBuyIn, globalBuyInSet } = await request.json();

  const id = crypto.randomBytes(4).toString('hex');
  database.set(id, { players, initialBuyIn, globalBuyInSet });

  return NextResponse.json({ id });
}

// For demonstration, we also need to export the database so load can access it (or we can copy the variable there as well).
export { database };
