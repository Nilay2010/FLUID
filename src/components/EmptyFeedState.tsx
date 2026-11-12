import React from 'react';
import { PlusCircle, Compass, Radio, Sparkles, UserPlus } from 'lucide-react';
import { useSocial } from '../context/SocialContext';

export const EmptyFeedState: React.FC = () => {
  const { setIsCreateOpen, setActiveTab, setFeedMode } = useSocial();

  return (
    <div className="py-14 px-5 text-center flex flex-col items-center select-none space-y-6">
      {/* Decorative Minimal Icon */}
      <div className="w-16 h-16 rounded-3xl bg-[#141416] border border-neutral-800 flex items-center justify-center text-white shadow-2xl relative">
        <Sparkles className="w-7 h-7 text-neutral-300 stroke-[1.8]" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
      </div>

      {/* Copy */}
      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Fluid is waiting for your first moment.
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Zero simulated accounts. Create a post, discover real creators in Explore, or switch to your External Pulse feed.
        </p>
      </div>

      {/* Action Options */}
      <div className="w-full max-w-xs space-y-2.5 pt-1">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full h-11 bg-white hover:bg-neutral-100 text-black text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.2]" />
          <span>Create First Post</span>
        </button>

        <button
          onClick={() => setActiveTab('explore')}
          className="w-full h-11 bg-[#18181A] hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4 text-neutral-400 stroke-[2]" />
          <span>Discover Real Creators in Explore</span>
        </button>

      </div>
    </div>
  );
};
