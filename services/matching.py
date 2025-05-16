import asyncpg
from config import DATABASE_URL
from models.user import User
import logging

logger = logging.getLogger(__name__)

class MatchingService:
    async def get_next_user(self, user_id, city, gender, interests):
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            query = """
                SELECT * FROM users 
                WHERE user_id != $1 AND blocked = FALSE AND city ILIKE $2 
                AND gender = ANY($3::varchar[]) 
                AND interests && $4::text[]
                AND NOT ($1 = ANY(likes))
                LIMIT 1
            """
            gender_filter = self.get_gender_filter(gender)
            row = await conn.fetchrow(query, user_id, city, gender_filter, interests)
            await conn.close()
            return User(**row) if row else None
        except Exception as e:
            logger.error(f"Error getting next user: {e}")
            raise

    def get_gender_filter(self, gender):
        if gender == "Male":
            return ["Female", "Bi", "Lesbian"]
        elif gender == "Female":
            return ["Male", "Bi", "Gay"]
        elif gender == "Bi":
            return ["Bi", "Lesbian", "Gay"]
        elif gender == "Lesbian":
            return ["Female", "Bi", "Lesbian"]
        elif gender == "Gay":
            return ["Male", "Bi", "Gay"]
        return []

    async def add_like(self, user_id, target_id):
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            await conn.execute("UPDATE users SET likes = array_append(likes, $1) WHERE user_id = $2", target_id, user_id)
            target = await conn.fetchrow("SELECT likes, matches FROM users WHERE user_id = $1", target_id)
            if user_id in (target["likes"] or []):
                await conn.execute("UPDATE users SET matches = array_append(matches, $1) WHERE user_id = $2", target_id, user_id)
                await conn.execute("UPDATE users SET matches = array_append(matches, $1) WHERE user_id = $2", user_id, target_id)
                await conn.close()
                return True
            await conn.close()
            return False
        except Exception as e:
            logger.error(f"Error adding like: {e}")
            raise
