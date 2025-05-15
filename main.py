import asyncio
import logging
import asyncpg
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from config import BOT_TOKEN, DATABASE_URL, WEB_APP_URL
from handlers import user, admin
from middleware.dispatcher import DispatcherMiddleware
from middleware.throttling import ThrottlingMiddleware
from aiohttp import web
import os

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def on_startup(dp: Dispatcher):
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
    try:
        pool = dp.storage.data.get("db_pool")
        if pool:
            await asyncio.wait_for(pool.close(), timeout=10.0)
            logger.info("Database pool closed")
    except Exception as e:
        logger.error(f"Failed to close database pool: {e}")

async def serve_index(request):
    return web.FileResponse('webapp/index.html')

app = web.Application()
app.router.add_static('/static/', path='webapp/static', name='static')
app.router.add_get('/webapp', serve_index)
app.router.add_get('/', serve_index)  # Redirect root to Web App

async def start_web_server():
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.getenv('PORT', 8000))
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    logger.info(f"Web server started on port {port}")

def main():
    try:
        bot = Bot(token=BOT_TOKEN, parse_mode="HTML")
        storage = MemoryStorage()
        dp = Dispatcher(bot=bot, storage=storage)

        dp.message.middleware(DispatcherMiddleware())
        dp.message.middleware(ThrottlingMiddleware(limit=2.0))

        dp.include_router(user.router)
        dp.include_router(admin.router)

        loop = asyncio.get_event_loop()
        loop.create_task(start_web_server())

        loop.run_until_complete(dp.start_polling(
            on_startup=on_startup,
            on_shutdown=on_shutdown
        ))
    except Exception as e:
        logger.error(f"Bot failed to start: {e}")
        raise

if __name__ == "__main__":
    main()
