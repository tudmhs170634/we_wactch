"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 flex flex-col">
      {/* Navbar placeholder */}
      <header className="w-full py-6 px-8 flex justify-between items-center border-b border-slate-800/60 backdrop-blur-md fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-white"
            >
              <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            We Watch
          </span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
          <a href="#" className="hover:text-indigo-400 transition-colors">
            Features
          </a>
          <a href="#" className="hover:text-indigo-400 transition-colors">
            How it works
          </a>
          <a href="#" className="hover:text-indigo-400 transition-colors">
            Pricing
          </a>
        </nav>
        <div className="flex gap-4">
          <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Log in
          </button>
          <button className="text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-indigo-400 mb-8 mt-10">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
            v1.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Watch together, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              no matter the distance.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Experience synchronized streaming with your friends in real-time.
            Highest quality WebRTC video and low-latency chat, all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button className="px-8 py-4 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
              Create a Room
            </button>
            <button className="px-8 py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg border border-slate-700 transition-all flex items-center justify-center">
              Join Existing Room
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
