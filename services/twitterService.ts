import { RAPID_API_KEY, TWITTER_HOST, TWITTER_LIST_ID } from '../constants';
import { Tweet, TwitterUserMap } from '../types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Keep existing helpers for legacy tools
export const extractUsername = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(p => p);
    if (parts.length > 0) return parts[0];
    return '';
  } catch (e) {
    return url.replace('https://twitter.com/', '').replace('http://twitter.com/', '').split('/')[0];
  }
};

// Legacy ID fetcher (kept for TwitterTools component)
export const fetchTwitterUserId = async (username: string): Promise<string | null> => {
  const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';
  const targetUrl = `https://${TWITTER_HOST}/screenname.php?screenname=${username}`;
  const headersParam = encodeURIComponent(JSON.stringify({
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': TWITTER_HOST
  }));
  const proxyUrl = `${BACKEND_URL}/api/proxy?url=${encodeURIComponent(targetUrl)}&headers=${headersParam}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.rest_id || data?.id || null;
  } catch (error) {
    return null;
  }
};

export const resolveTwitterIds = async (
  urls: string[],
  onProgress: (current: number, total: number, lastResult: TwitterUserMap) => void,
  shouldStop: () => boolean
): Promise<TwitterUserMap[]> => {
  const results: TwitterUserMap[] = [];
  for (let i = 0; i < urls.length; i++) {
    if (shouldStop()) break;
    const url = urls[i];
    const username = extractUsername(url);
    if (!username) continue;
    await sleep(1000);
    const id = await fetchTwitterUserId(username);
    const result: TwitterUserMap = { username, url, id: id || '', status: id ? 'success' : 'error' };
    results.push(result);
    onProgress(i + 1, urls.length, result);
  }
  return results;
};

export const downloadCsv = (data: TwitterUserMap[]) => {
  const headers = ["Username", "ID", "Original URL", "Status"];
  const rows = data.map(d => [d.username, d.id, d.url, d.status]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `twitter_ids.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};


// --- NEW: twitter-api45 List Timeline ---

interface RawListTweet {
  tweet_id: string;
  text: string;
  created_at: string;
  favorites: number;
  retweets: number;
  replies: number;
  quotes: number;
  bookmarks: number;
  screen_name: string;
  lang: string;
  media?: {
    photo?: { media_url_https: string }[];
    video?: { media_url_https: string; variants: { bitrate?: number; content_type: string; url: string }[] }[];
  } | [];
}

/**
 * Fetch tweets from a Twitter List using twitter-api45 listtimeline endpoint.
 * One API call returns ~50 tweets from the entire list — no per-user fetching needed.
 */
export const fetchListTimeline = async (listId?: string): Promise<Tweet[]> => {
  const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';
  const targetListId = listId || TWITTER_LIST_ID;
  const targetUrl = `https://${TWITTER_HOST}/listtimeline.php?list_id=${targetListId}`;
  const headersParam = encodeURIComponent(JSON.stringify({
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': TWITTER_HOST
  }));
  const proxyUrl = `${BACKEND_URL}/api/proxy?url=${encodeURIComponent(targetUrl)}&headers=${headersParam}`;

  const MAX_RETRIES = 3;

  try {
    let response: Response | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch(proxyUrl);

      if (response.status === 429) {
        const backoff = Math.min(5000 * Math.pow(2, attempt), 30000);
        console.warn(`Twitter list 429, retry ${attempt + 1}/${MAX_RETRIES} in ${backoff / 1000}s...`);
        await sleep(backoff);
        continue;
      }

      if (response.status === 403) {
        console.warn('Twitter list 403 (Forbidden), skipping');
        return [];
      }

      break;
    }

    if (!response || !response.ok) {
      console.warn(`Failed to fetch list timeline: ${response?.status}`);
      return [];
    }

    const data = await response.json();
    const rawTweets: RawListTweet[] = data?.timeline || [];

    // Convert to internal Tweet format
    const tweets: Tweet[] = rawTweets.map(raw => ({
      text: raw.text,
      created_at: raw.created_at,
      likes: raw.favorites,
      retweets: raw.retweets,
      views: undefined, // API doesn't provide views
      user: raw.screen_name
    }));

    return tweets;
  } catch (error) {
    console.warn('Error fetching list timeline:', error);
    return [];
  }
};

/**
 * Fetch tweets from the configured Twitter list.
 * Replaces the old per-user fetchBatchTweets approach.
 * 
 * Parameters kept compatible: ids[] is ignored (we fetch from the list),
 * limitPerUser is ignored, onProgress still works for UI.
 */
export const fetchBatchTweets = async (
  _ids: string[],
  _limitPerUser: number,
  onProgress: (current: number, total: number) => void
): Promise<Tweet[]> => {

  onProgress(0, 1);

  const tweets = await fetchListTimeline();

  // Filter for recent tweets (last 16h, consistent with pipeline)
  const cutoffTime = Date.now() - (16 * 60 * 60 * 1000);
  const recentTweets = tweets.filter(t => {
    const tweetTime = new Date(t.created_at).getTime();
    return tweetTime > cutoffTime;
  });

  onProgress(1, 1);

  return recentTweets;
};
