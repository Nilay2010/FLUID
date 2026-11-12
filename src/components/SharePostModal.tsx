import React, { useState } from 'react';
import { X, Search, Check, Send, Radio } from 'lucide-react';
import { useSocial } from '../context/SocialContext';

export const SharePostModal: React.FC = () => {
  const {
    sharePost,
    setSharePost,
    sharePulse,
    setSharePulse,
    chats,
    sharePostToChat,
    sharePulseToChat,
    setActiveTab,
    openChat,
  } = useSocial();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || '');

  const isOpen = !!sharePost || !!sharePulse;
  if (!isOpen) return null;

  const filteredChats = chats.filter((c) =>
    c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (!selectedChatId) return;

    if (sharePost) {
      sharePostToChat(selectedChatId, sharePost);
      setSharePost(null);
    } else if (sharePulse) {
      sharePulseToChat(selectedChatId, sharePulse);
      setSharePulse(null);
    }

    openChat(selectedChatId);
    setActiveTab('messages');
  };

  const handleClose = () => {
    setSharePost(null);
    setSharePulse(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-[420px] bg-[#141416] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <span className="text-sm font-semibold text-white tracking-tight">Share to Direct Message</span>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* Preview Miniature */}
        {sharePost && (
          <div className="p-3 bg-neutral-900/60 border-b border-neutral-800/80 flex items-center gap-3">
            <img
              src={sharePost.imageUrl}
              alt="Shared thumbnail"
              className="w-12 h-12 rounded-xl object-cover border border-neutral-700"
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold text-white truncate">
                Post by @{sharePost.authorUsername}
              </div>
              <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                {sharePost.caption}
              </div>
            </div>
          </div>
        )}

        {sharePulse && (
          <div className="p-3 bg-neutral-900/60 border-b border-neutral-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-sky-400">
              <Radio className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold text-white truncate">
                {sharePulse.sourceName}
              </div>
              <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                {sharePulse.title}
              </div>
            </div>
          </div>
        )}

        {/* Search Contact */}
        <div className="p-3 border-b border-neutral-800/60">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#1C1C1E] border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        {/* Recipients List */}
        <div className="overflow-y-auto p-2 space-y-1 max-h-[260px]">
          {filteredChats.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No active conversations yet. Start a chat from Explore.
            </div>
          ) : (
            filteredChats.map((thread) => {
              const isSelected = selectedChatId === thread.id;
              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedChatId(thread.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-neutral-800/80' : 'hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={thread.otherUser.avatarUrl}
                        alt={thread.otherUser.username}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                      />
                      {thread.otherUser.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-white">
                        {thread.otherUser.displayName}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        @{thread.otherUser.username}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-white border-white text-black' : 'border-neutral-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send Action */}
        <div className="p-3 border-t border-neutral-800 bg-[#161618]">
          <button
            onClick={handleSend}
            disabled={!selectedChatId}
            className="w-full h-11 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 cursor-pointer shadow-lg"
          >
            <Send className="w-4 h-4 -rotate-12" />
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
};
