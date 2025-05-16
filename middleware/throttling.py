from aiogram import BaseMiddleware
from aiogram.types import TelegramObject
import asyncio
import logging

logger = logging.getLogger(__name__)

class ThrottlingMiddleware(BaseMiddleware):
    def __init__(self, limit: float):
        self.limit = limit
        self.last_call = {}
        super().__init__()

    async def __call__(self, handler, event: TelegramObject, data: dict):
        user_id = event.from_user.id if hasattr(event, "from_user") else None
        if user_id:
            current_time = asyncio.get_event_loop().time()
            last = self.last_call.get(user_id, 0)
            if current_time - last < self.limit:
                logger.warning(f"Throttling user {user_id}")
                return
            self.last_call[user_id] = current_time
        return await handler(event, data)
