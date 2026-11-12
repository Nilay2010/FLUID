import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocialProvider, useSocial } from './context/SocialContext';
import { SplashScreen } from './components/SplashScreen';
import { GoogleAuthPage } from './components/GoogleAuthPage';
import { UsernameOnboardingModal } from './components/UsernameOnboardingModal';
import { TopHeader } from './components/TopHeader';
import { LiveMomentsBar } from './components/LiveMomentsBar';
import { FeedFilterBar } from './components/FeedFilterBar';
import { PostCard } from './components/PostCard';
import { EmptyFeedState } from './components/EmptyFeedState';
import { FloatingCommandDock } from './components/FloatingCommandDock';
import { CreatePostModal } from './components/CreatePostModal';
import { CommentsDrawer } from './components/CommentsDrawer';
import { SharePostModal } from './components/SharePostModal';
import { StoryViewerModal } from './components/StoryViewerModal';
import { DirectMessagesView } from './components/DirectMessagesView';
import { ExploreView } from './components/ExploreView';
import { ProfileView } from './components/ProfileView';
import { NotificationsModal } from './components/NotificationsModal';
import { FriendSuggestions } from './components/FriendSuggestions';

import { ArrowDown, Loader2, Check } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isLoading, firebaseUser, currentUser, needsOnboarding } = useAuth();
  const { activeTab, posts, refreshPosts, isRefreshing, feedMode, forYouFeed, pulseItems, activeChat } = useSocial();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  const PULL_THRESHOLD = 48;
  const MAX_PULL = 78;

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 2) {
      setStartY(e.touches[0].clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || startY === null || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0 && window.scrollY <= 2) {
      const distance = Math.min(MAX_PULL, diff * 0.45);
      setPullY(distance);
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging) return;
    setIsDragging(false);
    setStartY(null);
    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      setPullY(PULL_THRESHOLD);
      try {
        await refreshPosts();
        setShowRefreshSuccess(true);
        setTimeout(() => setShowRefreshSuccess(false), 900);
      } finally {
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  };

  // Mouse drag handlers for desktop preview support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.scrollY <= 2 && e.button === 0) {
      setStartY(e.clientY);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || startY === null || isRefreshing) return;
    const diff = e.clientY - startY;
    if (diff > 0 && window.scrollY <= 2) {
      const distance = Math.min(MAX_PULL, diff * 0.45);
      setPullY(distance);
    } else {
      setPullY(0);
    }
  };

  const handleMouseUp = async () => {
    if (!isDragging) return;
    setIsDragging(false);
    setStartY(null);
    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      setPullY(PULL_THRESHOLD);
      try {
        await refreshPosts();
        setShowRefreshSuccess(true);
        setTimeout(() => setShowRefreshSuccess(false), 900);
      } finally {
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  };

  // Manual trigger
  const triggerManualRefresh = async () => {
    if (isRefreshing) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      await refreshPosts();
      setShowRefreshSuccess(true);
      setTimeout(() => setShowRefreshSuccess(false), 900);
    } catch {
      // ignore
    }
  };

  // Initial Boot Sequence from ECHO Intelligence
  if (isLoading) {
    return <SplashScreen />;
  }

  // Step 1: Google & Email Authorisation Page shown first if user is not authenticated
  if (!firebaseUser && !currentUser) {
    return <GoogleAuthPage />;
  }

  // Step 2: User ID Onboarding modal if user has signed in but hasn't created a handle yet
  if (firebaseUser && (needsOnboarding || !currentUser)) {
    return <UsernameOnboardingModal />;
  }

  // Step 3: Bespoke Spatial & Editorial Fluid Experience
  return (
    <div className="min-h-screen bg-black text-white flex justify-center relative overflow-x-hidden">
      {/* Main Container with Asymmetric Editorial Width */}
      <main
        className={`w-full max-w-4xl min-h-screen bg-black border-x border-[#1F1F1F] flex flex-col relative ${
          activeTab === 'messages' && activeChat ? 'pb-0' : 'pb-28'
        }`}
      >
        {/* Top Brand Bar (Hidden in messages tab, as DirectMessagesView provides its native Instagram Direct header) */}
        {activeTab !== 'messages' && (
          <TopHeader
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            hasUnreadNotifications={true}
            onHeaderLogoClick={triggerManualRefresh}
          />
        )}

        {/* Render Tab Views */}
        {activeTab === 'home' && (
          <div
            className="flex flex-col min-h-screen select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Tactile Pull-to-Refresh Indicator Banner */}
            <div
              style={{
                height: isRefreshing || showRefreshSuccess ? '46px' : `${pullY}px`,
                opacity: isRefreshing || showRefreshSuccess || pullY > 0 ? 1 : 0,
                transition: isDragging ? 'none' : 'height 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
              }}
              className={`overflow-hidden flex items-center justify-center bg-black select-none ${
                isRefreshing || showRefreshSuccess || pullY > 0 ? 'border-b border-neutral-900/60' : ''
              }`}
            >
              {(isRefreshing || showRefreshSuccess || pullY > 0) && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 text-xs w-full">
                  {isRefreshing ? (
                    <div className="flex items-center gap-2 text-neutral-300 animate-in fade-in duration-200">
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin stroke-[2.2]" />
                      <span className="font-mono text-[11px] tracking-wider uppercase text-neutral-300">
                        Fetching latest posts...
                      </span>
                    </div>
                  ) : showRefreshSuccess ? (
                    <div className="flex items-center gap-1.5 text-neutral-200 animate-in fade-in duration-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      <span className="font-mono text-[11px] tracking-wider uppercase text-emerald-400">
                        Feed updated
                      </span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 text-neutral-400 transition-opacity duration-150"
                      style={{ opacity: Math.max(0.2, pullY / PULL_THRESHOLD) }}
                    >
                      <ArrowDown
                        className="w-3.5 h-3.5 text-white transition-transform duration-150 ease-out"
                        style={{
                          transform: `rotate(${pullY >= PULL_THRESHOLD ? 180 : Math.min(180, (pullY / PULL_THRESHOLD) * 180)}deg)`,
                        }}
                      />
                      <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                        {pullY >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull down to refresh'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Moments Ribbon (Replacing circular stories) */}
            <LiveMomentsBar />

            {/* Feed Mode & Source Filter Bar */}
            <FeedFilterBar />

            {/* Friend & Creator Suggestions */}
            <FriendSuggestions />

            {/* Feed Stream */}
            <div className="flex-1 select-text">
              {feedMode === 'for_you' ? (
                /* For You Scored Feed */
                posts.length === 0 ? (
                  <EmptyFeedState />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 sm:p-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )
              ) : (
                /* Following / Flow Stream */
                posts.length === 0 ? (
                  <EmptyFeedState />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 sm:p-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Exact System Footer Signature */}
            <footer className="py-10 px-4 text-center border-t border-[#1F1F1F] flex flex-col items-center gap-1.5 select-none bg-black">
              <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-semibold">
                ECHO INTELLIGENCE
              </span>
              <span className="text-[10px] tracking-wider text-neutral-600 font-mono">
                v2.5 OLED Native • Cloud Live
              </span>
            </footer>
          </div>
        )}

        {activeTab === 'explore' && <ExploreView />}

        {activeTab === 'messages' && <DirectMessagesView />}

        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Floating Glassmorphic Navigation Command Dock */}
      <FloatingCommandDock onOpenNotifications={() => setIsNotificationsOpen(true)} />

      {/* Modals & Slide-up Drawers */}
      <CreatePostModal />
      <CommentsDrawer />
      <SharePostModal />
      <StoryViewerModal />
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocialProvider>
        <AppContent />
      </SocialProvider>
    </AuthProvider>
  );
}
