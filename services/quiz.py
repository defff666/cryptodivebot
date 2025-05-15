from aiogram import Bot
from aiogram.fsm.context import FSMContext
import json
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QuizService:
    def __init__(self, bot: Bot, state: FSMContext):
        self.bot = bot
        self.state = state

    async def get_question(self):
        """Get a random quiz question."""
        with open("data/questions.json", "r") as f:
            questions = json.load(f)
        return random.choice(questions)

    async def process_answer(self, user_id: int, question_id: str, answer: str):
        """Process quiz answer and update coins."""
        with open("data/questions.json", "r") as f:
            questions = json.load(f)
        question = next((q for q in questions if q["id"] == question_id), None)
        if not question:
            return False
        correct = answer == question["correct"]
        if correct:
            pool = self.bot.get("db_pool")
            async with pool.acquire() as conn:
                await conn.execute(
                    "UPDATE users SET coins = coins + 1 WHERE id = $1",
                    user_id
                )
        return correct