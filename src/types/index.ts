export interface ConnectedAccountInfo {
  connected: boolean;
  handle: string;
  avatar?: string;
  autoSync?: boolean;
  connectedAt?: string;
}

export interface UserSettings {
  isPrivateAccount?: boolean;
  oledTheme?: boolean;
  hapticsEnabled?: boolean;
  showActivityStatus?: boolean;
  readReceiptsEnabled?: boolean;
  allowStorySharing?: boolean;
  language?: string;
  dailyTimeLimitMinutes?: number | null;
  sleepModeEnabled?: boolean;
  notifications?: {
    pauseAll?: boolean;
    likesAndComments?: boolean;
    newFollowers?: boolean;
    directMessages?: boolean;
  };
  closeFriends?: string[];
  blockedUsers?: string[];
  highlights?: {
    id: string;
    title: string;
    cover: string;
  }[];
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  createdAt: string;
  // Onboarding & Preferences
  interests?: string[];
  preferredSources?: ('news' | 'x' | 'instagram' | 'facebook')[];
  // Telemetry affinity scores by tag (e.g. { tech: 25, music: 14 })
  affinityScores?: Record<string, number>;
  // Connected 3P accounts
  connectedAccounts?: {
    x?: ConnectedAccountInfo;
    instagram?: ConnectedAccountInfo;
    facebook?: ConnectedAccountInfo;
  };
  // Functional Instagram Settings & Privacy
  settings?: UserSettings;
}

export interface UrlEmbedData {
  url: string;
  title: string;
  description: string;
  domain: string;
  source: 'news' | 'x' | 'instagram' | 'facebook' | 'web';
  author?: string;
  imageUrl?: string;
  publishedAt?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string;
  imageUrl: string;
  aspectRatio: '1:1' | '4:5';
  caption: string;
  location?: string;
  audioTrack?: string;
  tags?: string[];
  embedUrl?: string;
  embedData?: UrlEmbedData;
  crossPostedTo?: ('x' | 'instagram' | 'facebook')[];
  likesCount: number;
  likedBy: string[]; // array of user UIDs
  isLiked?: boolean;
  isBookmarked?: boolean;
  commentsCount: number;
  createdAt: string;
  authorVerified?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl: string;
  text: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
}

export interface Story {
  id: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl: string;
  mediaUrl: string;
  hasUnviewed: boolean;
  createdAt: string;
  caption?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface PulseItem {
  id: string;
  source: 'news' | 'x' | 'instagram' | 'facebook';
  sourceName: string;
  title: string;
  summary: string;
  url: string;
  timestamp: string;
  topic: string;
  tags: string[];
  likesCount?: number;
  imageUrl?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string;
  text: string;
  createdAt: string;
  status?: MessageStatus;
  isRead?: boolean;
  readAt?: string;
  reaction?: string;
  imageUrl?: string;
  audioDuration?: string;
  sharedPost?: {
    id: string;
    imageUrl: string;
    authorUsername: string;
    caption: string;
  };
  sharedPulse?: PulseItem;
  embedData?: UrlEmbedData;
}

export interface UserNote {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  noteText: string;
  musicTrack?: string;
  createdAt: string;
  isCurrentUser?: boolean;
}

export interface ChatThread {
  id: string;
  participants: string[]; // UIDs
  otherUser: {
    uid: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isOnline?: boolean;
  };
  lastMessage: string;
  lastMessageSenderId: string;
  lastMessageStatus?: MessageStatus;
  lastMessageRead?: boolean;
  updatedAt: string;
  unreadCount: number;
  category?: 'primary' | 'general' | 'requests';
}

export type ActiveTab = 'home' | 'explore' | 'create' | 'messages' | 'profile';
export type FeedFilterMode = 'following' | 'for_you';
export type SourceFilter = 'all' | 'news' | 'x' | 'instagram' | 'facebook';

export interface InteractionSignal {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'bookmark' | 'pulse_click';
  targetId: string;
  tags: string[];
  weight: number;
  createdAt: string;
}
