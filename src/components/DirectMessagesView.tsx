import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  Send,
  Heart,
  SquarePen,
  Search,
  X,
  Phone,
  Video,
  Info,
  Loader2,
  Check,
  CheckCheck,
  Clock,
  Camera,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Music,
  Plus,
  ArrowLeft,
  Smile,
  Image as ImageIcon,
  PhoneOff,
  Sparkles,
  BellOff,
  ShieldAlert,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserNote, Message } from '../types';
import { triggerHaptic } from '../services/haptics';

export const DirectMessagesView: React.FC = () => {
  const {
    chats,
    activeChat,
    activeChatMessages,
    openChat,
    closeChat,
    sendMessage,
    startChatWithUser,
    simulateRecipientRead,
    isRecipientTyping,
    setActiveTab,
    toggleMessageReaction,
    sendMediaMessage,
    sendVoiceMessage,
    deleteChatThread,
    notes,
    addUserNote,
  } = useSocial();

  const { currentUser, searchRegisteredUsers } = useAuth();

  // Chat input and composition state
  const [inputText, setInputText] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSearch, setComposeSearch] = useState('');
  const [composeResults, setComposeResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Inbox search and category filter
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxCategory, setInboxCategory] = useState<'primary' | 'general' | 'requests'>('primary');
  const [inboxSearchResults, setInboxSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Mobile modals and interactive overlays
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInputText, setNoteInputText] = useState('');
  const [noteTrackInput, setNoteTrackInput] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Camera / photo attachment tray
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Audio voice note recording simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Floating heart animation on double tap
  const [animatingHeartMsgId, setAnimatingHeartMsgId] = useState<string | null>(null);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);

  // Playing audio messages map
  const [playingAudioMsgId, setPlayingAudioMsgId] = useState<string | null>(null);

  // Thread options dropdown
  const [threadMenuId, setThreadMenuId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageStreamContainerRef = useRef<HTMLDivElement>(null);

  if (!currentUser) return null;

  // Find the ID of the last message sent by the current user
  const lastMyMessageId = useMemo(() => {
    for (let i = activeChatMessages.length - 1; i >= 0; i--) {
      if (activeChatMessages[i].senderId === currentUser.uid) {
        return activeChatMessages[i].id;
      }
    }
    return null;
  }, [activeChatMessages, currentUser.uid]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages.length, isRecipientTyping]);

  // Debounced search for new message compose modal
  useEffect(() => {
    let active = true;
    if (!composeSearch.trim()) {
      setComposeResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchRegisteredUsers(composeSearch);
      if (!active) return;
      setComposeResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [composeSearch, searchRegisteredUsers]);

  // Debounced search in DM inbox list
  useEffect(() => {
    let active = true;
    if (!inboxSearch.trim()) {
      setInboxSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);
    const timer = setTimeout(async () => {
      const results = await searchRegisteredUsers(inboxSearch);
      if (!active) return;
      setInboxSearchResults(results);
      setIsSearchingUsers(false);
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inboxSearch, searchRegisteredUsers]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeCallType) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCallType]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleSendHeart = () => {
    triggerHaptic('double');
    sendMessage('❤️');
  };

  // Double tap to like message (Instagram gesture)
  const lastTapRef = useRef<{ [msgId: string]: number }>({});
  const handleMessageTap = (msgId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[msgId] || 0;
    if (now - lastTap < 350) {
      // Double tap detected!
      triggerHaptic('double');
      toggleMessageReaction(activeChat!.id, msgId, '❤️');
      setAnimatingHeartMsgId(msgId);
      setTimeout(() => setAnimatingHeartMsgId(null), 900);
      lastTapRef.current[msgId] = 0;
    } else {
      lastTapRef.current[msgId] = now;
    }
  };

  // Send photo attachment from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      sendMediaMessage(result);
      setShowPhotoPicker(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Quick photo presets
  const quickPhotoPresets = [
    {
      label: 'Tokyo Neon',
      url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Studio Editorial',
      url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Golden Hour',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Cyber Sound',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    },
  ];

  // Filter conversations
  const filteredChats = useMemo(() => {
    let result = chats;
    if (inboxCategory === 'requests') {
      result = chats.filter((c) => c.category === 'requests');
    } else if (inboxCategory === 'general') {
      result = chats.filter((c) => c.category === 'general');
    } else {
      result = chats.filter((c) => !c.category || c.category === 'primary');
    }

    if (inboxSearch.trim()) {
      const term = inboxSearch.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.otherUser.displayName.toLowerCase().includes(term) ||
          c.otherUser.username.toLowerCase().includes(term) ||
          c.lastMessage.toLowerCase().includes(term)
      );
    }

    return result;
  }, [chats, inboxCategory, inboxSearch]);

  const currentUserNote = notes.find((n) => n.userId === currentUser.uid || n.isCurrentUser);

  // --------------------------------------------------------------------------
  // ACTIVE CHAT ROOM SCREEN (Full-Screen Mobile Optimized)
  // --------------------------------------------------------------------------
  if (activeChat) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col h-[100dvh] max-w-4xl mx-auto overflow-hidden select-none">
        {/* Sticky Mobile App Bar */}
        <header className="h-14 px-3 sm:px-4 border-b border-neutral-900 bg-black/95 backdrop-blur-xl flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Native Mobile Back Chevron */}
            <button
              onClick={() => {
                triggerHaptic('light');
                closeChat();
              }}
              aria-label="Back to messages inbox"
              className="p-1.5 -ml-1.5 rounded-full text-white hover:bg-neutral-900 active:scale-90 transition-transform cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* User Profile Header Trigger */}
            <div
              onClick={() => {
                triggerHaptic('light');
                setShowInfoModal(true);
              }}
              className="flex items-center gap-2.5 cursor-pointer active:opacity-75 transition-opacity min-w-0"
            >
              <div className="relative shrink-0">
                <img
                  src={activeChat.otherUser.avatarUrl}
                  alt={activeChat.otherUser.username}
                  className="w-9 h-9 rounded-full object-cover border border-neutral-800"
                />
                {activeChat.otherUser.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                  {activeChat.otherUser.displayName}
                </span>
                <span className="text-[10px] text-neutral-400 truncate leading-tight flex items-center gap-1">
                  {isRecipientTyping ? (
                    <span className="text-sky-400 font-medium animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                      Typing...
                    </span>
                  ) : activeChat.otherUser.isOnline ? (
                    <span className="text-emerald-400 font-medium">Active now</span>
                  ) : (
                    `@${activeChat.otherUser.username}`
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action Call & Info Icons */}
          <div className="flex items-center gap-1 sm:gap-2 text-neutral-300">
            <button
              onClick={() => {
                triggerHaptic('medium');
                setActiveCallType('audio');
              }}
              aria-label="Audio call"
              className="p-2 rounded-full hover:bg-neutral-900 active:scale-90 transition-all text-neutral-200 hover:text-white cursor-pointer"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.9]" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setActiveCallType('video');
              }}
              aria-label="Video call"
              className="p-2 rounded-full hover:bg-neutral-900 active:scale-90 transition-all text-neutral-200 hover:text-white cursor-pointer"
            >
              <Video className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.9]" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setShowInfoModal(true);
              }}
              aria-label="Conversation details"
              className="p-2 rounded-full hover:bg-neutral-900 active:scale-90 transition-all text-neutral-200 hover:text-white cursor-pointer"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.9]" />
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div
          ref={messageStreamContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3.5 overscroll-contain"
        >
          {/* Identity Header Card */}
          <div className="flex flex-col items-center py-6 text-center border-b border-neutral-900/60 mb-2">
            <div className="relative mb-2">
              <img
                src={activeChat.otherUser.avatarUrl}
                alt={activeChat.otherUser.displayName}
                className="w-18 h-18 rounded-full object-cover border-2 border-neutral-800"
              />
              {activeChat.otherUser.isOnline && (
                <span className="absolute bottom-0 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-white">
              {activeChat.otherUser.displayName}
            </h3>
            <span className="text-xs text-neutral-400">
              @{activeChat.otherUser.username} · Fluid Network
            </span>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('profile');
              }}
              className="mt-3 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-neutral-200 hover:text-white active:scale-95 transition-all cursor-pointer"
            >
              View Profile
            </button>
          </div>

          {/* Messages Feed */}
          {activeChatMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            const isLastMyMsg = isMe && msg.id === lastMyMessageId;
            const isRead = msg.isRead || msg.status === 'read';
            const isDelivered = msg.status === 'delivered';
            const isSending = msg.status === 'sending';
            const isAnimatingHeart = animatingHeartMsgId === msg.id;
            const isPickerOpen = activeReactionPickerMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col relative group ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Floating Heart Animation on Double-Tap */}
                {isAnimatingHeart && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in zoom-in-50 fade-in duration-300">
                    <Heart className="w-12 h-12 text-[#FF3040] fill-[#FF3040] drop-shadow-[0_4px_12px_rgba(255,48,64,0.6)] animate-pulse" />
                  </div>
                )}

                {/* Reaction Picker Bar (Shown on message tap / long-press) */}
                {isPickerOpen && (
                  <div className="mb-1.5 flex items-center gap-1.5 p-1 bg-neutral-900/95 border border-white/15 rounded-full shadow-2xl backdrop-blur-xl z-20 animate-in fade-in zoom-in-95 duration-150">
                    {['❤️', '😂', '😮', '😢', '🔥', '👍'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          toggleMessageReaction(activeChat.id, msg.id, emoji);
                          setActiveReactionPickerMsgId(null);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-sm rounded-full hover:bg-white/10 active:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      onClick={() => setActiveReactionPickerMsgId(null)}
                      className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Shared Post Card Preview */}
                {msg.sharedPost && (
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveTab('home');
                    }}
                    className="max-w-[260px] bg-[#1C1C1E] border border-neutral-800 rounded-2xl overflow-hidden mb-1 shadow-lg cursor-pointer active:scale-98 transition-transform"
                  >
                    <img
                      src={msg.sharedPost.imageUrl}
                      alt="Shared post"
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-2.5 space-y-0.5">
                      <div className="text-[11px] font-semibold text-white">
                        @{msg.sharedPost.authorUsername}
                      </div>
                      <div className="text-[11px] text-neutral-300 line-clamp-2">
                        {msg.sharedPost.caption}
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Image Attachment Message */}
                {msg.imageUrl && (
                  <div
                    onClick={() => setPreviewImageModal(msg.imageUrl!)}
                    className="max-w-[260px] sm:max-w-[300px] rounded-2xl overflow-hidden border border-neutral-800 mb-1 shadow-lg cursor-pointer active:scale-98 transition-transform group/img relative"
                  >
                    <img
                      src={msg.imageUrl}
                      alt="Attached photo"
                      className="w-full h-auto object-cover max-h-[340px]"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] bg-black/70 px-2 py-1 rounded text-white font-mono">
                        Tap to enlarge
                      </span>
                    </div>
                  </div>
                )}

                {/* Voice Message Audio Bubble */}
                {msg.audioDuration && (
                  <div
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl mb-1 ${
                      isMe
                        ? 'bg-gradient-to-r from-neutral-800 to-neutral-900 text-white rounded-br-sm border border-neutral-700'
                        : 'bg-[#1C1C1E] text-white rounded-bl-sm border border-neutral-800'
                    }`}
                  >
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setPlayingAudioMsgId(playingAudioMsgId === msg.id ? null : msg.id);
                      }}
                      className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 active:scale-90 transition-transform shadow cursor-pointer"
                    >
                      {playingAudioMsgId === msg.id ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      )}
                    </button>

                    <div className="flex flex-col gap-1 min-w-[140px]">
                      {/* Audio waveform visualization bars */}
                      <div className="flex items-center gap-1 h-5">
                        {[40, 70, 30, 90, 60, 100, 45, 80, 50, 65, 35, 85, 40].map((h, i) => (
                          <span
                            key={i}
                            style={{ height: `${h}%` }}
                            className={`w-1 rounded-full transition-all duration-200 ${
                              playingAudioMsgId === msg.id
                                ? 'bg-sky-400 animate-pulse'
                                : isMe
                                ? 'bg-neutral-400'
                                : 'bg-neutral-500'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono">
                        <span>{playingAudioMsgId === msg.id ? 'Playing...' : 'Voice memo'}</span>
                        <span>{msg.audioDuration}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Message Bubble (Double tap to heart) */}
                {msg.text && (
                  <div
                    onClick={() => handleMessageTap(msg.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      triggerHaptic('medium');
                      setActiveReactionPickerMsgId(msg.id);
                    }}
                    className={`max-w-[80%] sm:max-w-[75%] px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed cursor-pointer transition-transform active:scale-[0.98] relative ${
                      isMe
                        ? 'bg-white text-black font-normal rounded-2xl rounded-br-sm shadow-sm'
                        : 'bg-[#1C1C1E] text-white font-normal border border-neutral-800 rounded-2xl rounded-bl-sm'
                    }`}
                  >
                    {msg.text}

                    {/* Reaction Badge on Message Bubble */}
                    {msg.reaction && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMessageReaction(activeChat.id, msg.id, msg.reaction!);
                        }}
                        className={`absolute -bottom-2.5 ${
                          isMe ? 'left-2' : 'right-2'
                        } bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded-full text-xs shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform flex items-center gap-0.5`}
                      >
                        <span>{msg.reaction}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* If non-text message had a reaction */}
                {!msg.text && msg.reaction && (
                  <span
                    onClick={() => toggleMessageReaction(activeChat.id, msg.id, msg.reaction!)}
                    className="mt-0.5 bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded-full text-xs shadow-md cursor-pointer flex items-center gap-0.5"
                  >
                    <span>{msg.reaction}</span>
                  </span>
                )}

                {/* Bubble Timestamp & Status Row */}
                <div className="flex items-center gap-1.5 mt-1 px-1 select-none">
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {msg.createdAt}
                  </span>

                  {/* Micro delivery indicator for sender */}
                  {isMe && (
                    <span className="flex items-center">
                      {isRead ? (
                        <span
                          className="flex items-center text-sky-400"
                          title={msg.readAt ? `Read ${msg.readAt}` : 'Seen by recipient'}
                        >
                          <CheckCheck className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      ) : isDelivered ? (
                        <span
                          className="flex items-center text-neutral-400"
                          title="Delivered"
                        >
                          <CheckCheck className="w-3 h-3 stroke-[2]" />
                        </span>
                      ) : isSending ? (
                        <span className="flex items-center text-neutral-500">
                          <Clock className="w-2.5 h-2.5 animate-pulse" />
                        </span>
                      ) : (
                        <span className="flex items-center text-neutral-500" title="Sent">
                          <Check className="w-3 h-3 stroke-[2]" />
                        </span>
                      )}
                    </span>
                  )}

                  {/* Quick react button trigger on hover/mobile */}
                  <button
                    onClick={() => setActiveReactionPickerMsgId(msg.id)}
                    className="opacity-40 group-hover:opacity-100 text-neutral-400 hover:text-white transition-opacity p-0.5"
                    title="React"
                  >
                    <Smile className="w-3 h-3" />
                  </button>
                </div>

                {/* Instagram Native "Seen" Indicator on the Latest Sent Message */}
                {isLastMyMsg && (
                  <div className="mt-0.5 px-1 flex items-center justify-end select-none">
                    {isRead ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                        <span>Seen {msg.readAt && msg.readAt !== 'Just now' ? msg.readAt : ''}</span>
                        <div className="relative">
                          <img
                            src={activeChat.otherUser.avatarUrl}
                            alt={activeChat.otherUser.displayName}
                            className="w-3.5 h-3.5 rounded-full object-cover border border-neutral-700"
                          />
                        </div>
                      </div>
                    ) : isDelivered ? (
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                        <CheckCheck className="w-3 h-3 stroke-[2]" />
                        <span>Delivered</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                        <Check className="w-3 h-3 stroke-[2]" />
                        <span>Sent</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator bubble */}
          {isRecipientTyping && (
            <div className="flex items-end gap-2 pt-1 animate-in fade-in duration-200">
              <img
                src={activeChat.otherUser.avatarUrl}
                alt={activeChat.otherUser.displayName}
                className="w-6 h-6 rounded-full object-cover border border-neutral-800"
              />
              <div className="bg-[#1C1C1E] border border-neutral-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Photo Presets Drawer */}
        {showPhotoPicker && (
          <div className="p-3 bg-[#111113] border-t border-neutral-800 animate-in slide-in-from-bottom duration-200 select-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300">
                Share a Photo
              </span>
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-neutral-900 border border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center gap-1 text-neutral-300 hover:text-white hover:border-white transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5 text-sky-400" />
                <span className="text-[9px] font-medium">Device</span>
              </button>

              {quickPhotoPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    sendMediaMessage(preset.url);
                    setShowPhotoPicker(false);
                  }}
                  className="relative aspect-square rounded-xl overflow-hidden border border-neutral-800 group hover:border-sky-400 transition-all cursor-pointer"
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                    <span className="text-[8px] text-white font-medium truncate">
                      {preset.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voice Note Recording Live Banner */}
        {isRecordingVoice ? (
          <div className="p-3 border-t border-neutral-900 bg-[#121214] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-semibold text-red-400">
                {formatSeconds(recordingSeconds)}
              </span>
              <span className="text-[11px] text-neutral-400">
                Recording voice note...
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setIsRecordingVoice(false);
                }}
                className="px-3 py-1.5 rounded-full bg-neutral-900 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sendVoiceMessage(formatSeconds(recordingSeconds));
                  setIsRecordingVoice(false);
                }}
                className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-white cursor-pointer"
              >
                Send Note
              </button>
            </div>
          </div>
        ) : (
          /* Mobile Pinned Bottom Message Input Bar */
          <div className="p-2.5 sm:p-3 border-t border-neutral-900 bg-black/95 backdrop-blur-xl shrink-0">
            <form
              onSubmit={handleSendText}
              className="flex items-center gap-2 bg-[#161618] border border-neutral-800/80 rounded-full px-2.5 py-1.5"
            >
              {/* Camera Action Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowPhotoPicker(!showPhotoPicker);
                }}
                aria-label="Attach photo"
                className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 active:scale-90 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Camera className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Message Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message @${activeChat.otherUser.username}...`}
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none min-w-0 px-1"
              />

              {/* Dynamic Actions based on text entry */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  aria-label="Send message"
                  className="text-sky-400 font-semibold text-xs sm:text-sm active:scale-90 transition-transform px-2 py-1 cursor-pointer"
                >
                  Send
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Voice Note Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setIsRecordingVoice(true);
                    }}
                    aria-label="Record voice memo"
                    className="w-8 h-8 rounded-full text-neutral-400 hover:text-white active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
                  >
                    <Mic className="w-4 h-4 stroke-[2]" />
                  </button>

                  {/* Native Instagram Quick Heart */}
                  <button
                    type="button"
                    onClick={handleSendHeart}
                    aria-label="Send heart"
                    className="w-8 h-8 rounded-full text-[#FF3040] hover:scale-110 active:scale-75 transition-transform flex items-center justify-center cursor-pointer"
                  >
                    <Heart className="w-5 h-5 fill-[#FF3040] stroke-[#FF3040]" />
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Calling Overlay (Audio / Video Call Simulation) */}
        {activeCallType && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 animate-in fade-in duration-300">
            <div className="text-center pt-8 space-y-1">
              <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                {activeCallType === 'video' ? 'Fluid Video Call' : 'Fluid Voice Call'}
              </span>
              <h2 className="text-lg font-bold text-white">
                {activeChat.otherUser.displayName}
              </h2>
              <span className="text-xs text-sky-400 font-mono">
                {callDuration > 0 ? `Connected • ${formatSeconds(callDuration)}` : 'Connecting...'}
              </span>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-sky-500/40 animate-ping absolute inset-0 m-auto" />
              <img
                src={activeChat.otherUser.avatarUrl}
                alt={activeChat.otherUser.displayName}
                className="w-28 h-28 rounded-full object-cover border-4 border-neutral-800 shadow-2xl relative z-10"
              />
            </div>

            <div className="w-full max-w-xs flex items-center justify-around pb-8">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsCallMuted(!isCallMuted);
                }}
                className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                  isCallMuted
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-neutral-900 border-neutral-700 text-white'
                }`}
              >
                {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  setActiveCallType(null);
                }}
                className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
              >
                <PhoneOff className="w-6 h-6 stroke-[2.2]" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsSpeakerOn(!isSpeakerOn);
                }}
                className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                  isSpeakerOn
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                    : 'bg-neutral-900 border-neutral-700 text-white'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Conversation Details & Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full sm:max-w-md bg-[#121214] border-t sm:border border-neutral-800 rounded-t-2xl sm:rounded-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-sm font-semibold text-white">Details</span>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recipient Profile Header */}
              <div className="flex flex-col items-center text-center py-2">
                <img
                  src={activeChat.otherUser.avatarUrl}
                  alt={activeChat.otherUser.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-neutral-700 mb-2"
                />
                <span className="text-sm font-bold text-white">
                  {activeChat.otherUser.displayName}
                </span>
                <span className="text-xs text-neutral-400">
                  @{activeChat.otherUser.username}
                </span>
              </div>

              <div className="space-y-2 divide-y divide-neutral-900">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <BellOff className="w-4 h-4 text-neutral-400" />
                    <span>Mute Messages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMuted}
                    onChange={(e) => {
                      triggerHaptic('light');
                      setIsMuted(e.target.checked);
                    }}
                    className="toggle"
                  />
                </div>

                <div
                  onClick={() => {
                    deleteChatThread(activeChat.id);
                    setShowInfoModal(false);
                  }}
                  className="flex items-center gap-2 py-3 text-xs text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Chat</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Fullscreen Lightbox Modal */}
        {previewImageModal && (
          <div
            onClick={() => setPreviewImageModal(null)}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImageModal}
              alt="Expanded preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // INBOX SCREEN (Mobile-First Instagram Direct Layout)
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-black text-white select-none pb-24 md:pb-0">
      {/* Top Mobile Bar */}
      <div className="h-14 px-3 sm:px-4 border-b border-neutral-900 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2">
          {/* Back button to Home Stream */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('home');
            }}
            aria-label="Back to home stream"
            className="p-1.5 -ml-1 text-white hover:text-neutral-300 active:scale-90 transition-transform cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-base font-bold tracking-tight text-white">
              @{currentUser.username}
            </span>
            <span className="text-[10px] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono">
              DIRECT
            </span>
          </div>
        </div>

        {/* Compose New Message Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setIsComposeOpen(true);
          }}
          aria-label="New Message"
          className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white active:scale-90 transition-all cursor-pointer shadow"
        >
          <SquarePen className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Integrated Mobile Search Bar */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-neutral-900/60 bg-black">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={inboxSearch}
            onChange={(e) => setInboxSearch(e.target.value)}
            placeholder="Search messages or creators..."
            className="w-full bg-[#141416] border border-neutral-800/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {inboxSearch && (
            <button
              onClick={() => setInboxSearch('')}
              className="absolute right-2.5 p-1 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Instagram Mobile "Notes" Horizontal Tray */}
      <div className="px-3 sm:px-4 py-3 border-b border-neutral-900/60 bg-black overflow-x-auto no-scrollbar">
        <div className="flex items-start gap-4 min-w-max">
          {/* Current User's Note Bubble */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setShowNoteModal(true);
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="relative">
              {currentUserNote ? (
                /* Active user note thought bubble */
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 px-2.5 py-1 rounded-xl text-[10px] text-white whitespace-nowrap shadow-lg flex items-center gap-1 z-10 max-w-[120px] truncate">
                  {currentUserNote.musicTrack && (
                    <Music className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                  )}
                  <span className="truncate">{currentUserNote.noteText}</span>
                </div>
              ) : (
                /* Add Note (+) badge */
                <div className="absolute -top-1 right-0 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold border border-black z-10 shadow">
                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}

              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-neutral-700 group-hover:border-sky-400 transition-colors"
              />
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Your note</span>
          </div>

          {/* Online Registered Creators Notes */}
          {notes
            .filter((n) => !n.isCurrentUser && n.userId !== currentUser.uid)
            .map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  triggerHaptic('light');
                  startChatWithUser({
                    uid: note.userId,
                    username: note.username,
                    displayName: note.displayName,
                    avatarUrl: note.avatarUrl,
                  });
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer group relative"
              >
                {/* Floating Status Note Thought Bubble */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-md border border-neutral-700 px-2.5 py-0.5 rounded-xl text-[9px] text-white whitespace-nowrap shadow-lg flex items-center gap-1 z-10 max-w-[120px] truncate">
                  {note.musicTrack && (
                    <Music className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                  )}
                  <span className="truncate">{note.noteText}</span>
                </div>

                <div className="relative">
                  <img
                    src={note.avatarUrl}
                    alt={note.displayName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-neutral-800 group-hover:border-white transition-colors"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
                </div>
                <span className="text-[10px] text-neutral-300 font-medium truncate max-w-[64px]">
                  {note.displayName.split(' ')[0]}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Instagram Signature Category Filter Tabs */}
      <div className="flex items-center px-4 border-b border-neutral-900 bg-black">
        {(['primary', 'general', 'requests'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              triggerHaptic('light');
              setInboxCategory(cat);
            }}
            className={`flex-1 py-3 text-xs font-semibold capitalize relative transition-colors cursor-pointer ${
              inboxCategory === cat ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span>{cat}</span>
            {cat === 'requests' && (
              <span className="ml-1 text-[9px] px-1 py-0.2 bg-neutral-800 rounded-full text-neutral-400 font-mono">
                0
              </span>
            )}
            {inboxCategory === cat && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Search results for registered creators if search input is active */}
      {inboxSearch.trim() && (
        <div className="p-3 bg-neutral-950 border-b border-neutral-900">
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
            Registered Creators
          </div>
          {isSearchingUsers ? (
            <div className="py-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Searching creators...</span>
            </div>
          ) : inboxSearchResults.length > 0 ? (
            <div className="space-y-1">
              {inboxSearchResults.map((user) => (
                <div
                  key={user.uid}
                  onClick={() => {
                    startChatWithUser({
                      uid: user.uid,
                      username: user.username,
                      displayName: user.displayName,
                      avatarUrl: user.avatarUrl,
                    });
                    setInboxSearch('');
                  }}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full object-cover border border-neutral-800"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {user.displayName}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-400">
                    Message
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-neutral-500">
              No matching creators found for "{inboxSearch}"
            </div>
          )}
        </div>
      )}

      {/* Messages Thread List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-900/60">
        {filteredChats.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-300 shadow-xl">
              <Send className="w-6 h-6 -rotate-12" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Your Messages</h3>
              <p className="text-xs text-neutral-500 max-w-[280px] mx-auto leading-relaxed">
                Send private messages, photos, and voice notes with creators on Fluid.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsComposeOpen(true);
              }}
              className="px-5 py-2.5 bg-white text-black text-xs font-semibold rounded-xl hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer shadow"
            >
              Send Message
            </button>
          </div>
        ) : (
          filteredChats.map((thread) => {
            const isMyLast = thread.lastMessageSenderId === currentUser.uid;
            const isReadByRecipient = thread.lastMessageStatus === 'read' || thread.lastMessageRead;
            const isDelivered = thread.lastMessageStatus === 'delivered';

            return (
              <div
                key={thread.id}
                onClick={() => openChat(thread.id)}
                className="flex items-center justify-between px-3.5 sm:px-4 py-3.5 hover:bg-neutral-900/40 cursor-pointer active:bg-neutral-900/70 transition-colors group relative"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={thread.otherUser.avatarUrl}
                      alt={thread.otherUser.username}
                      className="w-12 h-12 rounded-full object-cover border border-neutral-800"
                    />
                    {thread.otherUser.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      {thread.otherUser.displayName}
                    </span>

                    {/* Thread snippet with read receipts */}
                    {isMyLast ? (
                      <div className="text-xs text-neutral-400 truncate mt-0.5 flex items-center gap-1.5">
                        {isReadByRecipient ? (
                          <span
                            className="flex items-center gap-1 text-sky-400 shrink-0 font-medium text-[11px]"
                            title="Seen by recipient"
                          >
                            <CheckCheck className="w-3 h-3 stroke-[2.5]" />
                            <span>Seen</span>
                          </span>
                        ) : isDelivered ? (
                          <span
                            className="flex items-center gap-1 text-neutral-400 shrink-0 text-[11px]"
                            title="Delivered"
                          >
                            <CheckCheck className="w-3 h-3 stroke-[2]" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <span
                            className="flex items-center gap-1 text-neutral-500 shrink-0 text-[11px]"
                            title="Sent"
                          >
                            <Check className="w-3 h-3 stroke-[2]" />
                            <span>Sent</span>
                          </span>
                        )}
                        <span className="truncate text-neutral-400">
                          · {thread.lastMessage}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`text-xs truncate mt-0.5 ${
                          thread.unreadCount > 0
                            ? 'text-white font-medium'
                            : 'text-neutral-400'
                        }`}
                      >
                        {thread.lastMessage} · {thread.updatedAt}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side indicators and camera shortcut */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {thread.unreadCount > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF3040]" />
                  )}

                  {/* Direct Camera Shortcut Button (Native Instagram feature) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      openChat(thread.id);
                      setShowPhotoPicker(true);
                    }}
                    aria-label="Direct camera snap"
                    className="p-2 text-neutral-400 hover:text-white active:scale-90 transition-transform cursor-pointer"
                  >
                    <Camera className="w-4 h-4 stroke-[1.8]" />
                  </button>

                  {/* 3-dots Menu for Thread */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      setThreadMenuId(threadMenuId === thread.id ? null : thread.id);
                    }}
                    className="p-1.5 text-neutral-500 hover:text-white"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Thread Dropdown Menu */}
                {threadMenuId === thread.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-4 top-12 z-30 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => {
                        deleteChatThread(thread.id);
                        setThreadMenuId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-neutral-800 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Share / Update Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#141416] border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-sm font-semibold text-white">Share a note</span>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={noteInputText}
                  onChange={(e) => setNoteInputText(e.target.value.slice(0, 60))}
                  placeholder="Share what's on your mind... (60 chars)"
                  rows={2}
                  className="w-full bg-[#1A1A1D] border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 resize-none"
                />
                <span className="absolute bottom-2 right-2 text-[10px] text-neutral-500 font-mono">
                  {noteInputText.length}/60
                </span>
              </div>

              <div className="relative flex items-center">
                <Music className="w-3.5 h-3.5 text-neutral-400 absolute left-3" />
                <input
                  type="text"
                  value={noteTrackInput}
                  onChange={(e) => setNoteTrackInput(e.target.value)}
                  placeholder="Soundtrack (e.g. Fred again.. • Jungle)"
                  className="w-full bg-[#1A1A1D] border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!noteInputText.trim()) return;
                addUserNote(noteInputText, noteTrackInput);
                setNoteInputText('');
                setNoteTrackInput('');
                setShowNoteModal(false);
              }}
              disabled={!noteInputText.trim()}
              className="w-full py-2.5 bg-white text-black font-semibold text-xs rounded-xl disabled:opacity-40 hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer"
            >
              Share Note
            </button>
          </div>
        </div>
      )}

      {/* Compose New Message Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-[#121212] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-3.5 border-b border-neutral-800">
              <span className="text-sm font-semibold text-white">New Message</span>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            <div className="p-3 border-b border-neutral-800">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={composeSearch}
                  onChange={(e) => setComposeSearch(e.target.value)}
                  placeholder="Search registered creators by @user_id..."
                  autoFocus
                  className="w-full bg-[#1A1A1C] border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[180px]">
              {isSearching ? (
                <div className="py-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  <span>Searching creators in Firestore...</span>
                </div>
              ) : composeResults.length > 0 ? (
                composeResults.map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => {
                      startChatWithUser({
                        uid: user.uid,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl,
                      });
                      setIsComposeOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-900 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {user.displayName}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-sky-400 hover:text-white">
                      Chat
                    </span>
                  </div>
                ))
              ) : composeSearch ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No creators found for "@{composeSearch}".
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-neutral-500 space-y-1">
                  <p>Type a creator's name or User ID</p>
                  <p className="text-[10px] text-neutral-600">
                    Connects directly to actual registered users in the network
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
