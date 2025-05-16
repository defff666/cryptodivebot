import asyncio
import asyncpg
from config import DATABASE_URL
import logging

logger = logging.getLogger(__name__)

async def init_db():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT PRIMARY KEY,
                nickname VARCHAR(50) NOT NULL,
                age INTEGER NOT NULL CHECK (age >= 18),
                country VARCHAR(100) NOT NULL,
                city VARCHAR(100) NOT NULL,
                gender VARCHAR(20) NOT NULL,
                interests TEXT[] NOT NULL,
                photo_url TEXT,
                coins INTEGER DEFAULT 10,
                blocked BOOLEAN DEFAULT FALSE,
                likes BIGINT[] DEFAULT '{}',
                matches BIGINT[] DEFAULT '{}'
            );
            CREATE INDEX IF NOT EXISTS idx_users_city ON users (city);
            CREATE INDEX IF NOT EXISTS idx_users_gender ON users (gender);
        """)
        await conn.close()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_db())
