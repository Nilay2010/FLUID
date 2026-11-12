import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-black py-16 px-6 select-none animate-in fade-in duration-300">
      <div className="w-full" />

      {/* Center Wordmark */}
      <div className="flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-light tracking-[0.35em] text-white uppercase translate-x-1 font-sans">
          FLUID
        </h1>
        <div className="h-[1px] w-8 bg-neutral-800 mt-4" />
      </div>

      {/* Meta-style bottom footer */}
      <div className="flex flex-col items-center gap-1.5 pb-6">
        <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-500 font-mono">
          FROM
        </span>
        <span className="text-xs font-semibold tracking-[0.18em] text-neutral-200 uppercase">
          ECHO Intelligence
        </span>
      </div>
    </div>
  );
};
