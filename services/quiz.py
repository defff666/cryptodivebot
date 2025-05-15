import json
import random
import logging
from aiogram import Bot
from aiogram.fsm.context import FSMContext
from services.coins import CoinsService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class QuizService:
    def __init__(self, bot: Bot, state: FSMContext):
        self.bot = bot
        self.state = state
        self.coins_service = CoinsService(bot, state)
        with open('data/questions.json', 'r') as f:
            self.questions = json.load(f)

    async def start_quiz(self, user_id: int):
        """Start a new quiz session."""
        try:
            questions = random.sample(self.questions, 5)
            await self.state.update_data(
                quiz_questions=questions,
                quiz_index=0,
                quiz_correct=0
            )
            await self.send_question(user_id)
            logger.info(f"Started quiz for user {user_id}")
        except Exception as e:
            logger.error(f"Error starting quiz for user {user_id}: {e}")
            raise

    async def send_question(self, user_id: int):
        """Send the current quiz question."""
        try:
            data = await self.state.get_data()
            questions = data.get('quiz_questions', [])
            index = data.get('quiz_index', 0)
            if index >= len(questions):
                await self.finish_quiz(user_id)
                return
            question = questions[index]
            options = '\n'.join(f"{i+1}. {opt}" for i, opt in enumerate(question['options']))
            await self.bot.send_message(
                user_id,
                f"Question {index+1}/5:\n{question['text']}\n\n{options}"
            )
            logger.info(f"Sent question {index+1} to user {user_id}")
        except Exception as e:
            logger.error(f"Error sending question to user {user_id}: {e}")
            raise

    async def process_answer(self, user_id: int, question_id: str, answer: str):
        """Process a quiz answer."""
        try:
            data = await self.state.get_data()
            questions = data.get('quiz_questions', [])
            index = data.get('quiz_index', 0)
            if index >= len(questions):
                return False
            question = questions[index]
            if question['id'] != question_id:
                logger.warning(f"Invalid question ID {question_id} for user {user_id}")
                return False
            correct = answer == question['correct']
            if correct:
                await self.coins_service.add_coins(user_id, 1)
                await self.state.update_data(quiz_correct=data.get('quiz_correct', 0) + 1)
            await self.state.update_data(quiz_index=index + 1)
            await self.send_question(user_id)
            logger.info(f"User {user_id} answered question {question_id}: {'correct' if correct else 'wrong'}")
            return correct
        except Exception as e:
            logger.error(f"Error processing answer for user {user_id}: {e}")
            raise

    async def finish_quiz(self, user_id: int):
        """Finish the quiz and show results."""
        try:
            data = await self.state.get_data()
            correct = data.get('quiz_correct', 0)
            await self.bot.send_message(
                user_id,
                f"Quiz finished!\nCorrect answers: {correct}/5\nCoins earned: {correct}"
            )
            await self.state.clear()
            logger.info(f"Finished quiz for user {user_id}: {correct}/5 correct")
        except Exception as e:
            logger.error(f"Error finishing quiz for user {user_id}: {e}")
            raise
