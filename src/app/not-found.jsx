'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Soft Glow / Unique Gradient Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 max-w-lg w-full text-center space-y-8 p-8 md:p-12 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl">
        
        {/* Animated Visual Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping duration-1000" />
          <div className="relative w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner">
            <Compass className="w-10 h-10 text-indigo-400 animate-spin-slow" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
            Error 404
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            পেজটি পাওয়া যায়নি
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            আপনি যে পেজটি খুঁজছেন তা মুছে ফেলা হয়েছে, নাম পরিবর্তন করা হয়েছে অথবা সাময়িকভাবে অনুপলব্ধ।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            পেছনে যান
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all duration-200 active:scale-95"
          >
            <Home className="w-4 h-4" />
            হোমপেজ
          </Link>
        </div>

        {/* Subtle Footer Note */}
        <div className="pt-4 border-t border-slate-800/60">
          <p className="text-xs text-slate-500">
            সমস্যাটি বারবার হলে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
}