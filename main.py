import asyncio
import asyncpg
import logging
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand
from config import BOT_TOKEN, DATABASE_URL
from handlers.user import router as user_router
from handlers.admin import router as admin_router
from middleware.dispatcher import DispatcherMiddleware
from middleware.throttling import ThrottlingMiddleware
from init_db import init_db

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def set_commands(bot: Bot):
    """Set bot commands for menu."""
    commands = [
        BotCommand(command="/start", description="Start the bot"),
        BotCommand(command="/admin", description="Admin panel (for admins only)")
    ]
    await bot.set_my_commands(commands)

async def main():
    """Main function to initialize and run the bot."""
    # Initialize database pool
    try:
        pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=10,
            statement_cache_size=0
        )
        logger.info("Database pool created successfully")

        # Check users table schema
        async with pool.acquire() as conn:
            schema = await conn.fetch(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
            )
            logger.info(f"Users table schema: {schema}")

    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return

    # Initialize bot and dispatcher
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    dp["db_pool"] = pool

    # Register routers
    dp.include_router(user_router)
    dp.include_router(admin_router)

    # Register middlewares
    dp.message.middleware(DispatcherMiddleware())
    dp.callback_query.middleware(DispatcherMiddleware())
    dp.message.middleware(ThrottlingMiddleware(limit=0.5, key_prefix="rate_limit"))

    # Initialize database schema
    try:
        await init_db(pool)
        logger.info("Database schema initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database schema: {e}")
        await pool.close()
        return

    # Set bot commands
    await set_commands(bot)

    # Start polling
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Polling failed: {e}")
    finally:
        await pool.close(timeout=5.0)
        await bot.session.close()
        logger.info("Bot stopped")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Main failed: {e}")