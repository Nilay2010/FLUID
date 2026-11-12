import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { db } from '../services/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export const FriendSuggestions: React.FC = () => {
  const { currentUser } = useAuth();
  const { followingSet, toggleFollowUser } = useSocial();
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchSuggestions = async () => {
      if (!currentUser || !db) {
        setIsLoading(false);
        return;
      }

      try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, limit(15));
        const snapshot = await getDocs(q);
        const results: UserProfile[] = [];

        snapshot.forEach((docSnap) => {
          const u = docSnap.data() as UserProfile;
          if (u.uid && u.uid !== currentUser.uid && u.username) {
            results.push(u);
          }
        });

        if (active) {
          setSuggestedUsers(results);
        }
      } catch (err) {
        console.warn('Error fetching suggestions:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchSuggestions();
    return () => {
      active = false;
    };
  }, [currentUser]);

  if (!currentUser || suggestedUsers.length === 0) return null;

  return (
    <div className="w-full my-4 px-4 select-none">
      <div className="bg-black border border-neutral-800 rounded-xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400">
            Suggested for you
          </span>
          <button className="text-xs font-semibold text-white hover:text-neutral-300 transition-colors">
            See All
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="py-6 text-center text-xs text-neutral-500">
            Loading suggestions...
          </div>
        ) : (
          <div className="space-y-3">
            {suggestedUsers.slice(0, 5).map((user) => {
              const isFollowing = followingSet.has(user.username);

              return (
                <div
                  key={user.uid}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        user.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={user.displayName}
                      className="w-11 h-11 rounded-full object-cover border border-neutral-800 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {user.username}
                        </span>
                        {user.isVerified && (
                          <span className="text-sky-400 text-[10px]">●</span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 truncate">
                        Suggested for you
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFollowUser(user.username)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all ${
                      isFollowing
                        ? 'bg-transparent text-white border border-neutral-700 hover:border-neutral-500'
                        : 'bg-[#0095F6] text-white hover:bg-[#1877F2]'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
