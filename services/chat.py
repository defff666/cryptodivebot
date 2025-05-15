from aiogram import Bot
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, bot: Bot):
        self.bot = bot
        self.chat_history = {}  # In-memory chat history

    async def send_message(self, sender_id: int, target_id: int, text: str):
        """Send a message between matched users."""
        try:
            # Store message in memory
            chat_key = tuple(sorted([sender_id, target_id]))
            if chat_key not in self.chat_history:
                self.chat_history[chat_key] = []
            self.chat_history[chat_key].append({
                'sender': sender_id,
                'text': text,
                'timestamp': int(asyncio.get_event_loop().time())
            })
            
            # Send message via Telegram
            await self.bot.send_message(
                target_id,
                f"Message from user {sender_id}:\n{text}"
            )
            logger.info(f"Message sent from {sender_id} to {target_id}: {text}")
        except Exception as e:
            logger.error(f"Failed to send message from {sender_id} to {target_id}: {e}")
            raise

    async def get_chat_history(self, user_id: int, target_id: int):
        """Get chat history between two users."""
        try:
            chat_key = tuple(sorted([user_id, target_id]))
            history = self.chat_history.get(chat_key, [])
            logger.info(f"Fetched chat history for {user_id} and {target_id}: {len(history)} messages")
            return history
        except Exception as e:
            logger.error(f"Error fetching chat history for {user_id} and {target_id}: {e}")
            raise
