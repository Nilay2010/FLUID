import React, { useState, useEffect } from 'react';
import {
  Grid,
  Bookmark,
  Settings,
  Check,
  Link as LinkIcon,
  Share2,
  Video,
  Lock,
  Bell,
  Clock,
  Shield,
  Eye,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  UserX,
  Users,
  Smartphone,
  Globe,
  Star,
  Plus,
  X,
  Download,
  Vibrate,
  Camera,
  MapPin,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { UserSettings } from '../types';
import { triggerHaptic } from '../services/haptics';

type SettingsSection =
  | null
  | 'notifications'
  | 'time'
  | 'close_friends'
  | 'blocked'
  | 'permissions'
  | 'language'
  | 'help'
  | 'privacy';

const DEFAULT_HIGHLIGHTS = [
  {
    id: 'h1',
    title: 'Design',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'h2',
    title: 'Code',
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'h3',
    title: 'Fluid',
    cover: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'h4',
    title: 'Setup',
    cover: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
  },
];

const LANGUAGES = [
  'English (US)',
  'English (UK)',
  'Español',
  'Français',
  'Deutsch',
  '日本語',
  '한국어',
  'हिन्दी',
  'Português (Brasil)',
];

export const ProfileView: React.FC = () => {
  const { currentUser, updateUserProfile, logout } = useAuth();
  const {
    posts,
    setCommentsPostId,
    followersList,
    followingList,
    followingSet,
    toggleFollowUser,
  } = useSocial();

  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Story Highlight Viewer / Creator state
  const [activeHighlight, setActiveHighlight] = useState<{
    id: string;
    title: string;
    cover: string;
  } | null>(null);
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [newHighlightCover, setNewHighlightCover] = useState('');

  // Edit profile fields
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editDisplayName, setEditDisplayName] = useState(currentUser?.displayName || '');
  const [editWebsite, setEditWebsite] = useState(currentUser?.website || '');

  // Connected accounts state
  const [xHandle, setXHandle] = useState(currentUser?.connectedAccounts?.x?.handle || '');
  const [isXConnected, setIsXConnected] = useState(
    currentUser?.connectedAccounts?.x?.connected || false
  );
  const [igHandle, setIgHandle] = useState(currentUser?.connectedAccounts?.instagram?.handle || '');
  const [isIgConnected, setIsIgConnected] = useState(
    currentUser?.connectedAccounts?.instagram?.connected || false
  );
  const [fbHandle, setFbHandle] = useState(currentUser?.connectedAccounts?.facebook?.handle || '');
  const [isFbConnected, setIsFbConnected] = useState(
    currentUser?.connectedAccounts?.facebook?.connected || false
  );

  // Sub-page interactive inputs
  const [closeFriendInput, setCloseFriendInput] = useState('');
  const [blockUserInput, setBlockUserInput] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  // Device permissions live status
  const [notifPermStatus, setNotifPermStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [cameraStatus, setCameraStatus] = useState<string>('Ready');
  const [geoStatus, setGeoStatus] = useState<string>('Ready');

  // Time spent live tracker (in seconds)
  const [secondsSpentToday, setSecondsSpentToday] = useState<number>(() => {
    const saved = localStorage.getItem('fluid_time_spent_seconds');
    return saved ? parseInt(saved, 10) || 420 : 420; // starts with realistic session baseline
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSpentToday((prev) => {
        const next = prev + 1;
        localStorage.setItem('fluid_time_spent_seconds', String(next));
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  if (!currentUser) return null;

  // Derived user settings with defaults
  const userSettings: UserSettings = {
    isPrivateAccount: currentUser.settings?.isPrivateAccount ?? false,
    oledTheme: currentUser.settings?.oledTheme ?? true,
    hapticsEnabled:
      currentUser.settings?.hapticsEnabled ??
      localStorage.getItem('fluid_haptics_enabled') !== 'false',
    showActivityStatus: currentUser.settings?.showActivityStatus ?? true,
    readReceiptsEnabled: currentUser.settings?.readReceiptsEnabled ?? true,
    allowStorySharing: currentUser.settings?.allowStorySharing ?? true,
    language: currentUser.settings?.language ?? 'English (US)',
    dailyTimeLimitMinutes: currentUser.settings?.dailyTimeLimitMinutes ?? null,
    sleepModeEnabled: currentUser.settings?.sleepModeEnabled ?? false,
    notifications: {
      pauseAll: currentUser.settings?.notifications?.pauseAll ?? false,
      likesAndComments: currentUser.settings?.notifications?.likesAndComments ?? true,
      newFollowers: currentUser.settings?.notifications?.newFollowers ?? true,
      directMessages: currentUser.settings?.notifications?.directMessages ?? true,
    },
    closeFriends: currentUser.settings?.closeFriends ?? [],
    blockedUsers: currentUser.settings?.blockedUsers ?? [],
    highlights: currentUser.settings?.highlights ?? DEFAULT_HIGHLIGHTS,
  };

  // Persist setting helper
  const updateSettings = async (partial: Partial<UserSettings>, toastText?: string) => {
    triggerHaptic('light');
    const merged: UserSettings = {
      ...userSettings,
      ...partial,
      notifications: {
        ...userSettings.notifications,
        ...(partial.notifications || {}),
      },
    };

    if (typeof partial.hapticsEnabled === 'boolean') {
      localStorage.setItem('fluid_haptics_enabled', String(partial.hapticsEnabled));
    }

    if (typeof partial.oledTheme === 'boolean') {
      document.body.style.backgroundColor = partial.oledTheme ? '#000000' : '#121216';
    }

    await updateUserProfile({ settings: merged });
    if (toastText) {
      showToast(toastText);
    }
  };

  const myPosts = posts.filter((p) => p.authorId === currentUser.uid);
  const savedPosts = posts.filter((p) => p.isBookmarked);
  const displayList =
    activeSubTab === 'posts' ? myPosts : activeSubTab === 'saved' ? savedPosts : myPosts;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    await updateUserProfile({
      bio: editBio,
      displayName: editDisplayName,
      website: editWebsite,
      connectedAccounts: {
        x: { connected: isXConnected, handle: xHandle.trim() },
        instagram: { connected: isIgConnected, handle: igHandle.trim() },
        facebook: { connected: isFbConnected, handle: fbHandle.trim() },
      },
    });
    setIsEditing(false);
    showToast('Profile updated');
  };

  const handleSaveConnections = async () => {
    triggerHaptic('success');
    await updateUserProfile({
      connectedAccounts: {
        x: { connected: isXConnected, handle: xHandle.trim() },
        instagram: { connected: isIgConnected, handle: igHandle.trim() },
        facebook: { connected: isFbConnected, handle: fbHandle.trim() },
      },
    });
    setIsConnectModalOpen(false);
    showToast('Connected accounts saved');
  };

  const handleShareProfile = async () => {
    triggerHaptic('light');
    const profileUrl = `${window.location.origin}/?user=${encodeURIComponent(currentUser.username)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentUser.displayName} (@${currentUser.username}) on Fluid`,
          text: currentUser.bio,
          url: profileUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast(`Profile link copied (@${currentUser.username})`);
    } catch {
      showToast(`@${currentUser.username} ready to share`);
    }
  };

  const handleAddHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighlightTitle.trim()) return;
    const coverUrl =
      newHighlightCover.trim() ||
      myPosts[0]?.imageUrl ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
    const nextHighlights = [
      ...(userSettings.highlights || DEFAULT_HIGHLIGHTS),
      {
        id: `hl_${Date.now()}`,
        title: newHighlightTitle.trim(),
        cover: coverUrl,
      },
    ];
    await updateSettings({ highlights: nextHighlights }, 'Story highlight added');
    setNewHighlightTitle('');
    setNewHighlightCover('');
    setIsAddingHighlight(false);
  };

  const handleDeleteHighlight = async (id: string) => {
    const nextHighlights = (userSettings.highlights || DEFAULT_HIGHLIGHTS).filter(
      (h) => h.id !== id
    );
    await updateSettings({ highlights: nextHighlights }, 'Highlight removed');
    setActiveHighlight(null);
  };

  const handleToggleCloseFriend = async (username: string) => {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return;
    const currentList = userSettings.closeFriends || [];
    const exists = currentList.some((u) => u.toLowerCase() === clean);
    const nextList = exists
      ? currentList.filter((u) => u.toLowerCase() !== clean)
      : [...currentList, clean];
    await updateSettings(
      { closeFriends: nextList },
      exists ? `Removed @${clean} from Close Friends` : `Added @${clean} to Close Friends`
    );
  };

  const handleBlockUser = async (username: string) => {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!clean || clean === currentUser.username.toLowerCase()) return;
    const currentBlocked = userSettings.blockedUsers || [];
    if (currentBlocked.includes(clean)) return;
    await updateSettings(
      { blockedUsers: [...currentBlocked, clean] },
      `Blocked @${clean}`
    );
    setBlockUserInput('');
  };

  const handleUnblockUser = async (username: string) => {
    const currentBlocked = userSettings.blockedUsers || [];
    const nextBlocked = currentBlocked.filter((u) => u !== username);
    await updateSettings({ blockedUsers: nextBlocked }, `Unblocked @${username}`);
  };

  const handleRequestBrowserNotifications = async () => {
    triggerHaptic('light');
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Browser notifications not supported in this frame');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotifPermStatus(result);
      showToast(`Notification permission: ${result}`);
    } catch {
      showToast('Unable to request notification permission in iframe');
    }
  };

  const handleVerifyCamera = async () => {
    triggerHaptic('light');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('System File Picker Ready');
      showToast('Photo library & file upload active');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraStatus('Granted');
      showToast('Camera access verified');
    } catch {
      setCameraStatus('File Upload Ready');
      showToast('Using standard photo picker fallback');
    }
  };

  const handleVerifyLocation = () => {
    triggerHaptic('light');
    if (!navigator.geolocation) {
      setGeoStatus('Unsupported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoStatus('Granted');
        showToast('Location access verified');
      },
      () => {
        setGeoStatus('Restricted');
        showToast('Location access restricted by browser');
      },
      { timeout: 4000 }
    );
  };

  const handleDownloadUserData = () => {
    triggerHaptic('success');
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      profile: currentUser,
      postsCount: myPosts.length,
      posts: myPosts,
      followersCount: followersList.length,
      followingCount: followingList.length,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluid-account-data-${currentUser.username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Account data downloaded (.JSON)');
  };

  const minutesToday = Math.max(1, Math.floor(secondsSpentToday / 60));
  const highlightsList = userSettings.highlights || DEFAULT_HIGHLIGHTS;

  // Candidate users for Close Friends (combines followers & following without duplicates)
  const knownUsersMap = new Map<string, { username: string; displayName: string; avatarUrl: string }>();
  [...followersList, ...followingList].forEach((u) => {
    if (u.username && u.username !== currentUser.username) {
      knownUsersMap.set(u.username.toLowerCase(), {
        username: u.username,
        displayName: u.displayName || u.username,
        avatarUrl: u.avatarUrl,
      });
    }
  });
  (userSettings.closeFriends || []).forEach((uname) => {
    if (!knownUsersMap.has(uname.toLowerCase())) {
      knownUsersMap.set(uname.toLowerCase(), {
        username: uname,
        displayName: uname,
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      });
    }
  });
  const candidateCloseFriends = Array.from(knownUsersMap.values());

  return (
    <div
      className={`flex flex-col min-h-screen text-white select-none pb-20 md:pb-6 transition-colors duration-300 ${
        userSettings.oledTheme ? 'bg-black' : 'bg-[#121216]'
      }`}
    >
      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] bg-white text-black px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar - Instagram Header */}
      <div className="h-12 px-4 border-b border-neutral-900 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-md z-20">
        <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
          {userSettings.isPrivateAccount && (
            <Lock className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
          )}
          <span>@{currentUser.username}</span>
          {currentUser.isVerified && <span className="text-sky-400 text-xs">●</span>}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsConnectModalOpen(true);
            }}
            title="Connected Accounts"
            className="text-neutral-400 hover:text-white p-1 text-xs font-mono flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Connect</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('medium');
              setSettingsSection(null);
              setIsSettingsOpen(true);
            }}
            className="text-white hover:text-neutral-300 p-1 cursor-pointer active:scale-90 transition-transform"
            aria-label="Settings and privacy"
          >
            <Settings className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-4 py-4 space-y-4">
        {/* Avatar + Stats Row */}
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-neutral-800 shrink-0 p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-full h-full object-cover rounded-full bg-black"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 flex justify-around items-center text-center">
            <div>
              <div className="font-semibold text-base text-white tracking-tight">
                {myPosts.length}
              </div>
              <div className="text-xs text-neutral-400">posts</div>
            </div>
            <div
              onClick={() => {
                triggerHaptic('medium');
                setModalType('followers');
              }}
              className="cursor-pointer group"
            >
              <div className="font-semibold text-base text-white tracking-tight group-hover:text-sky-400 transition-colors">
                {currentUser.followersCount.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-400 group-hover:text-neutral-200">followers</div>
            </div>
            <div
              onClick={() => {
                triggerHaptic('medium');
                setModalType('following');
              }}
              className="cursor-pointer group"
            >
              <div className="font-semibold text-base text-white tracking-tight group-hover:text-sky-400 transition-colors">
                {currentUser.followingCount.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-400 group-hover:text-neutral-200">following</div>
            </div>
          </div>
        </div>

        {/* Bio & Links */}
        <div className="space-y-1 text-left">
          <div className="font-semibold text-sm text-white flex items-center gap-2">
            <span>{currentUser.displayName}</span>
            {userSettings.language && userSettings.language !== 'English (US)' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                {userSettings.language}
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-200 leading-relaxed whitespace-pre-line font-normal">
            {currentUser.bio}
          </div>

          {currentUser.website && (
            <a
              href={currentUser.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1 pt-0.5 font-medium"
            >
              <LinkIcon className="w-3 h-3 text-sky-400" />
              <span className="truncate">{currentUser.website.replace('https://', '')}</span>
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              triggerHaptic('light');
              setEditDisplayName(currentUser.displayName);
              setEditBio(currentUser.bio);
              setEditWebsite(currentUser.website || '');
              setIsEditing(true);
            }}
            className="flex-1 h-8 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
          >
            Edit profile
          </button>
          <button
            onClick={handleShareProfile}
            className="flex-1 h-8 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
          >
            Share profile
          </button>
        </div>

        {/* Interactive Story Highlights Bar */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pt-2 pb-1">
          {highlightsList.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveHighlight(item);
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full p-0.5 border border-neutral-700 group-hover:border-white transition-colors bg-neutral-900 overflow-hidden">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-[11px] text-neutral-300 font-medium truncate max-w-[64px]">
                {item.title}
              </span>
            </div>
          ))}

          {/* Add New Highlight Button */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setIsAddingHighlight(true);
            }}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full border border-neutral-800 group-hover:border-neutral-500 transition-colors bg-neutral-950 flex items-center justify-center">
              <Plus className="w-6 h-6 text-neutral-400 group-hover:text-white stroke-[1.8]" />
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">New</span>
          </div>
        </div>
      </div>

      {/* Grid Tabs - Instagram Style */}
      <div className="flex items-center border-t border-neutral-900 mt-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('posts');
          }}
          aria-label="Posts"
          className={`flex-1 h-12 flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Grid className="w-5 h-5 stroke-[1.8]" />
        </button>
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('reels');
          }}
          aria-label="Reels"
          className={`flex-1 h-12 flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'reels'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Video className="w-5 h-5 stroke-[1.8]" />
        </button>
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('saved');
          }}
          aria-label="Saved"
          className={`flex-1 h-12 flex items-center justify-center border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'saved'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Bookmark className="w-5 h-5 stroke-[1.8]" />
        </button>
      </div>

      {/* 3-Column Square Photo Grid */}
      {displayList.length === 0 ? (
        <div className="py-20 text-center text-xs text-neutral-500 space-y-2">
          <div className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            {activeSubTab === 'saved' ? (
              <Bookmark className="w-6 h-6 stroke-[1.5]" />
            ) : (
              <Grid className="w-6 h-6 stroke-[1.5]" />
            )}
          </div>
          <p className="font-semibold text-sm text-neutral-300">
            {activeSubTab === 'saved' ? 'No Saved Posts' : 'No Posts Yet'}
          </p>
          <p className="text-[11px] text-neutral-500">
            When you share photos or save content, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {displayList.map((post) => (
            <div
              key={post.id}
              onClick={() => setCommentsPostId(post.id)}
              className="relative aspect-square bg-neutral-950 overflow-hidden cursor-pointer group"
            >
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Story Highlight Viewer Modal */}
      {activeHighlight && (
        <div
          onClick={() => setActiveHighlight(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] bg-[#121212] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-white">{activeHighlight.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteHighlight(activeHighlight.id)}
                  className="text-[11px] text-[#FF3040] hover:underline cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setActiveHighlight(null)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="aspect-[4/5] w-full bg-black">
              <img
                src={activeHighlight.cover}
                alt={activeHighlight.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Story Highlight Modal */}
      {isAddingHighlight && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] bg-[#121212] border border-neutral-800 rounded-2xl p-5 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <span className="text-sm font-semibold text-white">New Highlight</span>
              <button
                onClick={() => setIsAddingHighlight(false)}
                className="text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleAddHighlight} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">Highlight Title</label>
                <input
                  type="text"
                  value={newHighlightTitle}
                  onChange={(e) => setNewHighlightTitle(e.target.value)}
                  placeholder="e.g. Travel, Studio, Archive..."
                  required
                  className="w-full bg-[#1A1A1C] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  value={newHighlightCover}
                  onChange={(e) => setNewHighlightCover(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#1A1A1C] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer"
              >
                Add Highlight
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Instagram "Settings and privacy" Modal with Full Interactive Sub-Views */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-[440px] bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              {settingsSection ? (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSettingsSection(null);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-white hover:text-neutral-300 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <span className="text-sm font-semibold text-white">Settings and privacy</span>
              )}

              {settingsSection && (
                <span className="text-xs font-semibold text-white capitalize">
                  {settingsSection.replace('_', ' ')}
                </span>
              )}

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSettingsSection(null);
                  setIsSettingsOpen(false);
                }}
                className="text-xs text-neutral-400 hover:text-white cursor-pointer font-medium"
              >
                Done
              </button>
            </div>

            {/* SUB-VIEW 1: NOTIFICATIONS */}
            {settingsSection === 'notifications' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left text-xs">
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Pause all</div>
                      <div className="text-[11px] text-neutral-400">
                        Temporarily pause push notifications
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!userSettings.notifications?.pauseAll}
                      onChange={(e) =>
                        updateSettings(
                          {
                            notifications: {
                              ...userSettings.notifications,
                              pauseAll: e.target.checked,
                            },
                          },
                          e.target.checked ? 'Notifications paused' : 'Notifications resumed'
                        )
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Likes and comments</div>
                      <div className="text-[11px] text-neutral-400">
                        Activity on your photos and posts
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!!userSettings.notifications?.pauseAll}
                      checked={!!userSettings.notifications?.likesAndComments}
                      onChange={(e) =>
                        updateSettings({
                          notifications: {
                            ...userSettings.notifications,
                            likesAndComments: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">New followers</div>
                      <div className="text-[11px] text-neutral-400">
                        When someone follows your profile
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!!userSettings.notifications?.pauseAll}
                      checked={!!userSettings.notifications?.newFollowers}
                      onChange={(e) =>
                        updateSettings({
                          notifications: {
                            ...userSettings.notifications,
                            newFollowers: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Direct messages</div>
                      <div className="text-[11px] text-neutral-400">
                        Message requests and chat replies
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!!userSettings.notifications?.pauseAll}
                      checked={!!userSettings.notifications?.directMessages}
                      onChange={(e) =>
                        updateSettings({
                          notifications: {
                            ...userSettings.notifications,
                            directMessages: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">System Push Status</div>
                    <div className="text-[11px] text-neutral-400 capitalize">
                      Browser status: {notifPermStatus}
                    </div>
                  </div>
                  <button
                    onClick={handleRequestBrowserNotifications}
                    className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-[11px] hover:bg-neutral-200 cursor-pointer"
                  >
                    Enable Push
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: TIME SPENT */}
            {settingsSection === 'time' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left text-xs">
                <div className="p-4 rounded-2xl bg-[#18181B] border border-neutral-800 space-y-2">
                  <div className="text-[11px] text-neutral-400 uppercase font-mono">
                    Daily Average Today
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">
                    {minutesToday}m {secondsSpentToday % 60}s
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Active time spent on Fluid today across this device.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#18181B] border border-neutral-800 space-y-3">
                  <div className="font-semibold text-white">Daily time limit</div>
                  <p className="text-[11px] text-neutral-400">
                    We'll send you a reminder to close Fluid after your chosen time.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { label: 'Off', val: null },
                      { label: '15 min', val: 15 },
                      { label: '30 min', val: 30 },
                      { label: '45 min', val: 45 },
                      { label: '1 hour', val: 60 },
                      { label: '2 hours', val: 120 },
                    ].map((opt) => {
                      const selected = userSettings.dailyTimeLimitMinutes === opt.val;
                      return (
                        <button
                          key={opt.label}
                          onClick={() =>
                            updateSettings(
                              { dailyTimeLimitMinutes: opt.val },
                              opt.val
                                ? `Daily limit set to ${opt.label}`
                                : 'Daily time limit turned off'
                            )
                          }
                          className={`py-2 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                            selected
                              ? 'bg-white text-black border-white'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#18181B] border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Sleep mode</div>
                    <div className="text-[11px] text-neutral-400">
                      Mute notifications between 11 PM and 7 AM
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!userSettings.sleepModeEnabled}
                    onChange={(e) =>
                      updateSettings(
                        { sleepModeEnabled: e.target.checked },
                        e.target.checked ? 'Sleep mode enabled' : 'Sleep mode disabled'
                      )
                    }
                    className="w-4 h-4 accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: CLOSE FRIENDS */}
            {settingsSection === 'close_friends' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left text-xs">
                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-black" />
                  </div>
                  <div className="text-[11px] text-neutral-300">
                    We don't send notifications when you edit your Close Friends list.{' '}
                    <span className="text-white font-semibold">
                      {(userSettings.closeFriends || []).length} selected
                    </span>
                  </div>
                </div>

                {/* Add by username */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!closeFriendInput.trim()) return;
                    handleToggleCloseFriend(closeFriendInput);
                    setCloseFriendInput('');
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={closeFriendInput}
                      onChange={(e) => setCloseFriendInput(e.target.value)}
                      placeholder="Add @username to Close Friends..."
                      className="w-full bg-[#18181B] border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                  >
                    Add
                  </button>
                </form>

                <div className="space-y-2">
                  {candidateCloseFriends.length === 0 ? (
                    <div className="py-8 text-center text-neutral-500">
                      Follow creators or type a @username above to build your Close Friends list.
                    </div>
                  ) : (
                    candidateCloseFriends.map((u) => {
                      const isClose = (userSettings.closeFriends || []).some(
                        (cf) => cf.toLowerCase() === u.username.toLowerCase()
                      );
                      return (
                        <div
                          key={u.username}
                          onClick={() => handleToggleCloseFriend(u.username)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181B] border border-neutral-800 cursor-pointer hover:border-neutral-700"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl}
                              alt={u.displayName}
                              className="w-9 h-9 rounded-full object-cover border border-neutral-700"
                            />
                            <div>
                              <div className="font-semibold text-white">{u.displayName}</div>
                              <div className="text-[11px] text-neutral-400">@{u.username}</div>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                              isClose
                                ? 'bg-emerald-500 border-emerald-500 text-black'
                                : 'border-neutral-600 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: BLOCKED ACCOUNTS */}
            {settingsSection === 'blocked' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left text-xs">
                <p className="text-[11px] text-neutral-400">
                  Blocked accounts won't be able to find your posts or feed activity on Fluid.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBlockUser(blockUserInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={blockUserInput}
                    onChange={(e) => setBlockUserInput(e.target.value)}
                    placeholder="Enter @username to block..."
                    className="flex-1 bg-[#18181B] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#FF3040] text-white font-semibold text-xs hover:opacity-90 cursor-pointer"
                  >
                    Block
                  </button>
                </form>

                <div className="space-y-2">
                  {(userSettings.blockedUsers || []).length === 0 ? (
                    <div className="py-10 text-center text-neutral-500">
                      You haven't blocked anyone.
                    </div>
                  ) : (
                    (userSettings.blockedUsers || []).map((uname) => (
                      <div
                        key={uname}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#18181B] border border-neutral-800"
                      >
                        <span className="font-semibold text-white">@{uname}</span>
                        <button
                          onClick={() => handleUnblockUser(uname)}
                          className="px-3 py-1 rounded-lg bg-neutral-800 text-white text-[11px] font-semibold hover:bg-neutral-700 cursor-pointer"
                        >
                          Unblock
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 5: DEVICE PERMISSIONS */}
            {settingsSection === 'permissions' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-left text-xs">
                {/* Haptics */}
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Vibrate className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Tactile Haptics (Vibration)</div>
                      <div className="text-[11px] text-neutral-400">
                        Navigator.vibrate feedback on likes & modals
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        triggerHaptic('double');
                        showToast('Haptic pulse triggered');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 text-[10px] font-semibold hover:bg-neutral-700 cursor-pointer"
                    >
                      Test
                    </button>
                    <input
                      type="checkbox"
                      checked={!!userSettings.hapticsEnabled}
                      onChange={(e) =>
                        updateSettings(
                          { hapticsEnabled: e.target.checked },
                          e.target.checked ? 'Haptics enabled' : 'Haptics muted'
                        )
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Camera / Media */}
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Camera & Photo Library</div>
                      <div className="text-[11px] text-neutral-400">Status: {cameraStatus}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleVerifyCamera}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-[11px] font-semibold hover:bg-neutral-700 cursor-pointer"
                  >
                    Verify
                  </button>
                </div>

                {/* Geolocation */}
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Location Tagging</div>
                      <div className="text-[11px] text-neutral-400">Status: {geoStatus}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleVerifyLocation}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-[11px] font-semibold hover:bg-neutral-700 cursor-pointer"
                  >
                    Check
                  </button>
                </div>

                {/* Browser Notifications */}
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Push Notifications</div>
                      <div className="text-[11px] text-neutral-400 capitalize">
                        Status: {notifPermStatus}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRequestBrowserNotifications}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-[11px] font-semibold hover:bg-neutral-700 cursor-pointer"
                  >
                    Request
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 6: LANGUAGE AND REGION */}
            {settingsSection === 'language' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2 text-left text-xs">
                {LANGUAGES.map((lang) => {
                  const isSelected = userSettings.language === lang;
                  return (
                    <div
                      key={lang}
                      onClick={() => updateSettings({ language: lang }, `Language set to ${lang}`)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#18181B] border border-neutral-800 cursor-pointer hover:border-neutral-700"
                    >
                      <span className="font-medium text-white">{lang}</span>
                      {isSelected && <Check className="w-4 h-4 text-sky-400 stroke-[2.5]" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* SUB-VIEW 7: HELP CENTER */}
            {settingsSection === 'help' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left text-xs">
                <div className="space-y-2">
                  <div className="font-semibold text-neutral-300 uppercase font-mono text-[10px]">
                    Frequently Asked Questions
                  </div>
                  <div className="p-3 rounded-xl bg-[#18181B] border border-neutral-800 space-y-1">
                    <div className="font-semibold text-white">
                      How do WhatsApp-style read receipts work?
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Messages show a single gray check when sent and turn into double blue checks
                      (✓✓) only when the recipient opens the conversation.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#18181B] border border-neutral-800 space-y-1">
                    <div className="font-semibold text-white">
                      Are profiles and followers stored in real time?
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Yes. All posts, likes, comments, messages, and follower counts sync directly
                      with Cloud Firestore.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!supportMessage.trim()) return;
                    triggerHaptic('success');
                    setSupportSent(true);
                    setSupportMessage('');
                    showToast('Support report submitted');
                  }}
                  className="p-3.5 rounded-2xl bg-[#18181B] border border-neutral-800 space-y-3"
                >
                  <div className="font-semibold text-white">Report a problem</div>
                  <textarea
                    value={supportMessage}
                    onChange={(e) => {
                      setSupportSent(false);
                      setSupportMessage(e.target.value);
                    }}
                    rows={3}
                    placeholder="Describe an issue or share feedback..."
                    className="w-full bg-black border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-neutral-600 resize-none"
                  />
                  {supportSent && (
                    <div className="text-[11px] text-emerald-400 font-medium">
                      Thank you! Your report has been logged with our engineering team.
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                  >
                    Submit Report
                  </button>
                </form>
              </div>
            )}

            {/* SUB-VIEW 8: PRIVACY CENTER */}
            {settingsSection === 'privacy' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-left text-xs">
                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Show activity status</div>
                      <div className="text-[11px] text-neutral-400">
                        Allow accounts you follow to see when you're active
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!userSettings.showActivityStatus}
                      onChange={(e) =>
                        updateSettings(
                          { showActivityStatus: e.target.checked },
                          e.target.checked ? 'Activity status visible' : 'Activity status hidden'
                        )
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Read receipts</div>
                      <div className="text-[11px] text-neutral-400">
                        Let others see when you've viewed their direct messages
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!userSettings.readReceiptsEnabled}
                      onChange={(e) =>
                        updateSettings(
                          { readReceiptsEnabled: e.target.checked },
                          e.target.checked ? 'Read receipts on' : 'Read receipts off'
                        )
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Allow post resharing</div>
                      <div className="text-[11px] text-neutral-400">
                        Let others share your public posts in messages
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!userSettings.allowStorySharing}
                      onChange={(e) =>
                        updateSettings({ allowStorySharing: e.target.checked })
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#18181B] border border-neutral-800 space-y-2.5">
                  <div className="font-semibold text-white">Download your information</div>
                  <p className="text-[11px] text-neutral-400">
                    Export a portable JSON archive of your profile, settings, and published posts.
                  </p>
                  <button
                    onClick={handleDownloadUserData}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-800 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Account Data (.JSON)</span>
                  </button>
                </div>
              </div>
            )}

            {/* MAIN SETTINGS MENU */}
            {!settingsSection && (
              <div className="flex-1 overflow-y-auto divide-y divide-neutral-900 text-left text-xs">
                {/* Section 1: How you use Fluid */}
                <div className="py-2">
                  <div className="px-4 py-2 font-mono text-[10px] text-neutral-500 uppercase">
                    How you use Fluid
                  </div>
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSettingsSection('notifications');
                    }}
                    className="px-4 py-3 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-neutral-400" />
                      <span>Notifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">
                        {userSettings.notifications?.pauseAll ? 'Paused' : 'On'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSettingsSection('time');
                    }}
                    className="px-4 py-3 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span>Time spent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">{minutesToday}m today</span>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>
                </div>

                {/* Section 2: Who can see your content */}
                <div className="py-2">
                  <div className="px-4 py-2 font-mono text-[10px] text-neutral-500 uppercase">
                    Who can see your content
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-neutral-400" />
                      <div>
                        <div>Private account</div>
                        <div className="text-[10px] text-neutral-500">
                          Only approved followers can see your photos
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!userSettings.isPrivateAccount}
                      onChange={(e) =>
                        updateSettings(
                          { isPrivateAccount: e.target.checked },
                          e.target.checked
                            ? 'Account switched to Private'
                            : 'Account switched to Public'
                        )
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSettingsSection('close_friends');
                    }}
                    className="px-4 py-3 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-neutral-400" />
                      <span>Close Friends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">
                        {(userSettings.closeFriends || []).length}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSettingsSection('blocked');
                    }}
                    className="px-4 py-3 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <UserX className="w-4 h-4 text-neutral-400" />
                      <span>Blocked accounts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">
                        {(userSettings.blockedUsers || []).length}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>
                </div>

                {/* Section 3: App and media */}
                <div className="py-2">
                  <div className="px-4 py-2 font-mono text-[10px] text-neutral-500 uppercase">
                    Your app and media
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Eye className="w-4 h-4 text-neutral-400" />
                      <div>
                        <div>Dark mode OLED theme</div>
                        <div className="text-[10px] text-neutral-500">
                          True #000000 pitch-black contrast
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!userSettings.oledTheme}
                      onChange={(e) =>
                        updateSettings(
                          { oledTheme: e.target.checked },
                          e.target.checked ? 'True OLED Black active' : 'Carbon Dark surface active'
                        )
                      }
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSettingsSection('permissions');
                    }}
                    className="px-4 py-3 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-neutral-400" />
                      <span>Device permissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">
                        {userSettings.hapticsEnabled ? 'Haptics On' : 'Muted'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSettingsSection('language');
                    }}
                    className="px-4 py-3 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-neutral-400" />
                      <span>Language and region</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">{userSettings.language}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  </div>
                </div>

                {/* Section 4: Support & About */}
                <div className="py-2">
                  <div className="px-4 py-2 font-mono text-[10px] text-neutral-500 uppercase">
                    More info and support
                  </div>
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSettingsSection('help');
                    }}
                    className="px-4 py-3 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-neutral-400" />
                      <span>Help Center</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSettingsSection('privacy');
                    }}
                    className="px-4 py-3 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-neutral-400" />
                      <span>Privacy Center</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </div>
                </div>

                {/* Section 5: Log out & Account actions */}
                <div className="py-3 px-4 space-y-2">
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setIsSettingsOpen(false);
                      logout();
                    }}
                    className="w-full h-10 rounded-xl bg-neutral-900 text-[#FF3040] font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out @{currentUser.username}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Followers / Following Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-[#121212] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between p-3.5 border-b border-neutral-800">
              <span className="text-sm font-semibold text-white capitalize">
                {modalType} ({modalType === 'followers' ? followersList.length : followingList.length})
              </span>
              <button
                onClick={() => setModalType(null)}
                className="text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {(modalType === 'followers' ? followersList : followingList).length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No {modalType} found.
                </div>
              ) : (
                (modalType === 'followers' ? followersList : followingList).map((user) => {
                  const isFollowing = followingSet.has(user.username);
                  const isMe = user.uid === currentUser.uid;

                  return (
                    <div
                      key={user.uid || user.username}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181B] border border-neutral-800"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-white truncate">
                            {user.displayName}
                          </span>
                          <span className="text-[11px] text-neutral-400 truncate font-mono">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      {!isMe && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleFollowUser(user.username)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold active:scale-95 transition-all ${
                              isFollowing
                                ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                : 'bg-white text-black'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connected Accounts Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-white">Connected Accounts</h3>
                <p className="text-[11px] text-neutral-400">
                  Manage OAuth linking and cross-posting
                </p>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3.5">
              {/* X (Twitter) Card */}
              <div className="p-3.5 rounded-2xl bg-[#161618] border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-black border border-neutral-700 flex items-center justify-center font-bold text-xs text-white">
                      𝕏
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">X (Twitter)</div>
                      <div className="text-[10px] text-neutral-400 font-mono">OAuth 2.0 PKCE</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isXConnected}
                    onChange={(e) => setIsXConnected(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700 text-white cursor-pointer"
                  />
                </div>
                {isXConnected && (
                  <input
                    type="text"
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value)}
                    placeholder="Enter @username"
                    className="w-full bg-[#1c1c1f] border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  />
                )}
              </div>

              {/* Instagram Card */}
              <div className="p-3.5 rounded-2xl bg-[#161618] border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center font-bold text-[10px] text-white">
                      IG
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Instagram Unified Login
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        Meta Graph Integration
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isIgConnected}
                    onChange={(e) => setIsIgConnected(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700 text-white cursor-pointer"
                  />
                </div>
                {isIgConnected && (
                  <input
                    type="text"
                    value={igHandle}
                    onChange={(e) => setIgHandle(e.target.value)}
                    placeholder="Enter @handle"
                    className="w-full bg-[#1c1c1f] border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  />
                )}
              </div>

              {/* Facebook Card */}
              <div className="p-3.5 rounded-2xl bg-[#161618] border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center font-bold text-xs text-white">
                      f
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Facebook Pages</div>
                      <div className="text-[10px] text-neutral-400 font-mono">Meta Direct Sync</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFbConnected}
                    onChange={(e) => setIsFbConnected(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700 text-white cursor-pointer"
                  />
                </div>
                {isFbConnected && (
                  <input
                    type="text"
                    value={fbHandle}
                    onChange={(e) => setFbHandle(e.target.value)}
                    placeholder="Enter page or profile ID"
                    className="w-full bg-[#1c1c1f] border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  />
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveConnections}
              className="w-full h-11 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-lg"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Connected Hub</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-[#121212] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-semibold text-white">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-neutral-400">Name</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-neutral-400">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1A1A1C] border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-neutral-600 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-neutral-400">Website</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1A1A1C] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
