from aiogram import BaseMiddleware
from aiogram.types import TelegramObject

class DispatcherMiddleware(BaseMiddleware):
    def __init__(self, dp):
        self.dp = dp
        super().__init__()

    async def __call__(self, handler, event: TelegramObject, data: dict):
        data["dp"] = self.dp
        return await handler(event, data)
