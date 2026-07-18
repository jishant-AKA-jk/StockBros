import { createClient } from '@/lib/supabase/server'
import { AuthForm } from '@/components'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col page-reveal font-sans">
      {/* Hero Section */}
      <header className="border-b border-neutral-900 bg-neutral-950/50 backdrop-blur py-6">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-lg tracking-wider">SB</div>
            <span className="text-xl font-bold tracking-tight text-white">StockBros</span>
          </div>
          {user && (
            <a 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow"
            >
              Go to Dashboard &rarr;
            </a>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Copy */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <span className="text-blue-500 text-xs font-semibold uppercase tracking-widest bg-blue-950/50 border border-blue-900/50 px-3 py-1.5 rounded-full inline-block">
              EOD Swing Trading Analytics Platform
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Disciplined swing trading, backed by clear analytics.
            </h1>
            <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl">
              StockBros is designed for systematic swing traders who operate on daily and weekly charts. Log your ideas, screen the market, visualize setups, and measure your edge without noise.
            </p>
          </div>

          {/* Core Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
              <h3 className="font-bold text-white text-base">Multi-Symbol Chart Grid</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Render daily and weekly charts with 10/20 EMA technical overlays synced globally.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
              <h3 className="font-bold text-white text-base">Rule-Based Screener</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Scan for EMA Stacks, Tight Consolidations, Volume Surges, and Relative Strength.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
              <h3 className="font-bold text-white text-base">Watchlist Tagging</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Group candidates by tags (Momentum, Value, Dividend) to monitor development.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
              <h3 className="font-bold text-white text-base">Trading Ledger</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Log trades, save exit/entry setups, and automatically calculate exact R-multiples.
              </p>
            </div>
          </div>

          {/* Scope Limitations */}
          <div className="bg-amber-950/30 border border-amber-900/30 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">
              ⚠️ Platform Disclaimers & Limits (What StockBros Is Not)
            </h4>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc pl-5">
              <li>
                <strong>No Live Trading:</strong> You cannot place orders or execute broker trades directly from the platform.
              </li>
              <li>
                <strong>End-of-Day (EOD) Data:</strong> All calculations, scans, and chart bars are updated on a daily close-of-market basis.
              </li>
              <li>
                <strong>No Intraday / Real-Time Data:</strong> StockBros is NOT a platform for active day-trading or live market feeds.
              </li>
              <li>
                <strong>No Investment Advice:</strong> All metrics are historical mathematical calculations. Users are solely responsible for their trading decisions.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          {user ? (
            <Card className="p-8 bg-neutral-900 border border-neutral-800 text-center space-y-6 rounded-xl shadow-xl">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-900/50 border border-blue-800 text-blue-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-white">Already Signed In</h2>
                <p className="text-sm text-neutral-400">
                  Welcome back! You are logged in as <strong className="text-neutral-200">{user.email}</strong>.
                </p>
              </div>
              <div>
                <a 
                  href="/dashboard" 
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow"
                >
                  Go to Dashboard &rarr;
                </a>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <AuthForm />
              <p className="text-center text-xs text-neutral-500">
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
  <div className={`bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);
