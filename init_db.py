import asyncio
import asyncpg
from config import DATABASE_URL

async def init_db():
    try:
        pool = await asyncpg.create_pool(DATABASE_URL)
        async with pool.acquire() as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    telegram_id BIGINT PRIMARY KEY,
                    nickname TEXT NOT NULL,
                    age INTEGER,
                    country TEXT,
                    city TEXT,
                    gender TEXT,
                    interests TEXT,
                    photo TEXT,
                    coins INTEGER DEFAULT 10,
                    likes JSONB DEFAULT '[]',
                    matches JSONB DEFAULT '[]',
                    blocked BOOLEAN DEFAULT FALSE
                )
            ''')
        await pool.close()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
