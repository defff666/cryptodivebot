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
    except FileNotFoundError:
        logger.error("webapp/index.html not found")
        raise web.HTTPNotFound(text="Web App file not found")
    except Exception as e:
        logger.error(f"Error serving webapp: {e}")
        raise web.HTTPInternalServerError(text=str(e))

async def handle_root(request):
    logger.info("Root route accessed, returning 404")
    raise web.HTTPNotFound(text="Not found")

async def handle_webhook(request):
    try:
        update = await request.json()
        dp = request.app['dispatcher']
        bot = request.app['bot']
        await dp.feed_raw_update(bot, update)
        return web.Response(status=200)
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return web.Response(status=500)

async def start_web_server(bot: Bot, dp: Dispatcher):
    app = web.Application()
    app['bot'] = bot
    app['dispatcher'] = dp
    app.router.add_get('/webapp', handle_webapp)
    app.router.add_get('/', handle_root)
    app.router.add_post('/webhook', handle_webhook)
    app.router.add_static('/webapp/static/', path='webapp/static/', name='static')
    port = int(os.getenv("PORT", 10000))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    logger.info(f"Web server started on port {port}")

    # Устанавливаем Webhook
    webhook_url = f"{WEBAPP_URL}/webhook".replace('/webapp', '')
    await bot.set_webhook(webhook_url)
    logger.info(f"Webhook set to {webhook_url}")

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

        # Запускаем веб-сервер
        await start_web_server(bot, dp)
    except Exception as e:
        logger.error(f"Bot or web server failed to start: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
