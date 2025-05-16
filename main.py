import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand
from aiohttp import web
from config import BOT_TOKEN, WEBAPP_URL
from handlers.user import router as user_router
from handlers.admin import router as admin_router
from middleware.throttling import ThrottlingMiddleware
from middleware.dispatcher import DispatcherMiddleware
from init_db import init_db
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

async def set_commands(bot: Bot):
    commands = [
        BotCommand(command="/start", description="Start the bot"),
        BotCommand(command="/admin", description="Admin panel (for admins only)"),
    ]
    await bot.set_my_commands(commands)

async def handle_webapp(request):
    try:
        logger.info(f"Serving webapp for request: {request.path}")
        return web.FileResponse('webapp/index.html')
    except Exception as e:
        logger.error(f"Error serving webapp: {e}")
        raise web.HTTPNotFound()

async def handle_root(request):
    logger.info("Root route accessed, returning 404")
    raise web.HTTPNotFound()

async def start_web_server():
    app = web.Application()
    app.router.add_get('/webapp', handle_webapp)
    app.router.add_get('/', handle_root)  # Обработка корневого маршрута
    app.router.add_static('/webapp/static/', path='webapp/static/', name='static')
    port = int(os.getenv("PORT", 10000))  # Render предоставляет PORT
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    logger.info(f"Web server started on port {port}")

async def main():
    try:
        # Инициализация базы данных
        await init_db()
        logger.info("Database initialization attempted")

        # Запуск бота
        bot = Bot(token=BOT_TOKEN, parse_mode="HTML")
        dp = Dispatcher(storage=MemoryStorage())
        dp.message.middleware(DispatcherMiddleware(dp))
        dp.message.middleware(ThrottlingMiddleware(limit=2.0))
        dp.include_routers(user_router, admin_router)
        
        await set_commands(bot)
        logger.info("Bot is starting...")

        # Запускаем веб-сервер и polling параллельно
        await asyncio.gather(
            start_web_server(),
            dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
        )
    except Exception as e:
        logger.error(f"Bot or web server failed to start: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
