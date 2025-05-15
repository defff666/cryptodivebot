from aiogram import Bot
from aiogram.fsm.context import FSMContext
from models.user import User
import asyncpg
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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
        if not pool:
            logger.error(f"No db_pool in state for user {user_id}")
            raise ValueError("Database pool not initialized")
        async with pool.acquire() as conn:
            try:
                await conn.execute(
                    """
                    INSERT INTO users (
                        id, nickname, age, country, city, gender, interests, photo,
                        coins, likes, matches, blocked
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (id) DO UPDATE
                    SET nickname = EXCLUDED.nickname,
                        age = EXCLUDED.age,
                        country = EXCLUDED.country,
                        city = EXCLUDED.city,
                        gender = EXCLUDED.gender,
                        interests = EXCLUDED.interests,
                        photo = EXCLUDED.photo,
                        coins = EXCLUDED.coins
                    """,
                    user.id, user.nickname, user.age, user.country, user.city,
                    user.gender, user.interests, user.photo, user.coins,
                    user.likes, user.matches, user.blocked
                )
                logger.info(f"User {user_id} registered: {nickname}, {age}, {country}, {city}, {gender}, {interests}")
            except Exception as e:
                logger.error(f"Error registering user {user_id}: {e}")
                raise
        return user

    async def get_user(self, user_id: int):
        """Get user by ID."""
        pool = self.state.data.get("db_pool")
        if not pool:
            logger.error(f"No db_pool in state for user {user_id}")
            raise ValueError("Database pool not initialized")
        async with pool.acquire() as conn:
            try:
                record = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
                if record:
                    logger.info(f"Fetched user {user_id}: {record['nickname']}")
                    return User(**record)
                logger.info(f"No user found for ID {user_id}")
                return None
            except Exception as e:
                logger.error(f"Error fetching user {user_id}: {e}")
                raise

    async def update_user(self, user_id: int, **kwargs):
        """Update user profile."""
        pool = self.state.data.get("db_pool")
        if not pool:
            logger.error(f"No db_pool in state for user {user_id}")
            raise ValueError("Database pool not initialized")
        
        current_user = await self.get_user(user_id)
        if not current_user:
            logger.error(f"Cannot update: User {user_id} not found")
            raise ValueError("User not found")
        
        kwargs.setdefault('nickname', current_user.nickname)
        kwargs.setdefault('age', current_user.age)
        kwargs.setdefault('country', current_user.country)
        kwargs.setdefault('city', current_user.city)
        kwargs.setdefault('gender', current_user.gender)
        kwargs.setdefault('interests', current_user.interests)
        
        if kwargs.get('age', 18) < 18:
            raise ValueError("Age must be 18 or older")
        if not all([kwargs.get('nickname'), kwargs.get('country'), kwargs.get('city'), kwargs.get('gender'), kwargs.get('interests')]):
            raise ValueError("All required fields must be filled")

        async with pool.acquire() as conn:
            try:
                query = "UPDATE users SET "
                values = []
                for i, (key, value) in enumerate(kwargs.items(), 1):
                    if value is not None:
                        query += f"{key} = ${i}, "
                        values.append(value)
                query = query.rstrip(", ") + " WHERE id = $" + str(len(values) + 1)
                values.append(user_id)
                await conn.execute(query, *values)
                logger.info(f"User {user_id} updated profile: {kwargs}")
            except Exception as e:
                logger.error(f"Error updating user {user_id}: {e}")
                raise

    async def ban_user(self, user_id: int):
        """Ban a user."""
        pool = self.state.data.get("db_pool")
        if not pool:
            logger.error(f"No db_pool in state for user {user_id}")
            raise ValueError("Database pool not initialized")
        async with pool.acquire() as conn:
            try:
                await conn.execute("UPDATE users SET blocked = TRUE WHERE id = $1", user_id)
                logger.info(f"User {user_id} banned")
            except Exception as e:
                logger.error(f"Error banning user {user_id}: {e}")
                raise

    async def get_stats(self):
        """Get admin statistics."""
        pool = self.state.data.get("db_pool")
        if not pool:
            logger.error("No db_pool in state for stats")
            raise ValueError("Database pool not initialized")
        async with pool.acquire() as conn:
            try:
                total_users = await conn.fetchval("SELECT COUNT(*) FROM users")
                total_matches = await conn.fetchval("SELECT SUM(ARRAY_LENGTH(matches, 1)) FROM users") or 0
                active_chats = 0  # Simplified
                logger.info(f"Fetched stats: users={total_users}, matches={total_matches}")
                return {
                    "total_users": total_users,
                    "total_matches": total_matches // 2,
                    "active_chats": active_chats
                }
            except Exception as e:
                logger.error(f"Error fetching stats: {e}")
                raise

    async def broadcast(self, text: str):
        """Send broadcast message to all users."""
        pool = self.state.data.get("db_pool")
        if not pool:
            logger.error("No db_pool in state for broadcast")
            raise ValueError("Database pool not initialized")
        async with pool.acquire() as conn:
            try:
                users = await conn.fetch("SELECT id FROM users WHERE blocked = FALSE")
                logger.info(f"Broadcast to {len(users)} users")
                for user in users:
                    try:
                        await self.bot.send_message(user["id"], text)
                        await asyncio.sleep(0.5)
                    except Exception as e:
                        logger.error(f"Failed to send broadcast to {user['id']}: {e}")
            except Exception as e:
                logger.error(f"Error fetching users for broadcast: {e}")
                raise
