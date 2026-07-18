'use client';
import { useState } from 'react';
import { Button, Card } from '@/components';
import { runScannerAction } from './actions';

export default function ScannerPage() {
  const [ruleId, setRuleId] = useState('EMA_Stack');
  const [target, setTarget] = useState('universe');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary: { signalCount: number, winRate: number, averageForwardReturns: { day5: number | null, day10: number | null, day20: number | null } }, triggers: { date: string, symbol: string, forwardReturns: { day5: number | null, day10: number | null, day20: number | null } }[] } | null>(null);
  const [error, setError] = useState('');

  const runScan = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await runScannerAction({ ruleId, target });
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Historical Scanner</h1>
      
      <Card className="p-6 space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Rule</label>
            <select 
              className="w-full border border-gray-300 rounded p-2"
              value={ruleId} 
              onChange={e => setRuleId(e.target.value)}
            >
              <option value="EMA_Stack">EMA Stack</option>
              <option value="Tight_Consolidation">Tight Consolidation</option>
              <option value="Volume_Surge">Volume Surge</option>
              <option value="Near_52W_High">Near 52-Week High</option>
              <option value="Relative_Strength">Relative Strength</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Target</label>
            <select 
              className="w-full border border-gray-300 rounded p-2"
              value={target} 
              onChange={e => setTarget(e.target.value)}
            >
              <option value="universe">Full Universe (Seeded)</option>
              <option value="watchlist">My Watchlist</option>
            </select>
          </div>
          <Button onClick={runScan} disabled={loading}>
            {loading ? 'Scanning...' : 'Run Scan'}
          </Button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </Card>

      {result && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Summary Stats</h2>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Total Signals</div>
                <div className="text-2xl font-semibold">{result.summary.signalCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Win Rate (10-Day)</div>
                <div className="text-2xl font-semibold">{result.summary.winRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg 5D Return</div>
                <div className="text-2xl font-semibold">
                  {result.summary.averageForwardReturns.day5 !== null 
                    ? (result.summary.averageForwardReturns.day5 * 100).toFixed(2) + '%' 
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg 20D Return</div>
                <div className="text-2xl font-semibold">
                  {result.summary.averageForwardReturns.day20 !== null 
                    ? (result.summary.averageForwardReturns.day20 * 100).toFixed(2) + '%' 
                    : 'N/A'}
                </div>
              </div>
            </div>
          </Card>

          <h2 className="text-xl font-bold mt-8">Recent Triggers (up to 100)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Date</th>
                  <th className="p-2">Symbol</th>
                  <th className="p-2">5D Return</th>
                  <th className="p-2">10D Return</th>
                  <th className="p-2">20D Return</th>
                </tr>
              </thead>
              <tbody>
                {result.triggers.map((t: { date: string, symbol: string, forwardReturns: { day5: number | null, day10: number | null, day20: number | null } }, i: number) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2">{t.date}</td>
                    <td className="p-2 font-semibold">{t.symbol}</td>
                    <td className="p-2">{t.forwardReturns.day5 !== null ? (t.forwardReturns.day5 * 100).toFixed(2) + '%' : '-'}</td>
                    <td className="p-2">{t.forwardReturns.day10 !== null ? (t.forwardReturns.day10 * 100).toFixed(2) + '%' : '-'}</td>
                    <td className="p-2">{t.forwardReturns.day20 !== null ? (t.forwardReturns.day20 * 100).toFixed(2) + '%' : '-'}</td>
                  </tr>
                ))}
                {result.triggers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">No triggers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
