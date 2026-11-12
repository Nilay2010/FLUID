import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

export const LiveMomentsBar: React.FC = () => {
  const { stories, setActiveStoryIndex, setIsCreateOpen } = useSocial();
  const { currentUser } = useAuth();

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-4 px-4 bg-black flex items-center gap-3 select-none">
      {/* Create / Your Moment Capsule */}
      {currentUser && (
        <div
          onClick={() => {
            const userStoryIndex = stories.findIndex((s) => s.authorId === currentUser.uid);
            if (userStoryIndex !== -1) {
              setActiveStoryIndex(userStoryIndex);
            } else {
              setIsCreateOpen(true);
            }
          }}
          className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 border border-neutral-800 bg-[#121212] flex flex-col justify-between p-2.5 cursor-pointer group hover:border-neutral-600 transition-all active:scale-95 shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />
          <img
            src={currentUser.avatarUrl}
            alt="Your moment"
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />

          {/* Top pill */}
          <div className="z-20 flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20">
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateOpen(true);
              }}
              className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          {/* Bottom badge */}
          <div className="z-20 text-left">
            <span className="text-[10px] font-semibold tracking-tight text-white block truncate">
              Your Moment
            </span>
            <span className="text-[9px] text-neutral-400 font-mono">Add live</span>
          </div>
        </div>
      )}

      {/* Other Live Moments (Vertical Glass Capsules) */}
      {stories
        .filter((s) => !currentUser || s.authorId !== currentUser.uid)
        .map((story) => {
          const originalIndex = stories.findIndex((s) => s.id === story.id);
          return (
            <div
              key={story.id}
              onClick={() => setActiveStoryIndex(originalIndex)}
              className={`relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 bg-[#121212] flex flex-col justify-between p-2.5 cursor-pointer group transition-all active:scale-95 shadow-xl ${
                story.hasUnviewed
                  ? 'ring-2 ring-cyan-400/80 border-transparent shadow-cyan-950/40'
                  : 'border border-neutral-800'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 z-10" />
              <img
                src={story.mediaUrl || story.authorAvatarUrl}
                alt={story.authorUsername}
                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-300 filter blur-[0.3px]"
                referrerPolicy="no-referrer"
              />

              {/* Top avatar badge */}
              <div className="z-20 flex items-center">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 shadow-sm">
                  <img src={story.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Bottom username pill */}
              <div className="z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-2 py-1 text-left">
                <span className="text-[10px] font-medium text-white block truncate tracking-tight">
                  @{story.authorUsername}
                </span>
                <span className="text-[9px] text-neutral-400 font-mono block">
                  {story.createdAt || 'Live'}
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
};
