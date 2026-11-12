import React from 'react';
import { Sparkles, Users } from 'lucide-react';
import { useSocial } from '../context/SocialContext';

export const FeedFilterBar: React.FC = () => {
  const { feedMode, setFeedMode } = useSocial();

  return (
    <div className="border-b border-neutral-900 bg-black/95 backdrop-blur-md sticky top-12 z-20 select-none">
      {/* Primary Segment Toggle: Following | For You */}
      <div className="flex items-center px-4 pt-2.5 pb-2 justify-between">
        <div className="flex items-center gap-1 bg-[#141416] p-1 rounded-2xl border border-neutral-800/80 w-full">
          <button
            onClick={() => setFeedMode('following')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              feedMode === 'following'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Following</span>
          </button>

          <button
            onClick={() => setFeedMode('for_you')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              feedMode === 'for_you'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>For You</span>
          </button>
        </div>
      </div>
    </div>
  );
};
