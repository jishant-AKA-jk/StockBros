import { createClient } from '@/lib/supabase/server'
import { AuthForm, Logo } from '@/components'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col page-reveal font-sans">


      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-12 md:py-20 flex flex-col lg:flex-row gap-12 items-start">
        {/* Left Side: Copy */}
        <div className="w-full lg:w-7/12 flex flex-col space-y-8 order-2 lg:order-1">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-ink leading-tight font-display text-balance">
              Disciplined swing trading, backed by clear analytics.
            </h1>
            <p className="text-lg text-ink-light leading-relaxed max-w-[65ch] font-sans">
              StockBros is designed for systematic swing traders who operate on daily and weekly charts. Log your ideas, screen the market, visualize setups, and measure your edge without noise.
            </p>
          </div>

          {/* Visual Preview */}
          <div className="relative group rounded-xl p-[1px] bg-gradient-to-r from-primary/30 to-signature/30 hover:from-primary/50 hover:to-signature/50 transition-colors">
            <div className="bg-surface rounded-xl p-6 flex flex-col gap-6 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-signature/10 rounded-full blur-2xl group-hover:bg-signature/20 transition-all duration-500"></div>
              
              <div className="flex items-center justify-between z-10">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                     </svg>
                   </div>
                   <div>
                     <h3 className="font-semibold text-ink text-sm">Portfolio Analytics</h3>
                     <p className="text-xs text-ink-light">Real-time edge calculation</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <span className="block font-mono text-lg font-bold text-data-up">+14.2%</span>
                   <span className="text-xs text-ink-light">Avg. R-Multiple</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 z-10">
                <div className="bg-paper p-3 rounded-lg border border-hairline/50">
                  <p className="text-xs text-ink-light mb-1">Win Rate</p>
                  <p className="font-mono font-semibold text-ink">62.5%</p>
                </div>
                <div className="bg-paper p-3 rounded-lg border border-hairline/50">
                  <p className="text-xs text-ink-light mb-1">Profit Factor</p>
                  <p className="font-mono font-semibold text-ink">2.4</p>
                </div>
                <div className="bg-paper p-3 rounded-lg border border-hairline/50">
                  <p className="text-xs text-ink-light mb-1">Max Drawdown</p>
                  <p className="font-mono font-semibold text-ink">-4.2%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Features: Ledger Layout */}
          <div className="border-t border-hairline flex flex-col">
            <div className="py-4 border-b border-hairline flex flex-col sm:flex-row gap-2 sm:gap-4 items-start hover:bg-surface/50 transition-colors">
              <h3 className="font-mono text-ink text-sm w-48 shrink-0">01. Multi-Symbol Grid</h3>
              <p className="text-base text-ink-light leading-relaxed">
                Render daily and weekly charts with 10/20 EMA technical overlays synced globally.
              </p>
            </div>
            <div className="py-4 border-b border-hairline flex flex-col sm:flex-row gap-2 sm:gap-4 items-start hover:bg-surface/50 transition-colors">
              <h3 className="font-mono text-ink text-sm w-48 shrink-0">02. Rule-Based Screener</h3>
              <p className="text-base text-ink-light leading-relaxed">
                Scan for EMA Stacks, Tight Consolidations, Volume Surges, and Relative Strength.
              </p>
            </div>
            <div className="py-4 border-b border-hairline flex flex-col sm:flex-row gap-2 sm:gap-4 items-start hover:bg-surface/50 transition-colors">
              <h3 className="font-mono text-ink text-sm w-48 shrink-0">03. Watchlist Tagging</h3>
              <p className="text-base text-ink-light leading-relaxed">
                Group candidates by tags (Momentum, Value, Dividend) to monitor development.
              </p>
            </div>
            <div className="py-4 border-b border-hairline flex flex-col sm:flex-row gap-2 sm:gap-4 items-start hover:bg-surface/50 transition-colors">
              <h3 className="font-mono text-ink text-sm w-48 shrink-0">04. Trading Ledger</h3>
              <p className="text-base text-ink-light leading-relaxed">
                Log trades, save exit/entry setups, and automatically calculate exact R-multiples.
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="bg-surface/50 border border-hairline rounded-lg p-4 flex gap-3 text-sm">
             <span className="text-primary mt-0.5">ℹ️</span>
             <p className="text-ink-light leading-relaxed">
               <strong>Note:</strong> StockBros is a research platform for historical end-of-day (EOD) swing trading data. It does not support live trading, intraday data, or offer financial advice.
             </p>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-5/12 mx-auto order-1 lg:order-2 mb-8 lg:mb-0">
          {user ? (
            <Card className="p-8 bg-surface border border-hairline text-center space-y-6 rounded shadow-none">
              <div className="space-y-2">
                <div className="w-12 h-12 border-2 border-primary text-primary rounded-full flex items-center justify-center mx-auto text-xl font-bold font-mono">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-ink font-display text-balance">Already Signed In</h2>
                <p className="text-sm text-ink-light">
                  Welcome back! You are logged in as <strong className="text-ink font-mono text-xs">{user.email}</strong>.
                </p>
              </div>
              <div>
                <a 
                  href="/dashboard" 
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded text-white bg-primary hover:bg-primary/90 transition-colors shadow-none"
                >
                  Go to Dashboard &rarr;
                </a>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <AuthForm />
              <p className="text-center font-mono text-xs text-ink-light">
                Register or log in using your email to begin tracking your edge.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-surface border border-hairline rounded overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);
