import asyncpg
import logging
import asyncio
from config import DATABASE_URL

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
            # Check if users table exists
            result = await conn.fetchrow("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users'
                )
            """)
            
            if not result["exists"]:
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
            else:
                # Check and add photo column if missing
                columns = await conn.fetch("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                """)
                column_names = [c['column_name'] for c in columns]
                if 'photo' not in column_names:
                    await conn.execute("ALTER TABLE users ADD COLUMN photo TEXT")
                    logger.info("Added photo column to users table")
                
                logger.info("Users table already exists, verified schema")

            # Verify table
            schema = await conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users'
            """)
            logger.info(f"Users table schema: {schema}")
        except Exception as e:
            logger.error(f"Failed to initialize schema: {e}")
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
