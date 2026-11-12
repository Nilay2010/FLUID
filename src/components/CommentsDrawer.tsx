import React, { useState } from 'react';
import { X, Heart, Send } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

export const CommentsDrawer: React.FC = () => {
  const { commentsPostId, setCommentsPostId, getPostComments, addComment, posts } = useSocial();
  const { currentUser } = useAuth();
  const [commentText, setCommentText] = useState('');

  if (!commentsPostId) return null;

  const currentPost = posts.find((p) => p.id === commentsPostId);
  const comments = getPostComments(commentsPostId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(commentsPostId, commentText);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center select-none">
      <div
        className="w-full max-w-[470px] bg-[#121212] border-t sm:border border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[80vh] h-[550px] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle (mobile affordance) */}
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span className="text-xs font-semibold text-white tracking-tight uppercase font-mono">
            Comments ({comments.length})
          </span>
          <button
            onClick={() => setCommentsPostId(null)}
            aria-label="Close comments"
            className="p-1 text-neutral-400 hover:text-white active:scale-90 transition-transform"
          >
            <X className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* Comments Scrollable List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Post Author Caption as first item if available */}
          {currentPost && (
            <div className="flex items-start gap-3 pb-3 border-b border-neutral-900">
              <img
                src={currentPost.authorAvatarUrl}
                alt={currentPost.authorUsername}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-800"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-200 leading-snug">
                  <span className="font-semibold text-white mr-1.5">
                    {currentPost.authorUsername}
                  </span>
                  {currentPost.caption}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  {currentPost.createdAt}
                </div>
              </div>
            </div>
          )}

          {/* List of comments */}
          {comments.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No comments yet. Start the conversation.
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start justify-between gap-2.5 group">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <img
                    src={comment.authorAvatarUrl}
                    alt={comment.authorUsername}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-neutral-200 leading-snug break-words">
                      <span className="font-semibold text-white mr-1.5 inline-block">
                        {comment.authorUsername}
                      </span>
                      {comment.text}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-500 mt-1">
                      <span>{comment.createdAt}</span>
                      {comment.likesCount ? (
                        <span>{comment.likesCount} likes</span>
                      ) : null}
                      <button className="hover:text-neutral-300 font-medium">Reply</button>
                    </div>
                  </div>
                </div>

                {/* Heart on comment */}
                <button
                  aria-label="Like comment"
                  className="p-1 text-neutral-500 hover:text-[#FF3040] active:scale-75 transition-transform"
                >
                  <Heart className="w-3.5 h-3.5 stroke-[1.8]" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pinned Bottom Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-neutral-800 bg-[#161618] px-3.5 py-2.5 flex items-center gap-2.5"
        >
          {currentUser && (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="w-7 h-7 rounded-full object-cover border border-neutral-700"
              referrerPolicy="no-referrer"
            />
          )}
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={`Add a comment for @${currentPost?.authorUsername || 'creator'}...`}
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className={`text-xs font-semibold px-2 py-1 transition-opacity ${
              commentText.trim() ? 'text-white opacity-100 hover:opacity-80' : 'text-neutral-600 opacity-40'
            }`}
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};
