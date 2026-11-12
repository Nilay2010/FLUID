import React from 'react';
import { Home, Search, PlusSquare, Send } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsCreateOpen, unreadDmCount } = useSocial();
  const { currentUser } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-neutral-900 flex items-center justify-around h-12 px-2 pb-safe md:hidden select-none">
      {/* Home */}
      <button
        onClick={() => setActiveTab('home')}
        aria-label="Home Feed"
        className={`flex items-center justify-center w-11 h-11 active:scale-90 transition-transform duration-100 ease-out ${
          activeTab === 'home' ? 'text-white' : 'text-neutral-400'
        }`}
      >
        <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-white stroke-white' : 'stroke-[1.8]'}`} />
      </button>

      {/* Explore */}
      <button
        onClick={() => setActiveTab('explore')}
        aria-label="Explore & Search"
        className={`flex items-center justify-center w-11 h-11 active:scale-90 transition-transform duration-100 ease-out ${
          activeTab === 'explore' ? 'text-white' : 'text-neutral-400'
        }`}
      >
        <Search className={`w-6 h-6 ${activeTab === 'explore' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
      </button>

      {/* Create */}
      <button
        onClick={() => setIsCreateOpen(true)}
        aria-label="Create Post"
        className="flex items-center justify-center w-11 h-11 text-white active:scale-90 transition-transform duration-100 ease-out"
      >
        <PlusSquare className="w-6 h-6 stroke-[1.8]" />
      </button>

      {/* Messages */}
      <button
        onClick={() => setActiveTab('messages')}
        aria-label="Direct Messages"
        className={`relative flex items-center justify-center w-11 h-11 active:scale-90 transition-transform duration-100 ease-out ${
          activeTab === 'messages' ? 'text-white' : 'text-neutral-400'
        }`}
      >
        <Send className={`w-[22px] h-[22px] -rotate-12 ${activeTab === 'messages' ? 'fill-white stroke-white' : 'stroke-[1.8]'}`} />
        {unreadDmCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF3040]" />
        )}
      </button>

      {/* Profile */}
      <button
        onClick={() => setActiveTab('profile')}
        aria-label="Profile"
        className="flex items-center justify-center w-11 h-11 active:scale-90 transition-transform duration-100 ease-out"
      >
        <div
          className={`w-6 h-6 rounded-full overflow-hidden border ${
            activeTab === 'profile' ? 'border-white ring-1 ring-white' : 'border-neutral-700'
          }`}
        >
          {currentUser ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800" />
          )}
        </div>
      </button>
    </nav>
  );
};
