'use client';
import { useState } from 'react';
import { Button, Card, Badge } from '@/components';

export function ScreenerClient({ results }: { results: Record<string, string[]> }) {
  const [adding, setAdding] = useState<string | null>(null);

  const handleAdd = async (symbol: string) => {
    setAdding(symbol);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, tag: 'momentum' }),
      });
      if (!res.ok) {
        throw new Error('Failed to add');
      }
      alert(`${symbol} added to watchlist!`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Screener Results</h1>
      <p className="text-gray-600">Matches from the seeded universe run against standard rules.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(results).map(([ruleId, symbols]) => (
          <Card key={ruleId} className="p-4">
            <h2 className="text-xl font-bold mb-4 capitalize">{ruleId.replace(/_/g, ' ')}</h2>
            {symbols.length === 0 ? (
              <p className="text-sm text-gray-500">No matches.</p>
            ) : (
              <ul className="space-y-3">
                {symbols.map(sym => (
                  <li key={sym} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="font-semibold">{sym}</span>
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1"
                      onClick={() => handleAdd(sym)}
                      disabled={adding === sym}
                    >
                      {adding === sym ? 'Adding...' : '+ Watchlist'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
