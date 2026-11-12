import { Post, Story, ChatThread, Message, Comment } from '../types';

// Zero Fake Data Rule: Pure empty initial arrays. All accounts, posts, stories, and chats
// originate strictly from real authenticated users in Firebase Authentication and Cloud Firestore.
export const INITIAL_STORIES: Story[] = [];
export const INITIAL_POSTS: Post[] = [];
export const INITIAL_COMMENTS: Record<string, Comment[]> = {};
export const INITIAL_CHATS: ChatThread[] = [];
export const INITIAL_MESSAGES: Record<string, Message[]> = {};
