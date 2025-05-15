from aiogram import Bot
import asyncpg
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MatchingService:
    def __init__(self, bot: Bot):
        self.bot = bot

    async def get_potential_matches(self, user_id: int, city: str, gender: str, interests: str, pool: asyncpg.Pool):
        """Get potential matches based on city, gender, and interests."""
        try:
            gender_preferences = {
                'Male': ['Female', 'Bi', 'Lesbian', 'Gay'],
                'Female': ['Male', 'Bi', 'Gay', 'Lesbian'],
                'Bi': ['Male', 'Female', 'Bi', 'Lesbian', 'Gay'],
                'Lesbian': ['Female', 'Bi', 'Lesbian'],
                'Gay': ['Male', 'Bi', 'Gay']
            }
            compatible_genders = gender_preferences.get(gender, ['Male', 'Female', 'Bi', 'Lesbian', 'Gay'])
            interest_list = interests.split(', ')
            
            async with pool.acquire() as conn:
                users = await conn.fetch(
                    """
                    SELECT * FROM users
                    WHERE id != $1
                    AND blocked = FALSE
                    AND city = $2
                    AND gender = ANY($3)
                    AND interests && $4
                    AND NOT ($1::text = ANY(likes))
                    """,
                    user_id, city, compatible_genders, interest_list
                )
                logger.info(f"Found {len(users)} potential matches for user {user_id}")
                return [dict(user) for user in users]
        except Exception as e:
            logger.error(f"Error fetching matches for user {user_id}: {e}")
            raise

    async def like_user(self, user_id: int, target_id: int, pool: asyncpg.Pool):
        """Process a like and check for a match."""
        try:
            async with pool.acquire() as conn:
                # Add like to user's likes
                await conn.execute(
                    """
                    UPDATE users
                    SET likes = array_append(likes, $2::text)
                    WHERE id = $1
                    """,
                    user_id, str(target_id)
                )
                
                # Check if target liked user
                target = await conn.fetchrow(
                    "SELECT likes FROM users WHERE id = $1",
                    target_id
                )
                if target and str(user_id) in target['likes']:
                    # Mutual like, create match
                    await conn.execute(
                        """
                        UPDATE users
                        SET matches = array_append(matches, $2::text)
                        WHERE id = $1
                        """,
                        user_id, str(target_id)
                    )
                    await conn.execute(
                        """
                        UPDATE users
                        SET matches = array_append(matches, $2::text)
                        WHERE id = $1
                        """,
                        target_id, str(user_id)
                    )
                    try:
                        await self.bot.send_message(
                            user_id,
                            f"It's a match with user {target_id}! You can now chat."
                        )
                        await self.bot.send_message(
                            target_id,
                            f"It's a match with user {user_id}! You can now chat."
                        )
                    except Exception as e:
                        logger.error(f"Failed to notify match for {user_id} and {target_id}: {e}")
                    logger.info(f"Match created between {user_id} and {target_id}")
                    return True
                logger.info(f"User {user_id} liked {target_id}, no match yet")
                return False
        except Exception as e:
            logger.error(f"Error processing like for user {user_id} on {target_id}: {e}")
            raise
