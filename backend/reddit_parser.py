"""Reddit parser - server-side to avoid CORS issues."""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# Rate limiting
_last_request_time = 0
_min_delay = 1.0  # seconds between requests


async def fetch_subreddit_posts(subreddit: str, limit: int = 25) -> list[dict[str, Any]]:
    """Fetch hot posts from a subreddit."""
    global _last_request_time
    
    # Rate limiting
    now = asyncio.get_event_loop().time()
    elapsed = now - _last_request_time
    if elapsed < _min_delay:
        await asyncio.sleep(_min_delay - elapsed)
    
    url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}"
    
    headers = {
        "User-Agent": "CryptoPulseAI/1.0 (Server-Side Parser)"
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
                
                # Skip old posts
                if p.get("created_utc", 0) < cutoff_ts:
                    continue
                
                # Skip Daily Discussion threads
                if "Daily Discussion" in p.get("title", ""):
                    continue
                
                # Clean text
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
        # Filter by score > 5
        significant = [p for p in posts if p.get("score", 0) > 5]
        all_posts.extend(significant)
    
    # Sort by score and take top 150
    all_posts.sort(key=lambda x: x.get("score", 0), reverse=True)
    return all_posts[:150]
