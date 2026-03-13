import asyncio
import os
import re

# STANDALONE MIGRATION SCRIPT
# Does not import from the main app to avoid dependency issues

def get_db_url():
    """Manually parse .env for DATABASE_URL."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", ".env")
    if not os.path.exists(env_path):
        # Try root .env
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            content = f.read()
            match = re.search(r"DATABASE_URL\s*=\s*['\"]?([^'\"\n]+)['\"]?", content)
            if match:
                return match.group(1)
    
    # Fallback to a default if not found (SQLite)
    return "sqlite+aiosqlite:///./backend/crypto_parser.db"

async def migrate():
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text
    
    url = get_db_url()
    print(f"Using Database URL: {url}")
    
    engine = create_async_engine(url)
    
    async with engine.begin() as conn:
        print("Checking for price_history column in polymarket_predictions...")
        try:
            # Check if column exists (Generic way to try and catch error if it fails)
            # PostgreSQL check
            if "postgresql" in url:
                result = await conn.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name='polymarket_predictions' AND column_name='price_history';"
                ))
                if not result.fetchone():
                    print("Adding price_history column (PostgreSQL)...")
                    await conn.execute(text("ALTER TABLE polymarket_predictions ADD COLUMN price_history TEXT;"))
                    print("Successfully added price_history column.")
                else:
                    print("Column price_history already exists.")
            else:
                # SQLite or other
                try:
                    await conn.execute(text("ALTER TABLE polymarket_predictions ADD COLUMN price_history TEXT;"))
                    print("Successfully added price_history column.")
                except Exception as e:
                    if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                        print("Column price_history already exists (detected via error).")
                    else:
                        print(f"Migration error: {e}")
                        
        except Exception as e:
            print(f"Database error during migration: {e}")

    await engine.dispose()

if __name__ == "__main__":
    try:
        import sqlalchemy
    except ImportError:
        print("SQLAlchemy not found in this environment. Please run: pip install sqlalchemy")
    else:
        asyncio.run(migrate())
