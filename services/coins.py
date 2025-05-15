from aiogram import Bot
from aiogram.fsm.context import FSMContext
import asyncpg
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CoinsService:
    def __init__(self, bot: Bot, state: FSMContext):
        self.bot = bot
        self.state = state

    async def add_coins(self, user_id: int, amount: int):
        """Add coins to a user."""
        pool = self.state.data.get("db_pool")
        if not pool:
            logger.error(f"No db_pool in state for user {user_id}")
            raise ValueError("Database pool not initialized")
        async with pool.acquire() as conn:
            try:
                await conn.execute(
                    """
                    UPDATE users
                    SET coins = coins + $2
                    WHERE id = $1
                    """,
                    user_id, amount
                )
                logger.info(f"Added {amount} coins to user {user_id}")
            except Exception as e:
                logger.error(f"Error adding coins for user {user_id}: {e}")
                raise

    async def get_coins(self, user_id: int):
        """Get user's coin balance."""
        pool = self.state.data.get("db_pool")
        if not pool:
            logger.error(f"No db_pool in state for user {user_id}")
            raise ValueError("Database pool not initialized")
        async with pool.acquire() as conn:
            try:
                coins = await conn.fetchval(
                    "SELECT coins FROM users WHERE id = $1",
                    user_id
                )
                logger.info(f"Fetched coins for user {user_id}: {coins}")
                return coins or 0
            except Exception as e:
                logger.error(f"Error fetching coins for user {user_id}: {e}")
                raise
