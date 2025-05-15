from aiogram import Router, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from config import ADMIN_IDS, WEB_APP_URL
from services.user_manager import UserManager
import logging
import json

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = Router()

class AdminStates(StatesGroup):
    ban_user = State()
    broadcast = State()
    manage_coins = State()
    edit_user = State()

def get_admin_menu():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Open Admin Panel", web_app=WebAppInfo(url=WEB_APP_URL + "/admin"))]
        ],
        resize_keyboard=True
    )

@router.message(F.command == "admin")
async def admin_panel(message: Message, state: FSMContext):
    """Handle /admin command."""
    if message.from_user.id not in ADMIN_IDS:
        await message.answer("Access denied.")
        logger.warning(f"Unauthorized admin access attempt by {message.from_user.id}")
        return
    await state.clear()
    await message.answer("Welcome to the admin panel. Open the panel to manage users.", reply_markup=get_admin_menu())
    logger.info(f"Admin {message.from_user.id} accessed admin panel")

@router.message(F.web_app_data & F.web_app_data.data.contains("admin_"))
async def admin_web_app_data(message: Message, state: FSMContext):
    """Handle admin Web App data."""
    if message.from_user.id not in ADMIN_IDS:
        await message.answer("Access denied.")
        logger.warning(f"Unauthorized admin Web App access by {message.from_user.id}")
        return
    try:
        data = json.loads(message.web_app_data.data)
        action = data.get("action")
        if not action:
            await message.answer("Invalid admin action.")
            logger.error(f"Invalid admin action for {message.from_user.id}")
            return

        user_manager = UserManager(message.bot, state)

        if action == "admin_stats":
            stats = await user_manager.get_stats()
            await message.answer(
                f"Stats:\nUsers: {stats['total_users']}\nMatches: {stats['total_matches']}\nActive Chats: {stats['active_chats']}"
            )
            logger.info(f"Admin {message.from_user.id} viewed stats")

        elif action == "admin_ban":
            user_id = data.get("user_id")
            if not user_id:
                await message.answer("Invalid user ID.")
                logger.error(f"Invalid user ID for ban by {message.from_user.id}")
                return
            await user_manager.ban_user(int(user_id))
            await message.answer(f"User {user_id} banned.")
            logger.info(f"Admin {message.from_user.id} banned user {user_id}")

        elif action == "admin_broadcast":
            text = data.get("text")
            if not text:
                await message.answer("Broadcast text is required.")
                logger.error(f"Empty broadcast text by {message.from_user.id}")
                return
            await user_manager.broadcast(text)
            await message.answer("Broadcast sent.")
            logger.info(f"Admin {message.from_user.id} sent broadcast")

        elif action == "admin_coins":
            user_id = data.get("user_id")
            amount = data.get("amount")
            if not (user_id and amount is not None):
                await message.answer("Invalid user ID or amount.")
                logger.error(f"Invalid coins data by {message.from_user.id}")
                return
            await user_manager.update_user(user_id=int(user_id), coins=int(amount))
            await message.answer(f"Updated coins for user {user_id}.")
            logger.info(f"Admin {message.from_user.id} updated coins for {user_id}")

        elif action == "admin_edit_user":
            user_id = data.get("user_id")
            nickname = data.get("nickname")
            coins = data.get("coins")
            if not user_id:
                await message.answer("Invalid user ID.")
                logger.error(f"Invalid user ID for edit by {message.from_user.id}")
                return
            await user_manager.update_user(
                user_id=int(user_id),
                nickname=nickname,
                coins=int(coins) if coins is not None else None
            )
            await message.answer(f"User {user_id} updated.")
            logger.info(f"Admin {message.from_user.id} edited user {user_id}")

    except json.JSONDecodeError:
        await message.answer("Invalid Web App data format.")
        logger.error(f"Invalid JSON in admin Web App data for {message.from_user.id}")
    except Exception as e:
        await message.answer("An error occurred. Please try again.")
        logger.error(f"Admin web app data processing failed for {message.from_user.id}: {e}")
