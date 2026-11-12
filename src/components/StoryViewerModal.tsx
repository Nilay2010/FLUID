import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, Heart, Send } from 'lucide-react';
import { useSocial } from '../context/SocialContext';

export const StoryViewerModal: React.FC = () => {
  const { stories, activeStoryIndex, setActiveStoryIndex, markStoryViewed, sendMessage, openChat } = useSocial();
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);

  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  const handleNext = useCallback(() => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
    } else {
      setActiveStoryIndex(null);
    }
  }, [activeStoryIndex, stories.length, setActiveStoryIndex]);

  const handlePrev = useCallback(() => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [activeStoryIndex, setActiveStoryIndex]);

  // Mark viewed on load
  const storyId = currentStory?.id;
  const isUnviewed = currentStory?.hasUnviewed;

  useEffect(() => {
    if (storyId && isUnviewed) {
      markStoryViewed(storyId);
    }
  }, [storyId, isUnviewed, markStoryViewed]);

  useEffect(() => {
    setProgress(0);
  }, [activeStoryIndex]);

  // Timer loop for progress bar
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const DURATION = 5000; // 5 seconds
    const STEP = 50;

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (STEP / DURATION) * 100;
      });
    }, STEP);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentStory, isPaused, handleNext]);

  if (!currentStory || activeStoryIndex === null) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    // Route reply to author's chat
    const targetChatId = currentStory.authorId === 'user_kai_nordic' ? 'chat_kai' : 'chat_mira';
    openChat(targetChatId);
    sendMessage(`Replying to your story: "${replyText.trim()}"`);
    setReplyText('');
    setActiveStoryIndex(null);
  };

  const handleDoubleTap = () => {
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none">
      <div className="relative w-full max-w-[440px] h-full max-h-[920px] bg-neutral-950 flex flex-col justify-between overflow-hidden sm:rounded-2xl border border-neutral-900 shadow-2xl">
        {/* Story Progress Bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((story, idx) => (
            <div key={story.id} className="h-0.5 flex-1 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width:
                    idx < activeStoryIndex
                      ? '100%'
                      : idx === activeStoryIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Top Author Header */}
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStory.authorAvatarUrl}
              alt={currentStory.authorUsername}
              className="w-8 h-8 rounded-full object-cover border border-white/20"
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-tight">
                {currentStory.authorUsername}
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">
                {currentStory.createdAt}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveStoryIndex(null)}
            aria-label="Close Story"
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Tap navigation zones */}
        <div
          className="absolute inset-0 z-10 flex"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Left tap (previous) */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          {/* Center (double tap to like) */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onDoubleClick={handleDoubleTap}
          />
          {/* Right tap (next) */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* Story Media Background */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img
            src={currentStory.mediaUrl}
            alt="Story media"
            className="w-full h-full object-cover select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />

          {/* Double-tap Heart burst */}
          {showHeartOverlay && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-heart-burst z-40">
              <Heart className="w-24 h-24 fill-[#FF3040] text-[#FF3040] drop-shadow-xl" />
            </div>
          )}

          {/* Story Caption if present */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 z-20 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs text-neutral-100">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Story Bottom Reply Bar */}
        <div className="relative z-30 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-3">
          <form onSubmit={handleSendReply} className="flex-1 flex items-center">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentStory.authorUsername}...`}
              className="w-full h-11 bg-neutral-900/90 border border-neutral-700/80 rounded-full px-4 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-white transition-colors"
            />
          </form>

          <button
            onClick={() => {
              setShowHeartOverlay(true);
              setTimeout(() => setShowHeartOverlay(false), 900);
            }}
            aria-label="Like story"
            className="w-11 h-11 flex items-center justify-center text-white active:scale-75 transition-transform"
          >
            <Heart className="w-6 h-6 stroke-[1.8] hover:text-[#FF3040]" />
          </button>

          <button
            onClick={handleSendReply}
            aria-label="Send reply"
            className="w-11 h-11 flex items-center justify-center text-white active:scale-75 transition-transform"
          >
            <Send className="w-5 h-5 -rotate-12 stroke-[1.8]" />
          </button>
        </div>
      </div>
    </div>
  );
};
