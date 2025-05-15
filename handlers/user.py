from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, WebAppInfo, ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.exceptions import TelegramBadRequest
from config import WEB_APP_URL
from services.user_manager import UserManager
from services.matching import MatchingService
from services.chat import ChatService
from services.quiz import QuizService
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = Router()

# States for registration
class Registration(StatesGroup):
    nickname = State()
    age = State()
    country = State()
    city = State()
    gender = State()
    interests = State()
    photo = State()

# Main menu
def get_main_menu():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Open App", web_app=WebAppInfo(url=WEB_APP_URL))]
        ],
        resize_keyboard=True
    )

@router.message(F.command == "start")
async def start(message: Message, state: FSMContext):
    """Handle /start command."""
    await state.clear()
    user_manager = UserManager(message.bot, state)
    user = await user_manager.get_user(message.from_user.id)
    if user:
        await message.answer("Welcome back! Open the app to continue.", reply_markup=get_main_menu())
    else:
        await message.answer("Welcome to CryptoDiveBot! Open the app to register.", reply_markup=get_main_menu())
    logger.info(f"User {message.from_user.id} started bot")

# Handle Web App data
@router.message(F.web_app_data)
async def web_app_data(message: Message, state: FSMContext):
    """Handle data from Web App."""
    try:
        data = json.loads(message.web_app_data.data)
        action = data.get("action")
        if not action:
            await message.answer("Invalid Web App data.")
            logger.error(f"Invalid Web App data for user {message.from_user.id}")
            return

        user_manager = UserManager(message.bot, state)

        if action == "register":
            user_data = data.get("data", {})
            required_fields = ["nickname", "age", "country", "city", "gender", "interests"]
            if not all(key in user_data for key in required_fields):
                await message.answer("Incomplete registration data. Please try again.")
                logger.error(f"Incomplete registration data for user {message.from_user.id}")
                return
            try:
                await user_manager.register_user(
                    user_id=message.from_user.id,
                    nickname=user_data["nickname"],
                    age=int(user_data["age"]),
                    country=user_data["country"],
                    city=user_data["city"],
                    gender=user_data["gender"],
                    interests=user_data["interests"],
                    photo=user_data.get("photo")
                )
                await message.answer("Registration complete! Open the app to continue.", reply_markup=get_main_menu())
                logger.info(f"User {message.from_user.id} registered successfully")
            except ValueError as e:
                await message.answer(f"Invalid data: {e}")
                logger.error(f"Registration failed for user {message.from_user.id}: {e}")

        elif action == "edit_profile":
            user_data = data.get("data", {})
            await user_manager.update_user(
                user_id=message.from_user.id,
                nickname=user_data.get("nickname"),
                age=int(user_data["age"]) if user_data.get("age") else None,
                country=user_data.get("country"),
                city=user_data.get("city"),
                gender=user_data.get("gender"),
                interests=user_data.get("interests"),
                photo=user_data.get("photo")
            )
            await message.answer("Profile updated! Open the app to view.", reply_markup=get_main_menu())
            logger.info(f"User {message.from_user.id} updated profile")

        elif action == "like":
            target_id = data.get("target_id")
            if not target_id:
                await message.answer("Invalid target ID.")
                logger.error(f"Invalid target ID for like by user {message.from_user.id}")
                return
            matching_service = MatchingService(message.bot)
            match = await matching_service.like_user(message.from_user.id, int(target_id))
            if match:
                await message.answer("It's a match! You can now chat with this user.", reply_markup=get_main_menu())
                logger.info(f"Match between {message.from_user.id} and {target_id}")

        elif action == "chat":
            target_id = data.get("target_id")
            text = data.get("text")
            if not (target_id and text):
                await message.answer("Invalid chat data.")
                logger.error(f"Invalid chat data for user {message.from_user.id}")
                return
            chat_service = ChatService(message.bot)
            await chat_service.send_message(message.from_user.id, int(target_id), text)
            logger.info(f"Message sent from {message.from_user.id} to {target_id}")

        elif action == "quiz_answer":
            question_id = data.get("question_id")
            answer = data.get("answer")
            if not (question_id and answer):
                await message.answer("Invalid quiz data.")
                logger.error(f"Invalid quiz data for user {message.from_user.id}")
                return
            quiz_service = QuizService(message.bot, state)
            correct = await quiz_service.process_answer(message.from_user.id, question_id, answer)
            if correct:
                await message.answer("Correct! +1 coin")
            else:
                await message.answer("Wrong answer. Try again!")
            logger.info(f"User {message.from_user.id} answered quiz question {question_id}: {'correct' if correct else 'wrong'}")

    except json.JSONDecodeError:
        await message.answer("Invalid Web App data format.")
        logger.error(f"Invalid JSON in Web App data for user {message.from_user.id}")
    except Exception as e:
        await message.answer("An error occurred. Please try again.")
        logger.error(f"Web app data processing failed for user {message.from_user.id}: {e}")