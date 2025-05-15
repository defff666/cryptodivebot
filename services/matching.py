from aiogram import Bot
import asyncpg
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MatchingService:
    def __init__(self, bot: Bot):
        self.bot = bot

    async def get_potential_matches(self, user_id: int, pool):
        """Get potential matches for a user."""
        async with pool.acquire() as conn:
            user = await conn.fetchrow("SELECT city, gender, interests FROM users WHERE id = $1", user_id)
            if not user:
                return []
            # Simplified filtering
            matches = await conn.fetch(
                """
                SELECT id, nickname, age, city, gender, interests, photo
                FROM users
                WHERE id != $1 AND blocked = FALSE
                AND city ILIKE $2
                AND ($3 = 'Bi' OR gender = ANY(CASE
                    WHEN $3 = 'Male' THEN ARRAY['Female', 'Bi']
                    WHEN $3 = 'Female' THEN ARRAY['Male', 'Bi']
                    WHEN $3 = 'Lesbian' THEN ARRAY['Female', 'Bi', 'Lesbian']
                    WHEN $3 = 'Gay' THEN ARRAY['Male', 'Bi', 'Gay']
                    ELSE ARRAY['Bi']
                END))
                """,
                user_id, user["city"], user["gender"]
            )
            return [dict(m) for m in matches]

    async def like_user(self, user_id: int, target_id: int):
        """Like a user and check for match."""
        pool = self.bot.get("db_pool")
        async with pool.acquire() as conn:
            # Add to likes
            await conn.execute(
                "UPDATE users SET likes = array_append(likes, $1::text) WHERE id = $2",
                str(target_id), user_id
            )
            # Check for mutual like
            target_likes = await conn.fetchval(
                "SELECT likes FROM users WHERE id = $1", target_id
            )
            if str(user_id) in (target_likes or []):
                await conn.execute(
                    """
                    UPDATE users SET matches = array_append(matches, $1::text) WHERE id = $2;
                    UPDATE users SET matches = array_append(matches, $2::text) WHERE id = $1;
                    """,
                    str(target_id), user_id
                )
                try:
                    await self.bot.send_message(target_id, "It's a match! You can now chat with this user.")
                except Exception as e:
                    logger.error(f"Failed to notify {target_id} of match: {e}")
                return True
        return False