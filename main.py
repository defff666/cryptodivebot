import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand
from config import BOT_TOKEN, WEBAPP_URL
from handlers.user import router as user_router
from handlers.admin import router as admin_router
from middleware.throttling import ThrottlingMiddleware
from middleware.dispatcher import DispatcherMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

async def set_commands(bot: Bot):
    commands = [
        BotCommand(command="/start", description="Start the bot"),
        BotCommand(command="/admin", description="Admin panel (for admins only)"),
    ]
    await bot.set_my_commands(commands)

async def main():
    try:
        bot = Bot(token=BOT_TOKEN, parse_mode="HTML")
        dp = Dispatcher(storage=MemoryStorage())
        dp.message.middleware(DispatcherMiddleware(dp))
        dp.message.middleware(ThrottlingMiddleware(limit=2.0))
        dp.include_routers(user_router, admin_router)
        
        await set_commands(bot)
        logger.info("Bot is starting...")
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    except Exception as e:
        logger.error(f"Bot failed to start: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
