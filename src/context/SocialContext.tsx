import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Post, Story, Comment, ChatThread, Message, ActiveTab, FeedFilterMode, SourceFilter, PulseItem, UrlEmbedData, UserProfile, UserNote } from '../types';
import { useAuth } from './AuthContext';
import { auth, db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../services/firebase';
import { triggerHaptic } from '../services/haptics';
import {
  readSyncCache,
  readOfflineCache,
  writeOfflineCache,
  enqueueOfflineMutation,
  consumeOfflineMutations,
} from '../services/offlineCache';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  limit,
  where,
} from 'firebase/firestore';

interface SocialContextType {
  posts: Post[];
  stories: Story[];
  chats: ChatThread[];
  activeChat: ChatThread | null;
  activeChatMessages: Message[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Feed segment & filters
  feedMode: FeedFilterMode;
  setFeedMode: (mode: FeedFilterMode) => void;
  sourceFilter: SourceFilter;
  setSourceFilter: (filter: SourceFilter) => void;
  pulseItems: PulseItem[];
  isPulseLoading: boolean;
  fetchPulseItems: () => Promise<void>;
  // For You scored items
  forYouFeed: (
    | { type: 'post'; data: Post }
    | { type: 'pulse'; data: PulseItem }
  )[];
  // Modals & Sheets
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  commentsPostId: string | null;
  setCommentsPostId: (postId: string | null) => void;
  sharePost: Post | null;
  setSharePost: (post: Post | null) => void;
  sharePulse: PulseItem | null;
  setSharePulse: (pulse: PulseItem | null) => void;
  activeStoryIndex: number | null;
  setActiveStoryIndex: (index: number | null) => void;
  // Actions
  toggleLikePost: (postId: string) => void;
  toggleBookmarkPost: (postId: string) => void;
  toggleLikePulse: (pulseId: string) => void;
  deletePost: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  getPostComments: (postId: string) => Comment[];
  createPost: (postData: {
    imageUrl: string;
    caption: string;
    aspectRatio: '1:1' | '4:5';
    location?: string;
    embedUrl?: string;
    embedData?: UrlEmbedData;
    crossPostedTo?: ('x' | 'instagram' | 'facebook')[];
    tags?: string[];
  }) => Promise<void>;
  markStoryViewed: (storyId: string) => void;
  openChat: (chatId: string) => void;
  closeChat: () => void;
  sendMessage: (text: string, sharedPost?: Post, sharedPulse?: PulseItem, embedData?: UrlEmbedData) => void;
  sharePostToChat: (chatId: string, post: Post) => void;
  sharePulseToChat: (chatId: string, pulse: PulseItem) => void;
  toggleFollowUser: (username: string) => void;
  startChatWithUser: (otherUser: { uid: string; username: string; displayName: string; avatarUrl: string }) => void;
  markChatAsRead: (chatId: string) => void;
  simulateRecipientRead: (chatId: string, messageId?: string) => void;
  isRecipientTyping: boolean;
  toggleMessageReaction: (chatId: string, messageId: string, emoji: string) => void;
  sendMediaMessage: (imageUrl: string, caption?: string) => void;
  sendVoiceMessage: (durationText: string) => void;
  deleteChatThread: (chatId: string) => void;
  notes: UserNote[];
  addUserNote: (text: string, musicTrack?: string) => void;
  refreshPosts: () => Promise<void>;
  isRefreshing: boolean;
  followingSet: Set<string>;
  followersList: UserProfile[];
  followingList: UserProfile[];
  fetchFollowersAndFollowing: () => Promise<void>;
  unreadDmCount: number;
  isOffline: boolean;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateUserProfile, recordSignal } = useAuth();

  // Navigation state
  const [activeTab, setActiveTabState] = useState<ActiveTab>('home');
  const [feedMode, setFeedModeState] = useState<FeedFilterMode>('following');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const setActiveTab = useCallback((tab: ActiveTab) => {
    triggerHaptic('light');
    setActiveTabState(tab);
  }, []);

  const setFeedMode = useCallback((mode: FeedFilterMode) => {
    triggerHaptic('light');
    setFeedModeState(mode);
  }, []);

  // Posts state with synchronous localStorage boot + IndexedDB hydration
  const [posts, setPosts] = useState<Post[]>(() => readSyncCache<Post[]>('fluid_posts', []));

  // Stories state with localStorage & IndexedDB cache
  const [stories, setStories] = useState<Story[]>(() => readSyncCache<Story[]>('fluid_stories', []));

  // Comments state with localStorage & IndexedDB cache
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>(() =>
    readSyncCache<Record<string, Comment[]>>('fluid_comments', {})
  );

  // Chats state with localStorage & IndexedDB cache
  const [chats, setChats] = useState<ChatThread[]>(() =>
    readSyncCache<ChatThread[]>('fluid_chats', [])
  );

  // Messages map state with localStorage & IndexedDB cache
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(() =>
    readSyncCache<Record<string, Message[]>>('fluid_messages', {})
  );

