import json
import random
from aiogram.fsm.state import State, StatesGroup
import logging

logger = logging.getLogger(__name__)

class QuizService:
    class QuizStates(StatesGroup):
        answering = State()

    def __init__(self):
        with open("data/questions.json", "r") as f:
            self.questions = json.load(f)

    def get_next_question(self):
        return random.choice(self.questions)

    async def check_answer(self, question_index, answer_index, user_id):
        try:
            question = self.questions[question_index % len(self.questions)]
            return answer_index == question["correct"]
        except Exception as e:
            logger.error(f"Error checking answer: {e}")
            raise
