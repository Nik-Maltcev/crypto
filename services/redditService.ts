import { RedditPost } from '../types';

// Helper to clean up Reddit data
const cleanText = (text: string) => {
  return text ? text.replace(/\s+/g, ' ').substring(0, 500) : '';
};

// Rate Limiting State
let rateLimitRemaining = 600; // Default optimistic starting point
let rateLimitResetTime = 0; // Epoch time when limit resets

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Smart Rate Limiting Fetch
 * 1. Checks headers for X-Ratelimit-Remaining
 * 2. Pauses if limit is hit
 * 3. Enforces a minimum safety delay between requests to avoid burst-bans
 */
async function fetchWithRateLimit(url: string): Promise<any> {
  const now = Date.now();

  // 1. Strict Header Adherence
  if (rateLimitRemaining < 2 && now < rateLimitResetTime) {
    const waitTime = rateLimitResetTime - now + 1000; // Add 1s buffer
    console.warn(`[RateLimit] Hitting limits. Waiting ${Math.ceil(waitTime / 1000)}s...`);
    await sleep(waitTime);
  } else {
    // 2. Pessimistic Safety Delay (Default to ~60 QPM = 1000ms delay per request to be safe without headers)
    // If we have plenty of remaining requests (confirmed by headers), we can go faster.
    const safetyDelay = rateLimitRemaining > 50 ? 600 : 1500;
    await sleep(safetyDelay);
  }

  // Use corsproxy.org to bypass browser CORS restrictions for Reddit API
  const proxyUrl = `https://corsproxy.org/?${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'CryptoPulseAI/1.0 (Client-Side App)'
      }
    });

    // Update Rate Limits from Headers (if available through proxy)
    const remainingHeader = response.headers.get('x-ratelimit-remaining');
    const resetHeader = response.headers.get('x-ratelimit-reset');

    if (remainingHeader) {
      rateLimitRemaining = parseFloat(remainingHeader);
    }
    if (resetHeader) {
      rateLimitResetTime = Date.now() + (parseFloat(resetHeader) * 1000);
    }

    if (!response.ok) {
      // 429 = Too Many Requests
      if (response.status === 429) {
        rateLimitRemaining = 0;
        rateLimitResetTime = Date.now() + 60000; // Assume 1 min penalty if header missing
        throw new Error('Rate Limited (429)');
      }
      throw new Error(`Status ${response.status}`);
    }

    const text = await response.text();
    const trimmed = text.trim();

    // 3. Strict JSON Validation (Prevent "Unexpected token <" error)
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      throw new Error('Received HTML/Invalid content (likely error page)');
    }

    return JSON.parse(text);
  } catch (error) {
    console.warn(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

export const fetchSubredditPosts = async (subredditName: string): Promise<RedditPost[]> => {
  try {
    // Fetch 'hot' to see what's actually trending now, which implies active sentiment
    // 'new' is good for sniping, but 'hot' is better for 7-day trend analysis stability
    const targetUrl = `https://www.reddit.com/r/${subredditName}/hot.json?limit=25`;
    
    const data = await fetchWithRateLimit(targetUrl);
    
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

    // Return strict data, no mocks.
    return posts;

  } catch (error) {
    // If a specific subreddit fails, we return empty so the batch continues.
    // We do NOT return mock data.
    return [];
  }
};