import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Heart,
  MessageCircle,
  X,
  Send,
  Clock,
  Hash,
  User as UserIcon,
  ArrowUpLeft,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { Post, UserProfile } from '../types';
import { triggerHaptic } from '../services/haptics';

interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'user' | 'tag' | 'text';
  subtitle?: string;
  avatarUrl?: string;
  timestamp: number;
}

export const ExploreView: React.FC = () => {
  const { posts, setCommentsPostId, toggleLikePost, startChatWithUser, followingSet, toggleFollowUser } =
    useSocial();
  const { currentUser, searchRegisteredUsers } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [inspectedPost, setInspectedPost] = useState<Post | null>(null);
  const [matchedCreators, setMatchedCreators] = useState<UserProfile[]>([]);
  const [isSearchingCreators, setIsSearchingCreators] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const storageKey = `fluid_search_history_${currentUser?.uid || 'default'}`;

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(searchHistory));
    } catch {
      // ignore storage errors
    }
  }, [searchHistory, storageKey]);

  // Close search history dropdown when clicking outside the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['All', 'Architecture', 'Editorial', 'Acoustics', 'Nordic', 'Studio'];

  const addSearchHistoryItem = (item: {
    query: string;
    type?: 'user' | 'tag' | 'text';
    subtitle?: string;
    avatarUrl?: string;
  }) => {
    const trimmed = item.query.trim();
    if (!trimmed) return;

    const inferredType: 'user' | 'tag' | 'text' =
      item.type ||
      (trimmed.startsWith('#')
        ? 'tag'
        : trimmed.startsWith('@')
        ? 'user'
        : 'text');

    const normalizedQuery = trimmed.toLowerCase();

    setSearchHistory((prev) => {
      const filtered = prev.filter((existing) => existing.query.toLowerCase() !== normalizedQuery);
      const newItem: SearchHistoryItem = {
        id: `sh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        query: trimmed,
        type: inferredType,
        subtitle:
          item.subtitle ||
          (inferredType === 'tag'
            ? 'Hashtag'
            : inferredType === 'user'
            ? 'Creator handle'
            : 'Recent search'),
        avatarUrl: item.avatarUrl,
        timestamp: Date.now(),
      };
      return [newItem, ...filtered].slice(0, 12);
    });
  };

  const removeHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setSearchHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllHistory = () => {
    triggerHaptic('medium');
    setSearchHistory([]);
  };

  // Search registered creators in Firestore when query changes
  useEffect(() => {
    let active = true;
    const cleanTerm = searchQuery.trim().replace(/^[@#]/, '');
    if (!cleanTerm || cleanTerm.length < 2) {
      setMatchedCreators([]);
      setIsSearchingCreators(false);
      return;
    }

    setIsSearchingCreators(true);
    const timer = setTimeout(async () => {
      const results = await searchRegisteredUsers(cleanTerm);
      if (!active) return;
      setMatchedCreators(results);
      setIsSearchingCreators(false);
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, searchRegisteredUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    triggerHaptic('light');
    addSearchHistoryItem({ query: searchQuery.trim() });
    setIsSearchFocused(false);
  };

  const handleSelectHistoryItem = (item: SearchHistoryItem) => {
    triggerHaptic('light');
    setSearchQuery(item.query);
    addSearchHistoryItem({
      query: item.query,
      type: item.type,
      subtitle: item.subtitle,
      avatarUrl: item.avatarUrl,
    });
    setIsSearchFocused(false);
  };

  const filteredPosts = posts.filter((p) => {
    const cleanQuery = searchQuery.trim().toLowerCase().replace(/^[@#]/, '');
    const matchesSearch =
      !cleanQuery ||
      p.caption.toLowerCase().includes(cleanQuery) ||
      p.authorUsername.toLowerCase().includes(cleanQuery) ||
      (p.location && p.location.toLowerCase().includes(cleanQuery)) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(cleanQuery)));

    if (!matchesSearch) return false;
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Architecture')
      return p.caption.toLowerCase().includes('architecture') || p.location?.includes('Kyoto');
    if (activeCategory === 'Editorial')
      return p.caption.toLowerCase().includes('fashion') || p.authorUsername.includes('atelier');
    if (activeCategory === 'Acoustics')
      return p.caption.toLowerCase().includes('sound') || p.caption.toLowerCase().includes('audio');
    if (activeCategory === 'Nordic')
      return p.caption.toLowerCase().includes('nordic') || p.caption.toLowerCase().includes('coast');
    if (activeCategory === 'Studio') return p.caption.toLowerCase().includes('studio');
    return true;
  });

  // Extract popular tags from real posts for quick discovery when history is empty
  const recentPostTags = Array.from(
    new Set(posts.flatMap((p) => p.tags || []).map((t) => t.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white select-none pb-16 md:pb-6">
      {/* Search Header & History Container */}
      <div
        ref={searchContainerRef}
        className="sticky top-0 z-30 bg-black/95 backdrop-blur-md px-3 pt-3 pb-2 border-b border-neutral-900 space-y-2.5"
      >
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                triggerHaptic('light');
                setIsSearchFocused(true);
              }}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators, @user_id, #tags..."
              className="w-full bg-[#161618] border border-neutral-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSearchQuery('');
                }}
                className="absolute right-2.5 p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSearchFocused && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsSearchFocused(false);
              }}
              className="text-xs font-medium text-neutral-300 hover:text-white px-1 cursor-pointer shrink-0"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Instagram-Style Recent Search History Dropdown */}
        {isSearchFocused && (
          <div className="bg-[#121214] border border-neutral-800/90 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800/80">
              <span className="text-xs font-semibold text-white">Recent</span>
              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllHistory}
                  className="text-xs font-semibold text-[#0095F6] hover:text-sky-300 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <div className="px-4 py-6 text-center space-y-3">
                <p className="text-xs text-neutral-500">No recent searches.</p>
                {recentPostTags.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {recentPostTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const formatted = `#${tag}`;
                          setSearchQuery(formatted);
                          addSearchHistoryItem({
                            query: formatted,
                            type: 'tag',
                            subtitle: 'Hashtag',
                          });
                          setIsSearchFocused(false);
                        }}
                        className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white hover:border-neutral-700 cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-900/60">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className="flex items-center justify-between px-3.5 py-2.5 hover:bg-neutral-900/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.query}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-800 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-300">
                          {item.type === 'tag' ? (
                            <Hash className="w-4 h-4 stroke-[2]" />
                          ) : item.type === 'user' ? (
                            <UserIcon className="w-4 h-4 stroke-[2]" />
                          ) : (
                            <Clock className="w-4 h-4 stroke-[1.8]" />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 text-left">
                        <span className="text-xs font-semibold text-white truncate">
                          {item.query}
                        </span>
                        {item.subtitle && (
                          <span className="text-[11px] text-neutral-400 truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setSearchQuery(item.query);
                        }}
                        title="Fill search box"
                        className="p-1.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        <ArrowUpLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => removeHistoryItem(item.id, e)}
                        aria-label={`Remove ${item.query} from search history`}
                        className="p-1.5 text-neutral-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCategory(cat);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matched Registered Users Section */}
      {isSearchingCreators ? (
        <div className="border-b border-neutral-900 bg-neutral-950/70 p-3 text-xs text-neutral-500">
          Searching creators...
        </div>
      ) : (
        matchedCreators.length > 0 && (
          <div className="border-b border-neutral-900 bg-neutral-950/70 p-3 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1 text-left">
              Registered Creators ({matchedCreators.length})
            </div>
            <div className="space-y-1.5">
              {matchedCreators.map((creator) => {
                const isFollowing = followingSet.has(creator.username);
                return (
                  <div
                    key={creator.uid}
                    onClick={() => {
                      addSearchHistoryItem({
                        query: `@${creator.username}`,
                        type: 'user',
                        subtitle: creator.displayName,
                        avatarUrl: creator.avatarUrl,
                      });
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#141416] border border-neutral-800/80 hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 text-left">
                      <img
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        className="w-9 h-9 rounded-full object-cover border border-neutral-700 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate">
                          {creator.displayName}
                        </span>
                        <span className="text-[11px] text-neutral-400 truncate">
                          @{creator.username}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addSearchHistoryItem({
                            query: `@${creator.username}`,
                            type: 'user',
                            subtitle: creator.displayName,
                            avatarUrl: creator.avatarUrl,
                          });
                          toggleFollowUser(creator.username);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all cursor-pointer ${
                          isFollowing
                            ? 'bg-neutral-800 text-white border border-neutral-700'
                            : 'bg-[#0095F6] text-white hover:bg-[#1877F2]'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addSearchHistoryItem({
                            query: `@${creator.username}`,
                            type: 'user',
                            subtitle: creator.displayName,
                            avatarUrl: creator.avatarUrl,
                          });
                          startChatWithUser({
                            uid: creator.uid,
                            username: creator.username,
                            displayName: creator.displayName,
                            avatarUrl: creator.avatarUrl,
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold flex items-center gap-1 hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer"
                      >
                        <Send className="w-3 h-3 -rotate-12" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* 3-Column Square Grid */}
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            onClick={() => {
              triggerHaptic('light');
              if (searchQuery.trim()) {
                addSearchHistoryItem({ query: searchQuery.trim() });
              }
              setInspectedPost(post);
            }}
            className="relative aspect-square bg-neutral-950 overflow-hidden cursor-pointer group"
          >
            <img
              src={post.imageUrl}
              alt={post.caption}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-semibold text-xs">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 fill-white text-white" />
                {post.likesCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4 fill-white text-white -rotate-90" />
                {post.commentsCount}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Modal */}
      {inspectedPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="relative w-full max-w-[420px] bg-[#121212] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={inspectedPost.authorAvatarUrl}
                  alt={inspectedPost.authorUsername}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-white">
                  @{inspectedPost.authorUsername}
                </span>
              </div>
              <button
                onClick={() => setInspectedPost(null)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            <img
              src={inspectedPost.imageUrl}
              alt={inspectedPost.caption}
              className="w-full aspect-square object-cover"
            />

            <div className="p-3.5 space-y-2 text-left">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleLikePost(inspectedPost.id)}
                  className="active:scale-90 transition-transform cursor-pointer"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      inspectedPost.isLiked
                        ? 'fill-[#FF3040] text-[#FF3040]'
                        : 'text-white'
                    }`}
                  />
                </button>
                <button
                  onClick={() => {
                    setCommentsPostId(inspectedPost.id);
                    setInspectedPost(null);
                  }}
                  className="active:scale-90 transition-transform cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 text-white -rotate-90" />
                </button>
              </div>

              <div className="text-xs font-semibold text-white">
                {inspectedPost.likesCount} likes
              </div>

              <div className="text-xs text-neutral-300 leading-snug">
                <span className="font-semibold text-white mr-1.5">
                  @{inspectedPost.authorUsername}
                </span>
                {inspectedPost.caption}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
