import React from 'react';
import { Plus } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

export const StoriesBar: React.FC = () => {
  const { stories, setActiveStoryIndex, setIsCreateOpen } = useSocial();
  const { currentUser } = useAuth();

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-3 px-3 border-b border-neutral-900 bg-black flex items-center gap-3.5 select-none">
      {/* Current User Story / Add Story button */}
      {currentUser && (
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div
            onClick={() => {
              const userStoryIndex = stories.findIndex((s) => s.authorId === currentUser.uid);
              if (userStoryIndex !== -1) {
                setActiveStoryIndex(userStoryIndex);
              } else {
                setIsCreateOpen(true);
              }
            }}
            className="relative w-16 h-16 rounded-full p-[2px] transition-transform active:scale-95"
          >
            <div className="w-full h-full rounded-full overflow-hidden border border-neutral-800">
              <img
                src={currentUser.avatarUrl}
                alt="Your story"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateOpen(true);
              }}
              aria-label="Add story"
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center border-2 border-black hover:scale-110 transition-transform"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          </div>
          <span className="text-[11px] text-neutral-400 font-normal tracking-tight max-w-[62px] truncate">
            Your story
          </span>
        </div>
      )}

      {/* Other Stories */}
      {stories
        .filter((s) => !currentUser || s.authorId !== currentUser.uid)
        .map((story) => {
          const originalIndex = stories.findIndex((s) => s.id === story.id);
          return (
            <div
              key={story.id}
              onClick={() => setActiveStoryIndex(originalIndex)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2.5px] ${
                  story.hasUnviewed
                    ? 'bg-gradient-to-tr from-neutral-200 via-neutral-100 to-white'
                    : 'border border-neutral-800'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-black p-[2px]">
                  <img
                    src={story.authorAvatarUrl}
                    alt={story.authorUsername}
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <span className="text-[11px] text-neutral-300 font-normal tracking-tight max-w-[62px] truncate">
                {story.authorUsername}
              </span>
            </div>
          );
        })}
    </div>
  );
};
