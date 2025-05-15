import asyncio
import logging
import asyncpg
import json
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

async def init_db_endpoint(request):
    try:
        pool = await asyncpg.create_pool(DATABASE_URL)
        async with pool.acquire() as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    telegram_id BIGINT PRIMARY KEY,
                    nickname TEXT NOT NULL,
                    age INTEGER,
                    country TEXT,
                    city TEXT,
                    gender TEXT,
                    interests TEXT,
                    photo TEXT,
                    coins INTEGER DEFAULT 10,
                    likes JSONB DEFAULT '[]',
                    matches JSONB DEFAULT '[]',
                    blocked BOOLEAN DEFAULT FALSE
                )
            ''')
        await pool.close()
        logger.info("Database initialized via endpoint")
        return web.json_response({'status': 'success'})
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        return web.json_response({'status': 'error', 'message': str(e)}, status=500)

async def handle_webapp_data(request):
    try:
        data = await request.json()
        logger.info(f"Received WebApp data: {data}")
        pool = request.app['dp'].storage.data.get("db_pool")
        action = data.get('action')
        user_data = data.get('data', {})

        if action in ['register', 'edit_profile']:
            async with pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO users (telegram_id, nickname, age, country, city, gender, interests, photo, coins)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (telegram_id) DO UPDATE
                    SET nickname = $2, age = $3, country = $4, city = $5, gender = $6, interests = $7, photo = $8, coins = $9
                ''', user_data.get('telegram_id', 0), user_data.get('nickname'), user_data.get('age'),
                    user_data.get('country'), user_data.get('city'), user_data.get('gender'),
                    user_data.get('interests'), user_data.get('photo'), user_data.get('coins', 10))
                logger.info(f"User profile updated: {user_data.get('nickname')}")
        return web.json_response({'status': 'success'})
    except Exception as e:
        logger.error(f"Error handling WebApp data: {e}")
        return web.json_response({'status': 'error', 'message': str(e)}, status=500)

async def get_profile(request):
    try:
        telegram_id = int(request.query.get('telegram_id', 0))
        pool = request.app['dp'].storage.data.get("db_pool")
        async with pool.acquire() as conn:
            user = await conn.fetchrow('''
                SELECT * FROM users WHERE telegram_id = $1
            ''', telegram_id)
            if user:
                return web.json_response({
                    'status': 'success',
                    'profile': dict(user)
                })
            return web.json_response({'status': 'error', 'message': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        return web.json_response({'status': 'error', 'message': str(e)}, status=500)

app = web.Application()
app['dp'] = Dispatcher(bot=Bot(token=BOT_TOKEN, parse_mode="HTML"), storage=MemoryStorage())
app.router.add_static('/static/', path='webapp/static', name='static')
app.router.add_get('/webapp', serve_index)
app.router.add_get('/', serve_index)
app.router.add_post('/webapp/data', handle_webapp_data)
app.router.add_get('/init-db', init_db_endpoint)
app.router.add_get('/profile', get_profile)

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
        dp = app['dp']

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
