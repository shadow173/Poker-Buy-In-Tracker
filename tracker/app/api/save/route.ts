// app/api/save/route.ts
import { NextResponse } from 'next/server';

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

// Use const instead of exporting the database directly
const database = new Map<string, StoredData>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = Math.random().toString(36).substring(7);
    
    database.set(id, body);
    
    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}