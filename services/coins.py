import asyncpg
from config import DATABASE_URL
import logging

logger = logging.getLogger(__name__)

class CoinsService:
    async def add_coins(self, user_id, amount):
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            await conn.execute("UPDATE users SET coins = coins + $1 WHERE user_id = $2", amount, user_id)
            await conn.close()
        except Exception as e:
            logger.error(f"Error adding coins: {e}")
            raise
