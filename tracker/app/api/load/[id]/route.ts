// app/api/load/[id]/route.ts
import { NextResponse } from 'next/server';

// Create a shared database instance
const database = new Map<string, StoredData>();
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
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    if (!database.has(id)) {
      return NextResponse.json(
        { error: 'Data not found' },
        { status: 404 }
      );
    }

    const data = database.get(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    );
  }
}