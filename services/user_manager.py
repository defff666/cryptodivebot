import asyncpg
from config import DATABASE_URL
from models.user import User
import logging

logger = logging.getLogger(__name__)

class UserManager:
    async def create_user(self, user_id, nickname, age, country, city, gender, interests, photo_url=None):
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            await conn.execute("""
                INSERT INTO users (user_id, nickname, age, country, city, gender, interests, photo_url, coins)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 10)
            """, user_id, nickname, age, country, city, gender, interests, photo_url)
            await conn.close()
            return User(user_id, nickname, age, country, city, gender, interests, photo_url, 10)
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise

    async def get_user(self, user_id):
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            row = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1 AND blocked = FALSE", user_id)
            await conn.close()
            return User(**row) if row else None
        except Exception as e:
            logger.error(f"Error getting user: {e}")
            raise

    async def update_user(self, user_id, **kwargs):
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            query = f"UPDATE users SET {', '.join(f'{k} = ${i+1}' for i, k in enumerate(kwargs.keys()))} WHERE user_id = ${len(kwargs) + 1}"
            await conn.execute(query, *kwargs.values(), user_id)
            await conn.close()
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise

    async def get_stats(self):
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            users = await conn.fetchval("SELECT COUNT(*) FROM users WHERE blocked = FALSE")
            matches = await conn.fetchval("SELECT SUM(ARRAY_LENGTH(matches, 1)) FROM users WHERE blocked = FALSE")
            chats = 0  # Placeholder for chat count
            await conn.close()
            return {"users": users, "matches": matches or 0, "chats": chats}
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            raise