  // Instagram mobile notes status tray state
  const defaultNotes: UserNote[] = [
    {
      id: 'note_1',
      userId: 'u_elena',
      username: 'elena_rostova',
      displayName: 'Elena Rostova',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      noteText: '🎵 Listening to ambient mix',
      musicTrack: 'Fred again.. • Danielle',
      createdAt: '2h ago',
    },
    {
      id: 'note_2',
      userId: 'u_marcus',
      username: 'marcus_v',
      displayName: 'Marcus Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      noteText: '☕ Studio shoot in Soho',
      createdAt: '4h ago',
    },
    {
      id: 'note_3',
      userId: 'u_sofia',
      username: 'sofia_chen',
      displayName: 'Sofia Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      noteText: '✨ Late night editorial cuts',
      musicTrack: 'Overmono • Good Lies',
      createdAt: '5h ago',
    },
  ];

  const [notes, setNotes] = useState<UserNote[]>(() =>
    readSyncCache<UserNote[]>('fluid_user_notes', defaultNotes)
  );

  useEffect(() => {
    writeOfflineCache('fluid_user_notes', notes);
  }, [notes]);

  // External Pulse items with localStorage & IndexedDB offline cache
  const [pulseItems, setPulseItems] = useState<PulseItem[]>(() =>
    readSyncCache<PulseItem[]>('fluid_pulse_items', [])
  );
  const [isPulseLoading, setIsPulseLoading] = useState<boolean>(false);

  // Connectivity state
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  // Active chat in DMs
  const [activeChat, setActiveChat] = useState<ChatThread | null>(null);
  const [isRecipientTyping, setIsRecipientTyping] = useState<boolean>(false);

  // Modals
  const [isCreateOpen, setIsCreateOpenState] = useState(false);
  const [commentsPostId, setCommentsPostIdState] = useState<string | null>(null);
  const [sharePost, setSharePostState] = useState<Post | null>(null);
  const [sharePulse, setSharePulseState] = useState<PulseItem | null>(null);
  const [activeStoryIndex, setActiveStoryIndexState] = useState<number | null>(null);

  const setIsCreateOpen = useCallback((open: boolean) => {
    triggerHaptic(open ? 'medium' : 'light');
    setIsCreateOpenState(open);
  }, []);

  const setCommentsPostId = useCallback((postId: string | null) => {
    triggerHaptic(postId ? 'medium' : 'light');
    setCommentsPostIdState(postId);
  }, []);

  const setSharePost = useCallback((post: Post | null) => {
    triggerHaptic(post ? 'medium' : 'light');
    setSharePostState(post);
  }, []);

  const setSharePulse = useCallback((pulse: PulseItem | null) => {
    triggerHaptic(pulse ? 'medium' : 'light');
    setSharePulseState(pulse);
  }, []);

  const setActiveStoryIndex = useCallback((index: number | null) => {
    triggerHaptic(index !== null ? 'medium' : 'light');
    setActiveStoryIndexState(index);
  }, []);

  // Refreshing state for pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Following handles set with localStorage & IndexedDB cache
  const [followingSet, setFollowingSet] = useState<Set<string>>(
    () => new Set(readSyncCache<string[]>('fluid_following', []))
  );

  useEffect(() => {
    writeOfflineCache('fluid_following', Array.from(followingSet));
  }, [followingSet]);

  const [followersList, setFollowersList] = useState<UserProfile[]>(() =>
    readSyncCache<UserProfile[]>('fluid_followers_list', [])
  );
  const [followingList, setFollowingList] = useState<UserProfile[]>(() =>
    readSyncCache<UserProfile[]>('fluid_following_list', [])
  );

  // Hydrate full feed and social state from IndexedDB on initial mount
  useEffect(() => {
    let active = true;
    const hydrateFromIndexedDB = async () => {
      const [
        idbPosts,
        idbPulse,
        idbStories,
        idbComments,
        idbChats,
        idbMessages,
        idbFollowing,
        idbFollowersList,
        idbFollowingList,
      ] = await Promise.all([
        readOfflineCache<Post[]>('fluid_posts', []),
        readOfflineCache<PulseItem[]>('fluid_pulse_items', []),
        readOfflineCache<Story[]>('fluid_stories', []),
        readOfflineCache<Record<string, Comment[]>>('fluid_comments', {}),
        readOfflineCache<ChatThread[]>('fluid_chats', []),
        readOfflineCache<Record<string, Message[]>>('fluid_messages', {}),
        readOfflineCache<string[]>('fluid_following', []),
        readOfflineCache<UserProfile[]>('fluid_followers_list', []),
        readOfflineCache<UserProfile[]>('fluid_following_list', []),
      ]);

      if (!active) return;
      if (idbPosts.length > 0) setPosts((prev) => (prev.length === 0 ? idbPosts : prev));
      if (idbPulse.length > 0) setPulseItems((prev) => (prev.length === 0 ? idbPulse : prev));
      if (idbStories.length > 0) setStories((prev) => (prev.length === 0 ? idbStories : prev));
      if (Object.keys(idbComments).length > 0)
        setCommentsMap((prev) => (Object.keys(prev).length === 0 ? idbComments : prev));
      if (idbChats.length > 0) setChats((prev) => (prev.length === 0 ? idbChats : prev));
      if (Object.keys(idbMessages).length > 0)
        setMessagesMap((prev) => (Object.keys(prev).length === 0 ? idbMessages : prev));
      if (idbFollowing.length > 0)
        setFollowingSet((prev) => (prev.size === 0 ? new Set(idbFollowing) : prev));
      if (idbFollowersList.length > 0)
        setFollowersList((prev) => (prev.length === 0 ? idbFollowersList : prev));
      if (idbFollowingList.length > 0)
        setFollowingList((prev) => (prev.length === 0 ? idbFollowingList : prev));
    };

    hydrateFromIndexedDB();
    return () => {
      active = false;
    };
  }, []);

