from aiogram import Bot
import asyncpg
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, bot: Bot):
        self.bot = bot

    async def send_message(self, sender_id: int, receiver_id: int, text: str):
        """Send a message between matched users."""
        pool = self.bot.get("db_pool")
        async with pool.acquire() as conn:
            sender_matches = await conn.fetchval(
                "SELECT matches FROM users WHERE id = $1", sender_id
            )
            if str(receiver_id) not in (sender_matches or []):
                logger.warning(f"Chat attempt by {sender_id} to non-matched {receiver_id}")
                return
        try:
            await self.bot.send_message(receiver_id, f"Message from {sender_id}: {text}")
            logger.info(f"Message sent from {sender_id} to {receiver_id}")
        except Exception as e:
            logger.error(f"Failed to send message from {sender_id} to {receiver_id}: {e}")