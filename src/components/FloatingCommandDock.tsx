import React from 'react';
import { Home, Compass, Plus, Radio, MessageSquare, User, Bell } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

interface FloatingCommandDockProps {
  onOpenNotifications: () => void;
}

export const FloatingCommandDock: React.FC<FloatingCommandDockProps> = ({ onOpenNotifications }) => {
  const { activeTab, setActiveTab, setIsCreateOpen, unreadDmCount, setFeedMode, activeChat } = useSocial();
  const { currentUser } = useAuth();

  // Hide the floating command dock when an active chat conversation is open on mobile
  if (activeChat) {
    return null;
  }

  const navItems = [
    {
      id: 'home',
      label: 'Stream',
      icon: Home,
      onClick: () => {
        setActiveTab('home');
        setFeedMode('for_you');
      },
      isActive: activeTab === 'home',
    },
    {
      id: 'explore',
      label: 'Discover',
      icon: Compass,
      onClick: () => setActiveTab('explore'),
      isActive: activeTab === 'explore',
    },
    {
      id: 'create',
      label: 'Create',
      icon: Plus,
      onClick: () => setIsCreateOpen(true),
      isSpecial: true,
    },

    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      onClick: () => setActiveTab('messages'),
      isActive: activeTab === 'messages',
      badge: unreadDmCount > 0 ? unreadDmCount : undefined,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      onClick: () => setActiveTab('profile'),
      isActive: activeTab === 'profile',
      avatarUrl: currentUser?.avatarUrl,
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
      <div className="backdrop-blur-2xl bg-neutral-900/80 border border-white/15 rounded-full px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center gap-2 sm:gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                aria-label={item.label}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-white to-neutral-200 text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform cursor-pointer relative group"
              >
                <Icon className="w-5 h-5 stroke-[2.5]" />
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/90 border border-white/10 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-mono">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              aria-label={item.label}
              className={`relative p-3 rounded-full transition-all cursor-pointer group active:scale-90 ${
                item.isActive
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.avatarUrl ? (
                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/30">
                  <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <Icon className="w-5 h-5 stroke-[1.8]" />
              )}

              {item.badge && (
                <span className="absolute top-1 right-1 bg-[#FF3040] text-white text-[9px] font-bold h-3.5 min-w-[14px] px-0.5 rounded-full flex items-center justify-center border border-black">
                  {item.badge}
                </span>
              )}

              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/90 border border-white/10 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-mono">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
