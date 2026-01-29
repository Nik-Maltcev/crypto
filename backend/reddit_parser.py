"""Reddit parser with OAuth - server-side to avoid CORS issues."""

import asyncio
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# OAuth token cache
_access_token = None
_token_expires = 0

# Rate limiting
_last_request_time = 0
_min_delay = 1.0


async def get_reddit_token() -> str:
    """Get OAuth access token for Reddit API."""
    global _access_token, _token_expires
    
    now = asyncio.get_event_loop().time()
    
    # Return cached token if still valid
    if _access_token and now < _token_expires - 60:
        return _access_token
    
    client_id = os.environ.get("REDDIT_CLIENT_ID", "")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    
    if not client_id or not client_secret:
        logger.warning("Reddit OAuth credentials not configured")
        return ""
    
    auth = httpx.BasicAuth(client_id, client_secret)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=auth,
            data={"grant_type": "client_credentials"},
            headers={"User-Agent": "CryptoPulseAI/1.0"}
        )
        
        if response.status_code != 200:
            logger.error(f"Reddit OAuth failed: {response.status_code}")
            return ""
        
        data = response.json()
        _access_token = data.get("access_token", "")
        expires_in = data.get("expires_in", 3600)
        _token_expires = now + expires_in
        
        logger.info("Reddit OAuth token obtained")
        return _access_token


async def fetch_subreddit_posts(subreddit: str, limit: int = 25) -> list[dict[str, Any]]:
    """Fetch hot posts from a subreddit using OAuth."""
    global _last_request_time
    
    # Rate limiting
    now = asyncio.get_event_loop().time()
    elapsed = now - _last_request_time
    if elapsed < _min_delay:
        await asyncio.sleep(_min_delay - elapsed)
    
    token = await get_reddit_token()
    
    if token:
        # Use OAuth API
        url = f"https://oauth.reddit.com/r/{subreddit}/hot?limit={limit}"
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "CryptoPulseAI/1.0"
        }
    else:
        # Fallback to public API
        url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            _last_request_time = asyncio.get_event_loop().time()
            
            if response.status_code != 200:
                logger.warning(f"Reddit returned {response.status_code} for r/{subreddit}")
                return []
            
            data = response.json()
            
            if not data or "data" not in data or "children" not in data["data"]:
                return []
            
            # Filter posts from last 3 days
            three_days_ago = datetime.now(timezone.utc) - timedelta(days=3)
            cutoff_ts = three_days_ago.timestamp()
            
            posts = []
            for child in data["data"]["children"]:
                p = child.get("data", {})
                
                if p.get("created_utc", 0) < cutoff_ts:
                    continue
                
                if "Daily Discussion" in p.get("title", ""):
                    continue
                
                selftext = p.get("selftext", "") or ""
                selftext = " ".join(selftext.split())[:500]
                
                posts.append({
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "selftext": selftext,
                    "url": p.get("url"),
                    "score": p.get("score", 0),
                    "num_comments": p.get("num_comments", 0),
                    "subreddit": p.get("subreddit"),
                    "created_utc": p.get("created_utc")
                })
            
            logger.info(f"Fetched {len(posts)} posts from r/{subreddit}")
            return posts
            
    except Exception as e:
        logger.error(f"Error fetching r/{subreddit}: {e}")
        return []


async def fetch_multiple_subreddits(subreddits: list[str], limit: int = 25) -> list[dict[str, Any]]:
    """Fetch posts from multiple subreddits."""
    all_posts = []
    
    for sub in subreddits:
        posts = await fetch_subreddit_posts(sub, limit)
        significant = [p for p in posts if p.get("score", 0) > 5]
        all_posts.extend(significant)
    
    all_posts.sort(key=lambda x: x.get("score", 0), reverse=True)
    return all_posts[:150]
