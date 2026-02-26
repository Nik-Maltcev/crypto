import { RedditPost } from '../types';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

// Helper to clean up Reddit data
const cleanText = (text: string) => {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
};

export const fetchSubredditPosts = async (subredditName: string, searchQuery?: string): Promise<RedditPost[]> => {
  try {
    // We now use our dedicated backed endpoint which handles Reddit OAuth
    let url = `${BACKEND_URL}/api/reddit/posts?subreddit=${encodeURIComponent(subredditName)}&limit=100`;

    if (searchQuery) {
      url += `&q=${encodeURIComponent(searchQuery)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Reddit fetch failed for r/${subredditName}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data || !data.data || !data.data.children) {
      return [];
    }

    // Filter for posts within last 3 days
    const threeDaysAgo = Math.floor((Date.now() / 1000) - (3 * 24 * 60 * 60));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts: RedditPost[] = data.data.children
      .map((child: any) => {
        const p = child.data;
        return {
          id: p.id,
          title: p.title,
          selftext: cleanText(p.selftext),
          url: p.url,
          score: p.score,
          num_comments: p.num_comments,
          subreddit: p.subreddit,
          created_utc: p.created_utc
        };
      })
      .filter((post: RedditPost) => {
        const isDiscussion = post.title.includes("Daily Discussion");
        const isRecent = post.created_utc >= threeDaysAgo;
        return !isDiscussion && isRecent;
      });

    return posts;

  } catch (error) {
    console.warn(`Error fetching r/${subredditName}:`, error);
    return [];
  }
};