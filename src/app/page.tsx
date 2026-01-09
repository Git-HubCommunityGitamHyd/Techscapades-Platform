import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        {/* Logo */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Campus Treasure Hunt
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-400 max-w-md mx-auto">
          Explore, solve riddles, scan QR codes, and race against other teams in this exciting adventure!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/login">
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 text-lg">
              Join Hunt →
            </button>
          </Link>
          <Link href="/admin-login">
            <button className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all duration-200 text-lg">
              Admin Login
            </button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-semibold text-white mb-2">Mobile-First</h3>
            <p className="text-sm text-slate-400">Scan QR codes directly from your phone with our camera integration</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-white mb-2">Real-Time</h3>
            <p className="text-sm text-slate-400">Track progress and scores with live updates as teams advance</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-semibold text-white mb-2">Competitive</h3>
            <p className="text-sm text-slate-400">Leaderboard and scoring system to crown the winning team</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-16 text-center text-sm text-slate-500">
        <p>Campus Treasure Hunt Platform</p>
      </footer>
    </div>
  );
}
