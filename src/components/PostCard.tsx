import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, Volume2 } from 'lucide-react';
import { Post } from '../types';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { UrlEmbedCard } from './UrlEmbedCard';
import { triggerHaptic } from '../services/haptics';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { toggleLikePost, toggleBookmarkPost, deletePost, setCommentsPostId, setSharePost } = useSocial();
  const { currentUser } = useAuth();

  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const isAuthor = currentUser ? currentUser.uid === post.authorId : false;

  const handleImageTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      triggerHaptic('double');
      if (!post.isLiked) {
        toggleLikePost(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    setLastTap(now);
  };

  return (
    <article className="w-full bg-black py-4 px-3 sm:px-4 select-none">
      {/* Floating Canvas Container with Ambient Backlight & Outer Glow */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0A0A0A] shadow-[0_10px_40px_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.9)] group">
        {/* Ambient Backlight Glow behind image */}
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900/40 via-transparent to-neutral-800/30 opacity-70 blur-2xl pointer-events-none" />

        {/* Media Container */}
        <div
          className="relative w-full overflow-hidden cursor-pointer"
          onClick={handleImageTap}
        >
          <img
            src={post.imageUrl}
            alt={post.caption || 'Fluid feed post'}
            className={`w-full ${post.aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-square'} object-cover transition-transform duration-500 group-hover:scale-[1.02]`}
            referrerPolicy="no-referrer"
          />

          {/* Double-tap spring heart burst */}
          {showHeartBurst && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-heart-burst z-30">
              <Heart className="w-24 h-24 fill-[#FF3040] text-[#FF3040] drop-shadow-2xl" />
            </div>
          )}

          {/* 1. Overlay Author Pill (Top-Left) */}
          <div className="absolute top-3.5 left-3.5 z-20">
            <div className="backdrop-blur-md bg-black/60 border border-white/15 rounded-full pl-1.5 pr-3.5 py-1.5 flex items-center gap-2.5 shadow-xl">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/30 shrink-0">
                <img
                  src={post.authorAvatarUrl}
                  alt={post.authorUsername}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs tracking-tight text-white truncate max-w-[120px]">
                    @{post.authorUsername}
                  </span>
                  {post.authorVerified && <span className="text-sky-400 text-[10px]">●</span>}
                </div>
                {post.location && (
                  <span className="text-[9px] text-neutral-400 tracking-tight truncate max-w-[120px]">
                    {post.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Options Menu Button (Top-Right) */}
          <div className="absolute top-3.5 right-3.5 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsMenu(!showOptionsMenu);
              }}
              aria-label="Post options"
              className="p-2 rounded-full backdrop-blur-md bg-black/60 border border-white/15 text-white hover:bg-black/80 active:scale-90 transition-all cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4 stroke-[2]" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-10 z-30 bg-[#1C1C1E] border border-neutral-800 rounded-xl shadow-2xl py-1 w-36 text-xs text-white">
                {isAuthor && (
                  <button
                    onClick={() => {
                      deletePost(post.id);
                      setShowOptionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[#FF3040] hover:bg-neutral-800/80 transition-colors text-left font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </button>
                )}
                <button
                  onClick={() => {
                    setSharePost(post);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-neutral-800/80 transition-colors text-left"
                >
                  <Send className="w-4 h-4 -rotate-12" />
                  Share Post
                </button>
                <button
                  onClick={() => setShowOptionsMenu(false)}
                  className="w-full px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors text-left"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* 2. Floating Action Pill (HUD) (Bottom-Right) */}
          <div className="absolute bottom-4 right-4 z-20">
            <div className="backdrop-blur-md bg-black/75 border border-white/15 rounded-full px-4 py-2 flex items-center gap-3.5 shadow-2xl">
              {/* Like Heart */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLikePost(post.id);
                }}
                className="flex items-center gap-1.5 text-white active:scale-90 transition-transform cursor-pointer"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    post.isLiked
                      ? 'fill-[#FF3040] text-[#FF3040] stroke-[#FF3040]'
                      : 'text-white stroke-[1.8] hover:text-neutral-300'
                  }`}
                />
                <span className="text-xs font-mono font-medium">{post.likesCount}</span>
              </button>

              <div className="w-px h-3.5 bg-white/20" />

              {/* Comment Bubble */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentsPostId(post.id);
                }}
                className="flex items-center gap-1.5 text-white active:scale-90 transition-transform cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 stroke-[1.8] -rotate-90 hover:text-neutral-300" />
                <span className="text-xs font-mono font-medium">{post.commentsCount}</span>
              </button>

              <div className="w-px h-3.5 bg-white/20" />

              {/* Share to DM */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSharePost(post);
                }}
                className="text-white active:scale-90 transition-transform cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[1.8] -rotate-12 hover:text-neutral-300" />
              </button>

              <div className="w-px h-3.5 bg-white/20" />

              {/* Bookmark Save */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmarkPost(post.id);
                }}
                className="text-white active:scale-90 transition-transform cursor-pointer"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    post.isBookmarked ? 'fill-white text-white' : 'stroke-[1.8]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Embedded Link Preview if present */}
        {post.embedData && (
          <div className="p-3 bg-black/40 border-t border-white/5">
            <UrlEmbedCard embed={post.embedData} compact={true} />
          </div>
        )}

        {/* 3. Editorial Caption Block */}
        <div className="p-4 sm:p-5 bg-[#0D0D0F] space-y-2 text-left">
          <div className="text-sm font-normal text-neutral-100 leading-relaxed font-sans">
            <span className="font-semibold text-white mr-2">@{post.authorUsername}</span>
            {isCaptionExpanded ? (
              <span>{post.caption}</span>
            ) : (
              <span>
                {post.caption.length > 110 ? (
                  <>
                    {post.caption.slice(0, 110)}...{' '}
                    <button
                      onClick={() => setIsCaptionExpanded(true)}
                      className="text-neutral-400 hover:text-white font-medium ml-0.5 text-xs underline cursor-pointer"
                    >
                      more
                    </button>
                  </>
                ) : (
                  post.caption
                )}
              </span>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Audio Track Tag if present */}
          {post.audioTrack && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 pt-1">
              <Volume2 className="w-3 h-3 text-neutral-500" />
              <span className="truncate">{post.audioTrack}</span>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-neutral-500 font-mono">
            <button
              onClick={() => setCommentsPostId(post.id)}
              className="hover:text-neutral-300 cursor-pointer"
            >
              {post.commentsCount > 0 ? `View all ${post.commentsCount} comments` : 'Add comment'}
            </button>
            <time className="uppercase tracking-wider">
              {post.createdAt.includes('T')
                ? new Date(post.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : post.createdAt}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
};
