import { RAPID_API_KEY, TWITTER_HOST } from '../constants';
import { Tweet, TwitterUserMap } from '../types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Keep existing helpers if needed for legacy tools, but we focus on ID fetching now
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

// Simplified ID fetcher for tools (not used in main flow anymore)
export const fetchTwitterUserId = async (username: string): Promise<string | null> => {
  // Use allorigins to bypass CORS restrictions in browser
  const targetUrl = `https://${TWITTER_HOST}/user?username=${username}`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': TWITTER_HOST
      }
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (data?.result?.data?.user?.result?.rest_id) return data.result.data.user.result.rest_id;
    if (data?.result?.rest_id) return data.result.rest_id;
    if (data?.data?.user?.result?.rest_id) return data.data.user.result.rest_id;
    if (data?.rest_id) return data.rest_id;

    return null;
  } catch (error) {
    return null;
  }
};

export const resolveTwitterIds = async (
  urls: string[],
  onProgress: (current: number, total: number, lastResult: TwitterUserMap) => void,
  shouldStop: () => boolean
): Promise<TwitterUserMap[]> => {
  // Legacy tool implementation
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


// --- NEW FUNCTIONALITY FOR APP FLOW ---

/**
 * Fetch Tweets for a specific User ID
 */
export const fetchUserTweets = async (userId: string, count = 10): Promise<Tweet[]> => {
  // Endpoint: UserTweets or similar
  // RapidAPI Twitter241 often uses `user-tweets` or `user/tweets`
  const targetUrl = `https://${TWITTER_HOST}/user-tweets?user=${userId}&count=${count}`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': TWITTER_HOST
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch tweets for ${userId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    // Parse response based on typical Twitter241 structure
    // Often: result -> timeline -> instructions -> entries -> content -> itemContent -> tweet_results -> result -> legacy

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instructions = data?.result?.timeline?.instructions || data?.data?.user?.result?.timeline_v2?.timeline?.instructions;
    if (!instructions) return [];

    const tweets: Tweet[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instructions.forEach((instr: any) => {
      if (instr.type === "TimelineAddEntries" && instr.entries) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        instr.entries.forEach((entry: any) => {
          const tweetData = entry?.content?.itemContent?.tweet_results?.result?.legacy;
          const user = entry?.content?.itemContent?.tweet_results?.result?.core?.user_results?.result?.legacy?.screen_name;

          if (tweetData) {
            tweets.push({
              text: tweetData.full_text || tweetData.text,
              created_at: tweetData.created_at,
              likes: tweetData.favorite_count,
              retweets: tweetData.retweet_count,
              views: entry?.content?.itemContent?.tweet_results?.result?.views?.count,
              user: user || userId // Fallback to ID if screen_name not found
            });
          }
        });
      }
    });

    return tweets;

  } catch (error) {
    console.warn(`Error fetching tweets for ${userId}`, error);
    return [];
  }
};

/**
 * Fetch tweets for specific IDs (no random sampling)
 */
export const fetchBatchTweets = async (
  ids: string[],
  limitPerUser: number,
  onProgress: (current: number, total: number) => void
): Promise<Tweet[]> => {

  const allTweets: Tweet[] = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    // Add delay to respect API limits
    await sleep(800);

    const tweets = await fetchUserTweets(id, limitPerUser);

    // Filter for recent tweets (last 48h) to ensure relevance
    const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);
    const recentTweets = tweets.filter(t => new Date(t.created_at).getTime() > twoDaysAgo);

    allTweets.push(...recentTweets);
    onProgress(i + 1, ids.length);
  }

  return allTweets;
};