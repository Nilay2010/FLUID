import React from 'react';
import { X, Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { followingSet, toggleFollowUser, setCommentsPostId } = useSocial();

  if (!isOpen || !currentUser) return null;

  // Zero Fake Data Rule: Pure empty notifications array until real users interact
  const notifications: any[] = [];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-[420px] bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-black/60">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-bold text-white tracking-tight">Notifications</span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-full bg-neutral-900 border border-neutral-800">
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* List / Empty State */}
        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <Bell className="w-5 h-5 text-neutral-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">All caught up</h3>
                <p className="text-xs text-neutral-500 max-w-[260px] mx-auto">
                  When real creators like, comment, or follow you on Fluid, their activities will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-900/60">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-center justify-between py-3">
                  {/* notification item */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
