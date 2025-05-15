from aiogram import Bot
import asyncpg
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CoinsService:
    def __init__(self, bot: Bot):
        self.bot = bot

    async def add_coins(self, user_id: int, amount: int):
        """Add coins to a user."""
        pool = self.bot.get("db_pool")
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET coins = coins + $1 WHERE id = $2",
                amount, user_id
            )
        logger.info(f"Added {amount} coins to user {user_id}")

    async def get_coins(self, user_id: int):
        """Get user's coin balance."""
        pool = self.bot.get("db_pool")
        async with pool.acquire() as conn:
            coins = await conn.fetchval("SELECT coins FROM users WHERE id = $1", user_id)
            return coins or 0