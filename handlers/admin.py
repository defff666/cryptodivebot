from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup
from config import ADMIN_IDS
from services.user_manager import UserManager
import logging
import asyncio

logger = logging.getLogger(__name__)
router = Router()

@router.message(Command("admin"))
async def admin_panel(message: Message):
    try:
        if message.from_user.id not in ADMIN_IDS:
            await message.answer("Access denied.")
            return
        await message.answer("Admin Panel", reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Statistics", callback_data="admin_stats")],
            [InlineKeyboardButton(text="Ban User", callback_data="admin_ban")],
            [InlineKeyboardButton(text="Broadcast", callback_data="admin_broadcast")]
        ]))
    except Exception as e:
        logger.error(f"Error in admin_panel for user {message.from_user.id}: {e}")
        await message.answer("Error accessing admin panel.")

@router.callback_query(F.data == "admin_stats")
async def admin_stats(callback: CallbackQuery):
    try:
        if callback.from_user.id not in ADMIN_IDS:
            await callback.message.answer("Access denied.")
            return
        user_manager = UserManager()
        stats = await user_manager.get_stats()
        await callback.message.answer(f"Users: {stats['users']}\nMatches: {stats['matches']}\nActive Chats: {stats['chats']}")
    except Exception as e:
        logger.error(f"Error in admin_stats for user {callback.from_user.id}: {e}")
        await callback.message.answer("Error fetching stats.")

@router.callback_query(F.data == "admin_ban")
async def admin_ban(callback: CallbackQuery):
    try:
        if callback.from_user.id not in ADMIN_IDS:
            await callback.message.answer("Access denied.")
            return
        await callback.message.answer("Enter user ID to ban:")
        # Implement ban logic in a separate message handler if needed
    except Exception as e:
        logger.error(f"Error in admin_ban for user {callback.from_user.id}: {e}")
        await callback.message.answer("Error processing ban.")

@router.callback_query(F.data == "admin_broadcast")
async def admin_broadcast(callback: CallbackQuery):
    try:
        if callback.from_user.id not in ADMIN_IDS:
            await callback.message.answer("Access denied.")
            return
        await callback.message.answer("Enter broadcast message:")
        # Implement broadcast logic in a separate message handler if needed
    except Exception as e:
        logger.error(f"Error in admin_broadcast for user {callback.from_user.id}: {e}")
        await callback.message.answer("Error processing broadcast.")
