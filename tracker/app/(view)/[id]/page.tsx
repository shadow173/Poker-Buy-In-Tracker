import { notFound } from 'next/navigation';

type BuyIn = {
  amount: number;
  method: string;
};

type Player = {
  name: string;
  buyIns: BuyIn[];
};

// We'll fetch the data from the API route
async function getData(id: string): Promise<{players: Player[]; initialBuyIn: number; globalBuyInSet: boolean} | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/load/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

export default async function ReadOnlyPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  
  if (!data) {
    notFound();
  }

  const { players, initialBuyIn, globalBuyInSet } = data!;

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">Poker Buy-In Tracker (Read-Only)</h1>
      <p className="text-center text-gray-600 mb-6 text-sm">This is a shared view. You cannot make changes here.</p>

      <div className="flex flex-col gap-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Players</h2>
          {players.length === 0 ? (
            <p className="text-gray-500">No players found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map((player, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                >
                  {player.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {globalBuyInSet && (
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Initial Buy-In</h2>
            <p>Each player started with an initial buy-in of <strong>${initialBuyIn}</strong>.</p>
          </div>
        )}

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Buy-In Tracker</h2>
          {players.length === 0 ? (
            <p className="text-gray-500">No players added.</p>
          ) : (
            <div className="space-y-6">
              {players.map((player, pIndex) => {
                const total = player.buyIns.reduce((acc, curr) => acc + curr.amount, 0);
                return (
                  <div key={pIndex} className="border-b pb-4">
                    <h3 className="text-lg font-semibold">
                      {player.name} <span className="text-sm text-gray-600">(Total: ${total})</span>
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {player.buyIns.map((bi, i) => (
                        <li key={i} className="text-gray-700 text-sm">
                          {bi.method !== 'Initial' && '$'}
                          {bi.amount} - {bi.method}
                          {bi.method === 'Initial' && (
                            <span className="italic text-xs text-gray-500 ml-1">(Initial)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
