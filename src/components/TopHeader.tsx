import React from 'react';
import { Heart, Send, WifiOff } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

interface TopHeaderProps {
  onOpenNotifications?: () => void;
  hasUnreadNotifications?: boolean;
  onHeaderLogoClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenNotifications,
  hasUnreadNotifications = true,
  onHeaderLogoClick,
}) => {
  const { setActiveTab, unreadDmCount, isRefreshing, feedMode, setFeedMode, isOffline } = useSocial();
  const { currentUser } = useAuth();

  const handleLogoClick = () => {
    setActiveTab('home');
    if (onHeaderLogoClick) {
      onHeaderLogoClick();
    }
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/85 border-b border-[#1F1F1F] px-4 py-2.5 flex items-center justify-between select-none">
      {/* Top-Left: Exact Brand Wordmark */}
      <div
        onClick={handleLogoClick}
        className="cursor-pointer active:opacity-70 transition-opacity flex flex-col text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl font-light tracking-[0.35em] text-white uppercase inline-block">
            FLUID
          </span>
          {isRefreshing && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          )}
          {isOffline && (
            <span
              title="Offline Mode — Viewing cached feed from IndexedDB"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-medium text-amber-300"
            >
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </span>
          )}
        </div>
        <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-neutral-500 mt-0.5">
          BY ECHO
        </span>
      </div>

      {/* Center: Sleek Pill Feed Mode Switcher */}
      <div className="hidden sm:flex items-center bg-[#121212] p-1 rounded-full border border-white/10 shadow-lg">
        <button
          onClick={() => setFeedMode('for_you')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            feedMode === 'for_you'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Flow
        </button>
        <button
          onClick={() => setFeedMode('following')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            feedMode === 'following'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Following
        </button>
      </div>

      {/* Top-Right: Active User Capsule & Triggers */}
      <div className="flex items-center gap-3">
        {currentUser && (
          <div
            onClick={() => setActiveTab('profile')}
            className="hidden md:flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[#121212] border border-white/10 cursor-pointer hover:border-white/20 transition-all"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-xs font-medium text-neutral-200 truncate max-w-[100px]">
              @{currentUser.username}
            </span>
          </div>
        )}

        {/* Notification Heart */}
        <button
          onClick={onOpenNotifications}
          aria-label="Activity Notifications"
          className="relative text-white active:scale-90 transition-transform duration-100 ease-out p-1.5 rounded-full bg-[#121212] border border-white/10 hover:border-white/20 cursor-pointer"
        >
          <Heart className="w-4 h-4 stroke-[1.8]" />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF3040]" />
          )}
        </button>

        {/* Direct Messages Icon */}
        <button
          onClick={() => setActiveTab('messages')}
          aria-label="Direct Messages"
          className="relative text-white active:scale-90 transition-transform duration-100 ease-out p-1.5 rounded-full bg-[#121212] border border-white/10 hover:border-white/20 cursor-pointer"
        >
          <Send className="w-4 h-4 stroke-[1.8] -rotate-12" />
          {unreadDmCount > 0 && (
            <span className="absolute -top-0.5 -right-1 bg-[#FF3040] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-black">
              {unreadDmCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
