import asyncio
import logging
import asyncpg
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from config import BOT_TOKEN, DATABASE_URL, WEB_APP_URL
from handlers import user, admin
from middleware.dispatcher import DispatcherMiddleware
from middleware.throttling import ThrottlingMiddleware

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def on_startup(dp: Dispatcher):
    """Initialize database pool and store it in Dispatcher."""
    try:
        pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=10,
            statement_cache_size=0
        )
        dp.storage.data["db_pool"] = pool
        logger.info("Database pool initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        raise

async def on_shutdown(dp: Dispatcher):
    """Close database pool."""
    try:
        pool = dp.storage.data.get("db_pool")
        if pool:
            await asyncio.wait_for(pool.close(), timeout=10.0)
            logger.info("Database pool closed")
    except Exception as e:
        logger.error(f"Failed to close database pool: {e}")

def main():
    """Main function to set up and run the bot."""
    try:
        bot = Bot(token=BOT_TOKEN, parse_mode="HTML")
        storage = MemoryStorage()
        dp = Dispatcher(bot=bot, storage=storage)

        # Register middleware
        dp.message.middleware(DispatcherMiddleware())
        dp.message.middleware(ThrottlingMiddleware(limit=2.0))

        # Register handlers
        dp.include_router(user.router)
        dp.include_router(admin.router)

        # Start bot
        asyncio.run(dp.start_polling(
            on_startup=on_startup,
            on_shutdown=on_shutdown
        ))
    except Exception as e:
        logger.error(f"Bot failed to start: {e}")
        raise

if __name__ == "__main__":
    main()
