from aiogram import BaseMiddleware
from aiogram.types import TelegramObject
from typing import Callable, Dict, Any, Awaitable
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ThrottlingMiddleware(BaseMiddleware):
    def __init__(self, limit: float, key_prefix: str):
        self.limit = limit
        self.key_prefix = key_prefix
        self.storage = {}
        super().__init__()

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        user_id = event.from_user.id if event.from_user else None
        if not user_id:
            return await handler(event, data)

        key = f"{self.key_prefix}:{user_id}"
        current_time = time.time()

        last_request = self.storage.get(key, 0)
        if current_time - last_request < self.limit:
            logger.warning(f"Rate limit exceeded for user {user_id}")
            if hasattr(event, "message"):
                await event.message.answer("Please slow down! You're sending messages too fast.")
            return None

        self.storage[key] = current_time
        return await handler(event, data)