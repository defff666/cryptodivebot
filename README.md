CryptoDiveBot
A Telegram Mini App for dating, inspired by Badoo and Tinder.
Features

User registration with profile creation
Profile viewing and editing
User search with like/next actions
Matching and chat
Quiz with coin rewards
Admin panel for stats, bans, and broadcasts
Coins system

Deployment on Replit

Create a Repl:

Go to https://replit.com.
Click "Create Repl" → select "Python" → name it cryptodivebot.


Upload Project:

Download cryptodivebot.zip (provided separately).
In Replit, go to "Files" → "Upload" → select cryptodivebot.zip.
Replit will unpack the archive.


Set Environment Variables:

In Replit, open "Secrets" tab.
Add:
BOT_TOKEN: Your bot token from @BotFather.
DATABASE_URL: Your Neon PostgreSQL connection string.
ADMIN_IDS: Your Telegram ID (e.g., 123456789).
WEB_APP_URL: Your Replit Web App URL (e.g., https://your-replit-url.repl.co/webapp).




Install Dependencies:
poetry install


Run the Bot:
python main.py

Expected output:
INFO:__main__:Database pool created successfully
INFO:init_db:Dropped existing users table
INFO:init_db:Created users table
INFO:aiogram.dispatcher:Start polling


Set Web App:

In @BotFather, send /setmenubutton.
Select @CryptoDiveBot, set button to "Open App" with URL https://your-replit-url.repl.co/webapp.


Test:

Open @CryptoDiveBot, click "Open App".
Complete registration, test profile, search, chat, quiz, and admin panel.



Project Structure

main.py: Bot initialization.
config.py: Environment variables.
init_db.py: Database setup.
handlers/: Telegram event handlers.
services/: Business logic (OOP).
models/: Data models.
middleware/: Aiogram middleware.
webapp/: Telegram Web App frontend.
data/: Quiz questions.
.env: Environment variables.
pyproject.toml: Dependencies.

Troubleshooting

Bot not starting: Check logs (python main.py), ensure BOT_TOKEN and DATABASE_URL are correct.
Web App not loading: Verify WEB_APP_URL in .env.
Database errors: Run python init_db.py to debug.

