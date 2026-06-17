import React from 'react';
import { HeartPulse } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
            <HeartPulse className="h-4 w-4" />
          </span>
          RehabPlay
        </div>
        <p className="text-center">Демо-проєкт. Гра має розважальний характер. © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};

export default Footer;
