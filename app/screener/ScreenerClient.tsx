'use client';
import { useState } from 'react';
import { Button, Card } from '@/components';

export function ScreenerClient({ results, lastCloseDate }: { results: Record<string, string[]>; lastCloseDate: string }) {
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
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setAdding(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 page-reveal">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Screener Results</h1>
          <p className="text-gray-600 mt-1">Matches from the seeded universe run against standard technical rules.</p>
        </div>
        <div className="text-left md:text-right font-sans">
          <span className="inline-block text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md mb-1.5">
            Data as of last close: {formatDate(lastCloseDate)}
          </span>
          <p className="text-xs text-gray-400">
            EOD swing trading analytics (not live-trading or investment advice).
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(results).map(([ruleId, symbols]) => (
          <Card key={ruleId} className="p-5 flex flex-col bg-white border border-gray-200">
            <h2 className="text-xl font-bold mb-4 capitalize border-b pb-2 text-gray-800">{ruleId.replace(/_/g, ' ')}</h2>
            {symbols.length === 0 ? (
              <div className="flex-grow flex items-center justify-center border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400 font-sans">
                No matching symbols.
              </div>
            ) : (
              <ul className="space-y-3 flex-grow">
                {symbols.map(sym => (
                  <li key={sym} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm interactive-card">
                    <span className="font-semibold text-gray-900">{sym}</span>
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1 px-3"
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
