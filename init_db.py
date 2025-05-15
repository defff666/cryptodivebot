import asyncpg
import logging
import asyncio
from config import DATABASE_URL

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def init_db(pool=None):
    """Initialize database schema."""
    local_pool = None
    if pool is None:
        try:
            local_pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=1,
                max_size=10,
                statement_cache_size=0
            )
            pool = local_pool
            logger.info("Created local database pool")
        except Exception as e:
            logger.error(f"Failed to create local database pool: {e}")
            raise

    async with pool.acquire() as conn:
        try:
            # Drop table if exists
            await conn.execute("DROP TABLE IF EXISTS users")
            logger.info("Dropped existing users table")
            # Create users table
            await conn.execute("""
                CREATE TABLE users (
                    id BIGINT PRIMARY KEY,
                    nickname TEXT NOT NULL,
                    age INTEGER NOT NULL,
                    country TEXT NOT NULL,
                    city TEXT NOT NULL,
                    gender TEXT NOT NULL,
                    interests TEXT NOT NULL,
                    photo TEXT,
                    coins INTEGER DEFAULT 0,
                    likes TEXT[] DEFAULT '{}',
                    matches TEXT[] DEFAULT '{}',
                    blocked BOOLEAN DEFAULT FALSE
                );
                CREATE INDEX idx_users_id ON users(id);
                CREATE INDEX idx_users_city ON users(city);
            """)
            logger.info("Created users table with indexes")
            # Verify table creation
            result = await conn.fetchrow("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users'
                )
            """)
            if result["exists"]:
                schema = await conn.fetch("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                """)
                logger.info(f"Verified users table schema: {schema}")
            else:
                logger.error("Failed to verify users table creation")
                raise RuntimeError("Users table not created")
        except Exception as e:
            logger.error(f"Failed to create table: {e}")
            raise
        finally:
            if local_pool:
                try:
                    if not local_pool._closed:
                        await asyncio.wait_for(local_pool.close(), timeout=10.0)
                        logger.info("Local database pool closed")
                    else:
                        logger.info("Local database pool already closed")
                except asyncio.TimeoutError:
                    logger.warning("Timeout while closing local pool")
                except Exception as e:
                    logger.error(f"Failed to close local pool: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(init_db())
        logger.info("Database initialization completed")
    except KeyboardInterrupt:
        logger.info("Initialization interrupted by user")
    except Exception as e:
        logger.error(f"Initialization failed: {e}")