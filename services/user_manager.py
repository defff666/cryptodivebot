from aiogram import Bot
from aiogram.fsm.context import FSMContext
from models.user import User
import asyncpg
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class UserManager:
    def __init__(self, bot: Bot, state: FSMContext):
        self.bot = bot
        self.state = state

    async def register_user(self, user_id: int, nickname: str, age: int, country: str, city: str, gender: str, interests: str, photo: str = None):
        """Register a new user."""
        if age < 18:
            raise ValueError("Age must be 18 or older")
        if not all([nickname, country, city, gender, interests]):
            raise ValueError("All required fields must be filled")
        user = User(
            id=user_id,
            nickname=nickname,
            age=age,
            country=country,
            city=city,
            gender=gender,
            interests=interests,
            photo=photo,
            coins=10,
            likes=[],
            matches=[],
            blocked=False
        )
        pool = self.state.data.get("db_pool")
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO users (
                    id, nickname, age, country, city, gender, interests, photo,
                    coins, likes, matches, blocked
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                """,
                user.id, user.nickname, user.age, user.country, user.city,
                user.gender, user.interests, user.photo, user.coins,
                user.likes, user.matches, user.blocked
            )
        logger.info(f"User {user_id} registered")

    async def get_user(self, user_id: int):
        """Get user by ID."""
        pool = self.state.data.get("db_pool")
        async with pool.acquire() as conn:
            record = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
            if record:
                return User(**record)
        return None

    async def update_user(self, user_id: int, **kwargs):
        """Update user profile."""
        pool = self.state.data.get("db_pool")
        async with pool.acquire() as conn:
            query = "UPDATE users SET "
            values = []
            for i, (key, value) in enumerate(kwargs.items(), 1):
                if value is not None:
                    query += f"{key} = ${i}, "
                    values.append(value)
            query = query.rstrip(", ") + " WHERE id = $" + str(len(values) + 1)
            values.append(user_id)
            await conn.execute(query, *values)
        logger.info(f"User {user_id} updated profile")

    async def ban_user(self, user_id: int):
        """Ban a user."""
        pool = self.state.data.get("db_pool")
        async with pool.acquire() as conn:
            await conn.execute("UPDATE users SET blocked = TRUE WHERE id = $1", user_id)
        logger.info(f"User {user_id} banned")

    async def get_stats(self):
        """Get admin statistics."""
        pool = self.state.data.get("db_pool")
        async with pool.acquire() as conn:
            total_users = await conn.fetchval("SELECT COUNT(*) FROM users")
            total_matches = await conn.fetchval("SELECT SUM(ARRAY_LENGTH(matches, 1)) FROM users") or 0
            active_chats = 0  # Simplified, can be enhanced with chat tracking
        return {
            "total_users": total_users,
            "total_matches": total_matches // 2,  # Each match is counted twice
            "active_chats": active_chats
        }

    async def broadcast(self, text: str):
        """Send broadcast message to all users."""
        pool = self.state.data.get("db_pool")
        async with pool.acquire() as conn:
            users = await conn.fetch("SELECT id FROM users WHERE blocked = FALSE")
        for user in users:
            try:
                await self.bot.send_message(user["id"], text)
                await asyncio.sleep(0.5)  # Throttling
            except Exception as e:
                logger.error(f"Failed to send broadcast to {user['id']}: {e}")