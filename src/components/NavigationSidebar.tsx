import React from 'react';
import { Home, Search, PlusSquare, Send, Heart, User, LogOut, Sparkles } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

interface NavigationSidebarProps {
  onOpenNotifications?: () => void;
  onOpenAuth?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  onOpenNotifications,
  onOpenAuth,
}) => {
  const { activeTab, setActiveTab, setIsCreateOpen, unreadDmCount } = useSocial();
  const { currentUser, logout, isFirebaseActive } = useAuth();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => setActiveTab('home'),
      active: activeTab === 'home',
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Search,
      action: () => setActiveTab('explore'),
      active: activeTab === 'explore',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: Send,
      action: () => setActiveTab('messages'),
      active: activeTab === 'messages',
      badge: unreadDmCount,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Heart,
      action: onOpenNotifications,
      active: false,
      hasDot: true,
    },
    {
      id: 'create',
      label: 'Create',
      icon: PlusSquare,
      action: () => setIsCreateOpen(true),
      active: false,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      action: () => setActiveTab('profile'),
      active: activeTab === 'profile',
      customIcon: currentUser ? (
        <div
          className={`w-6 h-6 rounded-full overflow-hidden border ${
            activeTab === 'profile' ? 'border-white ring-1 ring-white' : 'border-neutral-700'
          }`}
        >
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.username}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 px-5 py-7 border-r border-neutral-900 bg-black select-none z-40">
      {/* Top Logo */}
      <div>
        <div
          onClick={() => setActiveTab('home')}
          className="cursor-pointer mb-10 px-2 py-1 active:opacity-75 transition-opacity"
        >
          <span className="text-2xl font-light tracking-[0.3em] text-white uppercase font-sans">
            FLUID
          </span>
          <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-mono mt-0.5">
            BY ECHO
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-150 active:scale-95 group text-left ${
                  item.active
                    ? 'font-semibold text-white bg-neutral-900/60'
                    : 'font-normal text-neutral-300 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {item.customIcon ? (
                    item.customIcon
                  ) : (
                    <Icon
                      className={`w-[23px] h-[23px] transition-transform group-hover:scale-105 ${
                        item.active ? 'stroke-[2.2] text-white' : 'stroke-[1.8]'
                      }`}
                    />
                  )}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 bg-[#FF3040] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-black">
                      {item.badge}
                    </span>
                  ) : null}
                  {item.hasDot && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF3040]" />
                  )}
                </div>
                <span className="text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="pt-4 border-t border-neutral-900 flex flex-col gap-3">
        {/* User preview badge */}
        {currentUser && (
          <div
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-900/50 cursor-pointer transition-colors"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-9 h-9 rounded-full object-cover border border-neutral-800"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-white truncate flex items-center gap-1">
                @{currentUser.username}
                {currentUser.isVerified && (
                  <span className="text-sky-400 text-[10px]">●</span>
                )}
              </span>
              <span className="text-[11px] text-neutral-400 truncate">
                {currentUser.displayName}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              title="Sign Out"
              className="text-neutral-500 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Attribution */}
        <div className="px-2 text-[10px] text-neutral-500 font-mono tracking-wider">
          <div className="uppercase">ECHO Intelligence</div>
          <div className="text-neutral-600">v2.5 OLED Native · {isFirebaseActive ? 'Cloud Live' : 'Sandbox Ready'}</div>
        </div>
      </div>
    </aside>
  );
};
