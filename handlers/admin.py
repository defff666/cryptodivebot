from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
from config import ADMIN_IDS
from services.user_manager import UserManager
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = Router()

@router.message(commands=["admin"])
async def admin_panel(message: Message, state: FSMContext):
    """Open admin panel for authorized users."""
    try:
        if message.from_user.id not in ADMIN_IDS:
            await message.answer("Access denied.")
            logger.warning(f"Unauthorized admin access attempt by {message.from_user.id}")
            return
        await message.answer(
            "Admin Panel:\n"
            "- /stats: View statistics\n"
            "- /ban <user_id>: Ban a user\n"
            "- /broadcast <message>: Send a broadcast"
        )
        logger.info(f"Admin panel accessed by {message.from_user.id}")
    except Exception as e:
        logger.error(f"Error in admin_panel for user {message.from_user.id}: {e}")
        await message.answer("Failed to open admin panel.")

@router.message(commands=["stats"])
async def stats(message: Message, state: FSMContext):
    """Show admin statistics."""
    try:
        if message.from_user.id not in ADMIN_IDS:
            await message.answer("Access denied.")
            logger.warning(f"Unauthorized stats access attempt by {message.from_user.id}")
            return
        user_manager = UserManager(message.bot, state)
        stats = await user_manager.get_stats()
        await message.answer(
            f"Statistics:\n"
            f"Total Users: {stats['total_users']}\n"
            f"Total Matches: {stats['total_matches']}\n"
            f"Active Chats: {stats['active_chats']}"
        )
        logger.info(f"Stats viewed by admin {message.from_user.id}")
    except Exception as e:
        logger.error(f"Error in stats for user {message.from_user.id}: {e}")
        await message.answer("Failed to fetch statistics.")

@router.message(commands=["ban"])
async def ban_user(message: Message, state: FSMContext):
    """Ban a user by ID."""
    try:
        if message.from_user.id not in ADMIN_IDS:
            await message.answer("Access denied.")
            logger.warning(f"Unauthorized ban attempt by {message.from_user.id}")
            return
        parts = message.text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].isdigit():
            await message.answer("Usage: /ban <user_id>")
            logger.warning(f"Invalid ban command by {message.from_user.id}: {message.text}")
            return
        user_id = int(parts[1])
        user_manager = UserManager(message.bot, state)
        await user_manager.ban_user(user_id)
        await message.answer(f"User {user_id} banned.")
        logger.info(f"User {user_id} banned by admin {message.from_user.id}")
    except Exception as e:
        logger.error(f"Error in ban_user for user {message.from_user.id}: {e}")
        await message.answer("Failed to ban user.")

@router.message(commands=["broadcast"])
async def broadcast(message: Message, state: FSMContext):
    """Send a broadcast message to all users."""
    try:
        if message.from_user.id not in ADMIN_IDS:
            await message.answer("Access denied.")
            logger.warning(f"Unauthorized broadcast attempt by {message.from_user.id}")
            return
        parts = message.text.split(maxsplit=1)
        if len(parts) < 2:
            await message.answer("Usage: /broadcast <message>")
            logger.warning(f"Invalid broadcast command by {message.from_user.id}: {message.text}")
            return
        text = parts[1]
        user_manager = UserManager(message.bot, state)
        await user_manager.broadcast(text)
        await message.answer("Broadcast sent.")
        logger.info(f"Broadcast sent by admin {message.from_user.id}")
    except Exception as e:
        logger.error(f"Error in broadcast for user {message.from_user.id}: {e}")
        await message.answer("Failed to send broadcast.")
