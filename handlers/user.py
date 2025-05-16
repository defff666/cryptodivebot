from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from config import WEBAPP_URL
from services.user_manager import UserManager
from services.matching import MatchingService
from services.quiz import QuizService
import logging

logger = logging.getLogger(__name__)
router = Router()

class RegistrationStates(StatesGroup):
    nickname = State()
    age = State()
    country = State()
    city = State()
    gender = State()
    interests = State()
    photo = State()

@router.message(Command("start"))
async def start(message: Message):
    try:
        user_id = message.from_user.id
        logger.info(f"User {user_id} triggered /start")
        user_manager = UserManager()
        user = await user_manager.get_user(user_id)
        if user:
            await message.answer("Welcome back! Use the menu below.", reply_markup=main_menu())
        else:
            await message.answer("Welcome! Let's create your profile.", reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Start Registration", web_app={"url": f"{WEBAPP_URL}/index.html"})]
            ]))
    except Exception as e:
        logger.error(f"Error in start command for user {message.from_user.id}: {e}")
        await message.answer("Something went wrong. Please try again.")

def main_menu():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="View Profile", callback_data="view_profile")],
        [InlineKeyboardButton(text="Find Users", callback_data="find_users")],
        [InlineKeyboardButton(text="Play Quiz", callback_data="play_quiz")]
    ])

@router.callback_query(F.data == "view_profile")
async def view_profile(callback: CallbackQuery):
    try:
        user_manager = UserManager()
        user = await user_manager.get_user(callback.from_user.id)
        if user:
            profile_text = f"<b>Profile</b>\n\nNickname: {user.nickname}\nAge: {user.age}\nCity: {user.city}\nGender: {user.gender}\nInterests: {', '.join(user.interests)}\nCoins: {user.coins}"
            photo = user.photo_url or None
            await callback.message.answer_photo(photo=photo, caption=profile_text, reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Edit Profile", web_app={"url": f"{WEBAPP_URL}/index.html"})]
            ])) if photo else await callback.message.answer(profile_text, reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Edit Profile", web_app={"url": f"{WEBAPP_URL}/index.html"})]
            ]))
        else:
            await callback.message.answer("Please register first.", reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Start Registration", web_app={"url": f"{WEBAPP_URL}/index.html"})]
            ]))
    except Exception as e:
        logger.error(f"Error in view_profile for user {callback.from_user.id}: {e}")
        await callback.message.answer("Error loading profile.")

@router.callback_query(F.data == "find_users")
async def find_users(callback: CallbackQuery):
    try:
        user_manager = UserManager()
        user = await user_manager.get_user(callback.from_user.id)
        if not user:
            await callback.message.answer("Please register first.")
            return
        matching = MatchingService()
        next_user = await matching.get_next_user(callback.from_user.id, user.city, user.gender, user.interests)
        if next_user:
            text = f"{next_user.nickname}, {next_user.age}, {next_user.city}\nInterests: {', '.join(next_user.interests)}"
            photo = next_user.photo_url or None
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Like ❤️", callback_data=f"like_{next_user.user_id}"),
                 InlineKeyboardButton(text="Next ➡️", callback_data="find_users")]
            ])
            await callback.message.answer_photo(photo=photo, caption=text, reply_markup=keyboard) if photo else await callback.message.answer(text, reply_markup=keyboard)
        else:
            await callback.message.answer("No more users to show.")
    except Exception as e:
        logger.error(f"Error in find_users for user {callback.from_user.id}: {e}")
        await callback.message.answer("Error finding users.")

@router.callback_query(F.data.startswith("like_"))
async def like_user(callback: CallbackQuery):
    try:
        target_id = int(callback.data.split("_")[1])
        user_id = callback.from_user.id
        matching = MatchingService()
        match = await matching.add_like(user_id, target_id)
        if match:
            await callback.message.answer("🎉 It's a Match! Start chatting!", reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Start Chat", callback_data=f"chat_{target_id}")]
            ]))
        await find_users(callback)
    except Exception as e:
        logger.error(f"Error in like_user for user {callback.from_user.id}: {e}")
        await callback.message.answer("Error processing like.")

@router.callback_query(F.data == "play_quiz")
async def start_quiz(callback: CallbackQuery, state: FSMContext):
    try:
        quiz = QuizService()
        question = quiz.get_next_question()
        await state.set_state(QuizService.QuizStates.answering)
        await state.update_data(question_index=0, correct_answers=0)
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=str(i + 1), callback_data=f"quiz_{i}") for i in range(4)]
        ])
        await callback.message.answer(f"Question 1:\n{question['text']}\n\n1. {question['options'][0]}\n2. {question['options'][1]}\n3. {question['options'][2]}\n4. {question['options'][3]}", reply_markup=keyboard)
    except Exception as e:
        logger.error(f"Error in start_quiz for user {callback.from_user.id}: {e}")
        await callback.message.answer("Error starting quiz.")
