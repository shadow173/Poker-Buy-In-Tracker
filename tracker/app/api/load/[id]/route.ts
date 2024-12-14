import { NextResponse } from 'next/server';
import { database } from '../../save/route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!database.has(id)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const data = database.get(id);
  return NextResponse.json(data);
}