  // Listen to online/offline status and replay queued mutations when reconnecting
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      if (isFirebaseConfigured && db && auth?.currentUser) {
        const queued = await consumeOfflineMutations();
        for (const item of queued) {
          try {
            if (item.type === 'like_post') {
              const { postId, likesCount, likedBy } = item.payload as {
                postId: string;
                likesCount: number;
                likedBy: string[];
              };
              await updateDoc(doc(db, 'posts', postId), { likesCount, likedBy });
            } else if (item.type === 'add_comment') {
              const { postId, comment, commentsCount } = item.payload as {
                postId: string;
                comment: Comment;
                commentsCount: number;
              };
              await setDoc(doc(db, 'posts', postId, 'comments', comment.id), comment);
              await updateDoc(doc(db, 'posts', postId), { commentsCount });
            } else if (item.type === 'create_post') {
              const { post } = item.payload as { post: Post };
              await setDoc(doc(db, 'posts', post.id), post);
            }
          } catch (err) {
            console.warn('[Fluid Offline Sync] Failed to replay mutation:', err);
          }
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchFollowersAndFollowing = useCallback(async () => {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return;
    try {
      const currentUid = auth.currentUser.uid;
      const followersRef = collection(db, 'users', currentUid, 'followers');
      const followersSnap = await getDocs(followersRef);
      const followersArr: UserProfile[] = [];
      followersSnap.forEach((d) => {
        const data = d.data() as UserProfile;
        if (data.username) followersArr.push(data);
      });
      setFollowersList(followersArr);

      const followingRef = collection(db, 'users', currentUid, 'following');
      const followingSnap = await getDocs(followingRef);
      const followingUsernames = new Set<string>();
      const followingArr: UserProfile[] = [];
      followingSnap.forEach((d) => {
        const data = d.data() as UserProfile;
        if (data.username) {
          followingUsernames.add(data.username);
          if (data.uid) followingArr.push(data);
        }
      });
      setFollowingSet(followingUsernames);

      if (followingArr.length === 0 && followingUsernames.size > 0) {
        const usersCol = collection(db, 'users');
        const usersSnap = await getDocs(usersCol);
        usersSnap.forEach((d) => {
          const u = d.data() as UserProfile;
          if (u.username && followingUsernames.has(u.username)) {
            followingArr.push(u);
          }
        });
      }
      setFollowingList(followingArr);
    } catch (err) {
      console.warn('Error loading followers/following:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchFollowersAndFollowing();
  }, [currentUser, fetchFollowersAndFollowing]);

  // Persist to IndexedDB + localStorage dual-layer offline cache
  useEffect(() => {
    writeOfflineCache('fluid_posts', posts);
  }, [posts]);

  useEffect(() => {
    writeOfflineCache('fluid_pulse_items', pulseItems);
  }, [pulseItems]);

  useEffect(() => {
    writeOfflineCache('fluid_stories', stories);
  }, [stories]);

  useEffect(() => {
    writeOfflineCache('fluid_comments', commentsMap);
  }, [commentsMap]);

  useEffect(() => {
    writeOfflineCache('fluid_chats', chats);
  }, [chats]);

  useEffect(() => {
    writeOfflineCache('fluid_messages', messagesMap);
  }, [messagesMap]);

  useEffect(() => {
    writeOfflineCache('fluid_followers_list', followersList);
    writeOfflineCache('fluid_following_list', followingList);
  }, [followersList, followingList]);

  // Real-time Firestore post synchronization (preserving cached posts when offline)
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return;

    const postsCol = collection(db, 'posts');
    const q = query(postsCol, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedPosts = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Post[];
          setPosts(loadedPosts);
        } else if (!snapshot.metadata.fromCache && navigator.onLine) {
          setPosts([]);
        }
      },
      (error) => {
        if (!navigator.onLine) {
          console.warn('[Fluid] Offline mode active — serving feed from IndexedDB cache.');
          return;
        }
        handleFirestoreError(error, OperationType.GET, 'posts');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch real-time External Pulse via server Gemini Search Grounding
  const fetchPulseItems = useCallback(async (): Promise<void> => {
    setIsPulseLoading(true);
    try {
      const userTopics = currentUser?.interests && currentUser.interests.length > 0
        ? currentUser.interests
        : ['Technology', 'Design', 'Architecture', 'Culture'];
      const userSources = currentUser?.preferredSources && currentUser.preferredSources.length > 0
        ? currentUser.preferredSources
        : ['news', 'x', 'instagram', 'facebook'];

      const res = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: userTopics,
          sources: userSources,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setPulseItems(data.items);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch pulse items from Gemini grounding:', err);
    } finally {
      setIsPulseLoading(false);
    }
  }, [currentUser]);

  // Initial fetch for External Pulse
  useEffect(() => {
    if (currentUser) {
      fetchPulseItems();
    }
  }, [currentUser, fetchPulseItems]);

  // Real-time Firestore chat threads synchronization
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) return;

    const chatsCol = collection(db, 'chats');
    const q = query(chatsCol, where('participants', 'array-contains', auth.currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedChats = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as ChatThread[];
          setChats(loadedChats);
        }
      },
      (err) => {
        console.warn('Chats threads snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time Firestore messages synchronization for activeChat
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !auth?.currentUser || !activeChat) return;

    const messagesCol = collection(db, 'chats', activeChat.id, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMessages = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Message[];

        setMessagesMap((prev) => ({
          ...prev,
          [activeChat.id]: loadedMessages,
        }));
      },
      (err) => {
        console.warn('Chat messages snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [activeChat]);

  // Pull-to-refresh
  const refreshPosts = async (): Promise<void> => {
    triggerHaptic('refresh');
    setIsRefreshing(true);
    try {
      if (isFirebaseConfigured && db && auth?.currentUser) {
        const postsCol = collection(db, 'posts');
        const q = query(postsCol, orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const loadedPosts = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Post[];
          setPosts(loadedPosts);
        } else {
          setPosts([]);
        }
      }
      // Also refresh external pulse stream
      await fetchPulseItems();
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err) {
      console.warn('[Fluid] Error refreshing posts from Firestore:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Section 3.C: Personalized Recommendation System ("For You" Algorithm)
  // Score = (Tag Affinity Match * 3) + (Likes Count * 1.5) + (Comments Count * 2) - (Hours Since Posted * 0.8)
  const forYouFeed = useMemo(() => {
    const userAffinities = currentUser?.affinityScores || {};

    const calculateScore = (item: Post): number => {
      // 1. Tag affinity match
      let tagMatch = 0;
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach((tag) => {
          const clean = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
          tagMatch += userAffinities[clean] || 0;
        });
      }
      // Check user interests match
      if (currentUser?.interests && item.caption) {
        currentUser.interests.forEach((interest) => {
          if (item.caption.toLowerCase().includes(interest.toLowerCase())) {
            tagMatch += 4;
          }
        });
      }

      // 2. Engagement counts
      const likes = item.likesCount || 0;
      const comments = item.commentsCount || 0;

      // 3. Time decay
      let hoursAgo = 1;
      try {
        const postTime = new Date(item.createdAt).getTime();
        const diffMs = Date.now() - postTime;
        hoursAgo = Math.max(0.1, diffMs / (1000 * 60 * 60));
      } catch {
        hoursAgo = 2;
      }

      return tagMatch * 3 + likes * 1.5 + comments * 2 - hoursAgo * 0.8;
    };

    // Rank real community posts (excluding blocked accounts)
    const blockedSet = new Set(
      (currentUser?.settings?.blockedUsers || []).map((u) => u.toLowerCase())
    );
    const visiblePosts = posts.filter(
      (post) => !blockedSet.has(post.authorUsername.toLowerCase())
    );
    const scoredPosts = visiblePosts.map((post) => ({
      item: post,
      score: calculateScore(post),
    }));
    scoredPosts.sort((a, b) => b.score - a.score);

    // Filter pulse items by source if active
    const candidatePulse = pulseItems.filter((pulse) => {
      if (sourceFilter === 'all') return true;
      return pulse.source === sourceFilter;
    });

    // Interleave top-ranked community posts with real-time grounded reference cards
    const hybridFeed: (
      | { type: 'post'; data: Post }
      | { type: 'pulse'; data: PulseItem }
    )[] = [];

    let postIdx = 0;
    let pulseIdx = 0;

    while (postIdx < scoredPosts.length || pulseIdx < candidatePulse.length) {
      // Take up to 2 community posts
      if (postIdx < scoredPosts.length) {
        hybridFeed.push({ type: 'post', data: scoredPosts[postIdx].item });
        postIdx++;
      }
      if (postIdx < scoredPosts.length) {
        hybridFeed.push({ type: 'post', data: scoredPosts[postIdx].item });
        postIdx++;
      }
      // Interleave 1 external grounded reference card
      if (pulseIdx < candidatePulse.length) {
        hybridFeed.push({ type: 'pulse', data: candidatePulse[pulseIdx] });
        pulseIdx++;
      }
    }

    return hybridFeed;
  }, [posts, pulseItems, currentUser, sourceFilter]);

  // Post Actions
  const toggleLikePost = async (postId: string) => {
    if (!currentUser) return;
    let targetPost: Post | undefined;
    let willLike = false;
    let newLikesCount = 0;
    let updatedLikedBy: string[] = [];

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        targetPost = post;
        willLike = !post.isLiked;
        newLikesCount = willLike ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
        updatedLikedBy = willLike
          ? [...(post.likedBy || []), currentUser.uid]
          : (post.likedBy || []).filter((id) => id !== currentUser.uid);

        return {
          ...post,
          isLiked: willLike,
          likesCount: newLikesCount,
          likedBy: updatedLikedBy,
        };
      })
    );

    triggerHaptic(willLike ? 'medium' : 'light');
    if (willLike && targetPost) {
      recordSignal('like', postId, targetPost.tags || []);
    }

    if (isFirebaseConfigured && db && auth?.currentUser) {
      if (!navigator.onLine) {
        await enqueueOfflineMutation({
          type: 'like_post',
          payload: { postId, likesCount: newLikesCount, likedBy: updatedLikedBy },
        });
        return;
      }
      try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          likesCount: newLikesCount,
          likedBy: updatedLikedBy,
        });
      } catch (err) {
        console.warn('Like sync error, queuing for offline replay:', err);
        await enqueueOfflineMutation({
          type: 'like_post',
          payload: { postId, likesCount: newLikesCount, likedBy: updatedLikedBy },
        });
      }
    }
  };

  const toggleBookmarkPost = (postId: string) => {
    triggerHaptic('light');
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        const nextBookmarked = !post.isBookmarked;
        if (nextBookmarked) {
          recordSignal('bookmark', postId, post.tags || []);
        }
        return { ...post, isBookmarked: nextBookmarked };
      })
    );
  };

  const toggleLikePulse = (pulseId: string) => {
    setPulseItems((prev) =>
      prev.map((item) => {
        if (item.id !== pulseId) return item;
        const nextLiked = !item.isLiked;
        if (nextLiked) {
          recordSignal('pulse_click', pulseId, item.tags || []);
        }
        return {
          ...item,
          isLiked: nextLiked,
          likesCount: (item.likesCount || 0) + (nextLiked ? 1 : -1),
        };
      })
    );
  };

  const deletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (isFirebaseConfigured && db && auth?.currentUser) {
      const postRef = doc(db, 'posts', postId);
      deleteDoc(postRef).catch((err) => {
        console.warn('Post delete sync error:', err);
      });
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    triggerHaptic('light');

    const commentId = `comment_${Date.now()}`;
    const newComment: Comment = {
      id: commentId,
      postId,
      authorId: currentUser.uid,
      authorUsername: currentUser.username,
      authorAvatarUrl: currentUser.avatarUrl,
      text: text.trim(),
      createdAt: 'Just now',
      likesCount: 0,
      isLiked: false,
    };

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const newCount = (p.commentsCount || 0) + 1;
          // Telemetry signal (+8 weight for comment)
          recordSignal('comment', postId, p.tags || []);
          return { ...p, commentsCount: newCount };
        }
        return p;
      })
    );

    if (isFirebaseConfigured && db && auth?.currentUser) {
      const targetPost = posts.find((p) => p.id === postId);
      const newCount = (targetPost?.commentsCount || 0) + 1;
      if (!navigator.onLine) {
        await enqueueOfflineMutation({
          type: 'add_comment',
          payload: { postId, comment: newComment, commentsCount: newCount },
        });
        return;
      }
      try {
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);
        await setDoc(commentRef, newComment);

        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { commentsCount: newCount });
      } catch (err) {
        console.warn('Comment sync error, queuing for offline replay:', err);
        await enqueueOfflineMutation({
          type: 'add_comment',
          payload: { postId, comment: newComment, commentsCount: newCount },
        });
      }
    }
  };

  const getPostComments = (postId: string): Comment[] => {
    return commentsMap[postId] || [];
  };

  const createPost = async (postData: {
    imageUrl: string;
    caption: string;
    aspectRatio: '1:1' | '4:5';
    location?: string;
    embedUrl?: string;
    embedData?: UrlEmbedData;
    crossPostedTo?: ('x' | 'instagram' | 'facebook')[];
    tags?: string[];
  }): Promise<void> => {
    if (!currentUser) return;

    // Auto extract tags if not provided
    let tags = postData.tags || [];
    if (tags.length === 0 && postData.caption) {
      try {
        const res = await fetch('/api/ai/extract-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: postData.caption }),
        });
        if (res.ok) {
          const data = await res.json();
          tags = data.tags || [];
        }
      } catch {
        tags = ['culture', 'fluid'];
      }
    }

    const newPostId = `post_${Date.now()}`;
    const newPost: Post = {
      id: newPostId,
      authorId: currentUser.uid,
      authorUsername: currentUser.username,
      authorDisplayName: currentUser.displayName,
      authorAvatarUrl: currentUser.avatarUrl,
      imageUrl: postData.imageUrl,
      aspectRatio: postData.aspectRatio,
      caption: postData.caption,
      location: postData.location,
      tags,
      embedUrl: postData.embedUrl,
      embedData: postData.embedData,
      crossPostedTo: postData.crossPostedTo,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      authorVerified: currentUser.isVerified,
    };

    setPosts((prev) => [newPost, ...prev]);
    triggerHaptic('success');

    // Firestore sync (or offline queue)
    if (isFirebaseConfigured && db && auth?.currentUser) {
      if (!navigator.onLine) {
        await enqueueOfflineMutation({
          type: 'create_post',
          payload: { post: newPost },
        });
      } else {
        try {
          const postRef = doc(db, 'posts', newPostId);
          await setDoc(postRef, newPost);
        } catch (err) {
          if (!navigator.onLine) {
            await enqueueOfflineMutation({
              type: 'create_post',
              payload: { post: newPost },
            });
          } else {
            handleFirestoreError(err, OperationType.CREATE, `posts/${newPostId}`);
          }
        }
      }
    }

    updateUserProfile({ postsCount: (currentUser.postsCount || 0) + 1 });
  };

  const markStoryViewed = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, hasUnviewed: false } : s))
    );
  };

  const openChat = (chatId: string) => {
    const thread = chats.find((c) => c.id === chatId);
    if (thread) {
      triggerHaptic('light');
      setActiveChat(thread);
      markChatAsRead(chatId);
    }
  };

  const closeChat = () => {
    setActiveChat(null);
  };

  const markChatAsRead = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat))
    );
  };

  const simulateRecipientRead = (chatId: string, messageId?: string) => {
    setMessagesMap((prev) => {
      const chatMessages = prev[chatId] || [];
      const updatedMessages = chatMessages.map((m) => {
        if (!messageId || m.id === messageId) {
          return {
            ...m,
            status: 'read' as const,
            isRead: true,
            readAt: 'Just now',
          };
        }
        return m;
      });
      return { ...prev, [chatId]: updatedMessages };
    });

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessageStatus: 'read' as const,
              lastMessageRead: true,
            }
          : c
      )
    );
  };

  const sendMessage = (
    text: string,
    sharedPost?: Post,
    sharedPulse?: PulseItem,
    embedData?: UrlEmbedData
  ) => {
    if (!currentUser || !activeChat) return;
    if (!text.trim() && !sharedPost && !sharedPulse && !embedData) return;
    triggerHaptic('light');

    const newMessageId = `msg_${Date.now()}`;
    const newMessage: Message = {
      id: newMessageId,
      chatId: activeChat.id,
      senderId: currentUser.uid,
      senderUsername: currentUser.username,
      senderAvatarUrl: currentUser.avatarUrl,
      text: text.trim(),
      createdAt: 'Just now',
      status: 'sent',
      isRead: false,
      sharedPost: sharedPost
        ? {
            id: sharedPost.id,
            imageUrl: sharedPost.imageUrl,
            authorUsername: sharedPost.authorUsername,
            caption: sharedPost.caption,
          }
        : undefined,
      sharedPulse,
      embedData,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage],
    }));

    const previewSnippet = sharedPost
      ? `Shared post by @${sharedPost.authorUsername}`
      : sharedPulse
      ? `Shared ${sharedPulse.source.toUpperCase()} story`
      : embedData
      ? `Shared ${embedData.domain} link`
      : text.trim();

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessage: previewSnippet,
              lastMessageSenderId: currentUser.uid,
              lastMessageStatus: 'sent',
              lastMessageRead: false,
              updatedAt: 'Just now',
            }
          : c
      )
    );

    // Firestore sync if active
    if (isFirebaseConfigured && db && auth?.currentUser && activeChat) {
      try {
        const msgRef = doc(db, 'chats', activeChat.id, 'messages', newMessageId);
        setDoc(msgRef, newMessage).catch((err) => {
          console.warn('Message send sync error:', err);
        });

        const chatRef = doc(db, 'chats', activeChat.id);
        setDoc(
          chatRef,
          {
            id: activeChat.id,
            participants: activeChat.participants,
            lastMessage: previewSnippet,
            lastMessageSenderId: currentUser.uid,
            lastMessageStatus: 'sent',
            lastMessageRead: false,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => {
          console.warn('Chat thread update error:', err);
        });
      } catch (err) {
        console.warn('Message dispatch error:', err);
      }
    }
  };

  const sharePostToChat = (chatId: string, post: Post) => {
    if (!currentUser) return;
    const thread = chats.find((c) => c.id === chatId);
    if (!thread) return;

    const newMsg: Message = {
      id: `msg_share_${Date.now()}`,
      chatId,
      senderId: currentUser.uid,
      senderUsername: currentUser.username,
      senderAvatarUrl: currentUser.avatarUrl,
      text: '',
      createdAt: 'Just now',
      status: 'sent',
      isRead: false,
      sharedPost: {
        id: post.id,
        imageUrl: post.imageUrl,
        authorUsername: post.authorUsername,
        caption: post.caption,
      },
    };

    setMessagesMap((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: `Shared post by @${post.authorUsername}`,
              lastMessageSenderId: currentUser.uid,
              lastMessageStatus: 'sent',
              lastMessageRead: false,
              updatedAt: 'Just now',
            }
          : c
      )
    );
  };

  const sharePulseToChat = (chatId: string, pulse: PulseItem) => {
    if (!currentUser) return;
    const thread = chats.find((c) => c.id === chatId);
    if (!thread) return;

    const newMsg: Message = {
      id: `msg_pulse_${Date.now()}`,
      chatId,
      senderId: currentUser.uid,
      senderUsername: currentUser.username,
      senderAvatarUrl: currentUser.avatarUrl,
      text: '',
      createdAt: 'Just now',
      status: 'sent',
      isRead: false,
      sharedPulse: pulse,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: `Shared story from ${pulse.sourceName}`,
              lastMessageSenderId: currentUser.uid,
              lastMessageStatus: 'sent',
              lastMessageRead: false,
              updatedAt: 'Just now',
            }
          : c
      )
    );
  };

  const toggleFollowUser = async (targetUsername: string) => {
    if (!currentUser || !auth?.currentUser) return;
    triggerHaptic('medium');
    let nextIsFollowing = false;
    setFollowingSet((prev) => {
      const next = new Set(prev);
      if (next.has(targetUsername)) {
        next.delete(targetUsername);
        nextIsFollowing = false;
      } else {
        next.add(targetUsername);
        nextIsFollowing = true;
      }
      return next;
    });

    if (isFirebaseConfigured && db && auth?.currentUser && currentUser) {
      try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('username', '==', targetUsername), limit(1));
        const userSnap = await getDocs(q);

        let targetUid = '';
        let targetUserDoc: UserProfile | null = null;
        if (!userSnap.empty) {
          targetUid = userSnap.docs[0].id;
          targetUserDoc = userSnap.docs[0].data() as UserProfile;
        }

        const followRef = doc(db, 'users', auth.currentUser.uid, 'following', targetUsername);
        if (nextIsFollowing) {
          await setDoc(followRef, {
            uid: targetUid,
            username: targetUsername,
            displayName: targetUserDoc?.displayName || targetUsername,
            avatarUrl: targetUserDoc?.avatarUrl || currentUser.avatarUrl,
            createdAt: new Date().toISOString(),
          });

          if (targetUid) {
            const targetFollowerRef = doc(db, 'users', targetUid, 'followers', auth.currentUser.uid);
            await setDoc(targetFollowerRef, {
              uid: auth.currentUser.uid,
              username: currentUser.username,
              displayName: currentUser.displayName,
              avatarUrl: currentUser.avatarUrl,
              createdAt: new Date().toISOString(),
            });
            const newTargetFollowersCount = (targetUserDoc?.followersCount || 0) + 1;
            await updateDoc(doc(db, 'users', targetUid), { followersCount: newTargetFollowersCount });
          }
        } else {
          await deleteDoc(followRef);
          if (targetUid) {
            const targetFollowerRef = doc(db, 'users', targetUid, 'followers', auth.currentUser.uid);
            await deleteDoc(targetFollowerRef);
            const newTargetFollowersCount = Math.max(0, (targetUserDoc?.followersCount || 1) - 1);
            await updateDoc(doc(db, 'users', targetUid), { followersCount: newTargetFollowersCount });
          }
        }

        const newFollowingCount = Math.max(0, (currentUser.followingCount || 0) + (nextIsFollowing ? 1 : -1));
        await updateUserProfile({ followingCount: newFollowingCount });
        await fetchFollowersAndFollowing();
      } catch (err) {
        console.warn('Follow sync error:', err);
      }
    }
  };

  const startChatWithUser = (otherUser: {
    uid: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  }) => {
    if (!currentUser) return;

    const existing = chats.find(
      (c) => c.participants.includes(otherUser.uid) || c.otherUser.uid === otherUser.uid
    );

    if (existing) {
      setActiveChat(existing);
      setActiveTab('messages');
      return;
    }

    const newThreadId = `chat_${Date.now()}`;
    const newThread: ChatThread = {
      id: newThreadId,
      participants: [currentUser.uid, otherUser.uid],
      otherUser: {
        uid: otherUser.uid,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl,
        isOnline: true,
      },
      lastMessage: 'Conversation started',
      lastMessageSenderId: currentUser.uid,
      updatedAt: 'Just now',
      unreadCount: 0,
    };

    setChats((prev) => [newThread, ...prev]);
    setActiveChat(newThread);
    setActiveTab('messages');
  };

  const toggleMessageReaction = useCallback((chatId: string, messageId: string, emoji: string) => {
    triggerHaptic('light');
    setMessagesMap((prev) => {
      const chatMsgs = prev[chatId] || [];
      const updated = chatMsgs.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            reaction: m.reaction === emoji ? undefined : emoji,
          };
        }
        return m;
      });
      return { ...prev, [chatId]: updated };
    });
  }, []);

  const sendMediaMessage = useCallback((imageUrl: string, caption?: string) => {
    if (!currentUser || !activeChat || !imageUrl) return;
    triggerHaptic('light');

    const newMessageId = `msg_${Date.now()}`;
    const newMessage: Message = {
      id: newMessageId,
      chatId: activeChat.id,
      senderId: currentUser.uid,
      senderUsername: currentUser.username,
      senderAvatarUrl: currentUser.avatarUrl,
      text: caption?.trim() || '',
      imageUrl,
      createdAt: 'Just now',
      status: 'sent',
      isRead: false,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessage: '📷 Sent a photo',
              lastMessageSenderId: currentUser.uid,
              lastMessageStatus: 'sent',
              lastMessageRead: false,
              updatedAt: 'Just now',
            }
          : c
      )
    );
  }, [currentUser, activeChat]);

  const sendVoiceMessage = useCallback((durationText: string) => {
    if (!currentUser || !activeChat) return;
    triggerHaptic('light');

    const newMessageId = `msg_${Date.now()}`;
    const newMessage: Message = {
      id: newMessageId,
      chatId: activeChat.id,
      senderId: currentUser.uid,
      senderUsername: currentUser.username,
      senderAvatarUrl: currentUser.avatarUrl,
      text: '',
      audioDuration: durationText,
      createdAt: 'Just now',
      status: 'sent',
      isRead: false,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessage: `🎙️ Voice message (${durationText})`,
              lastMessageSenderId: currentUser.uid,
              lastMessageStatus: 'sent',
              lastMessageRead: false,
              updatedAt: 'Just now',
            }
          : c
      )
    );
  }, [currentUser, activeChat]);

  const deleteChatThread = useCallback((chatId: string) => {
    triggerHaptic('medium');
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setMessagesMap((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
    if (activeChat?.id === chatId) {
      setActiveChat(null);
    }
  }, [activeChat]);

  const addUserNote = useCallback((text: string, musicTrack?: string) => {
    if (!currentUser) return;
    triggerHaptic('success');
    const newNote: UserNote = {
      id: `note_${currentUser.uid}`,
      userId: currentUser.uid,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      noteText: text.trim(),
      musicTrack: musicTrack?.trim() || undefined,
      createdAt: 'Just now',
      isCurrentUser: true,
    };
    setNotes((prev) => [newNote, ...prev.filter((n) => n.userId !== currentUser.uid)]);
  }, [currentUser]);

  const unreadDmCount = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const activeChatMessages = activeChat ? messagesMap[activeChat.id] || [] : [];

  const value = useMemo(
    () => ({
      posts,
      stories,
      chats,
      activeChat,
      activeChatMessages,
      activeTab,
      setActiveTab,
      feedMode,
      setFeedMode,
      sourceFilter,
      setSourceFilter,
      pulseItems,
      isPulseLoading,
      fetchPulseItems,
      forYouFeed,
      isCreateOpen,
      setIsCreateOpen,
      commentsPostId,
      setCommentsPostId,
      sharePost,
      setSharePost,
      sharePulse,
      setSharePulse,
      activeStoryIndex,
      setActiveStoryIndex,
      toggleLikePost,
      toggleBookmarkPost,
      toggleLikePulse,
      deletePost,
      addComment,
      getPostComments,
      createPost,
      markStoryViewed,
      openChat,
      closeChat,
      sendMessage,
      sharePostToChat,
      sharePulseToChat,
      toggleFollowUser,
      startChatWithUser,
      markChatAsRead,
      simulateRecipientRead,
      isRecipientTyping,
      toggleMessageReaction,
      sendMediaMessage,
      sendVoiceMessage,
      deleteChatThread,
      notes,
      addUserNote,
      refreshPosts,
      isRefreshing,
      followingSet,
      followersList,
      followingList,
      fetchFollowersAndFollowing,
      unreadDmCount,
      isOffline,
    }),
    [
      posts,
      stories,
      chats,
      activeChat,
      activeChatMessages,
      activeTab,
      feedMode,
      sourceFilter,
      pulseItems,
      isPulseLoading,
      fetchPulseItems,
      forYouFeed,
      isCreateOpen,
      commentsPostId,
      sharePost,
      sharePulse,
      activeStoryIndex,
      toggleLikePost,
      toggleBookmarkPost,
      toggleLikePulse,
      deletePost,
      addComment,
      getPostComments,
      createPost,
      markStoryViewed,
      openChat,
      closeChat,
      sendMessage,
      sharePostToChat,
      sharePulseToChat,
      toggleFollowUser,
      startChatWithUser,
      markChatAsRead,
      simulateRecipientRead,
      isRecipientTyping,
      toggleMessageReaction,
      sendMediaMessage,
      sendVoiceMessage,
      deleteChatThread,
      notes,
      addUserNote,
      refreshPosts,
      isRefreshing,
      followingSet,
      followersList,
      followingList,
      fetchFollowersAndFollowing,
      unreadDmCount,
      isOffline,
    ]
  );

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};
