import { RedditPost } from '../types';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

export const fetchSubredditPosts = async (subredditName: string): Promise<RedditPost[]> => {
  // This is now just a wrapper - actual fetching happens via fetchAllRedditPosts
  return [];
};

export const fetchAllRedditPosts = async (subreddits: string[]): Promise<RedditPost[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/reddit/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subreddits),
    });

    if (!response.ok) {
      throw new Error(`Reddit API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.posts || [];
    
  } catch (error) {
    console.error("Failed to fetch Reddit data:", error);
    return [];
  }
};