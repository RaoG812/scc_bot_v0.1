import os
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from telegram import Update, ForceReply
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext

# Set up logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# Replace with your Google Sheets API credentials
SERVICE_ACCOUNT_FILE = 'credentials.json'
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

# Replace with your Google Sheets ID and range
SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'
RANGE_NAME = 'Members!A:C'  # Adjust as per your sheet structure

# Set up Google Sheets API
def get_member_data():
    creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('sheets', 'v4', credentials=creds)
    sheet = service.spreadsheets()
    
    result = sheet.values().get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME).execute()
    values = result.get('values', [])
    
    return {row[0]: row[1:] for row in values} if values else {}

# Command to start the bot
def start(update: Update, context: CallbackContext) -> None:
    update.message.reply_text('Welcome! Please enter your membership card number.')

# Command to authenticate membership
def authenticate(update: Update, context: CallbackContext) -> None:
    membership_card_number = update.message.text.strip()
    members_data = get_member_data()
    
    if membership_card_number in members_data:
        membership_tier = members_data[membership_card_number][0]  # Assuming first column is the tier
        update.message.reply_text(f'Authentication successful! Your membership tier is: {membership_tier}.')
        navigate_user(update, membership_tier)
    else:
        update.message.reply_text('Authentication failed. Please check your membership card number.')

# Function to navigate users based on their membership tier
def navigate_user(update: Update, membership_tier: str) -> None:
    if membership_tier.lower() == 'basic':
        update.message.reply_text('You have access to the main channel and public chats.')
    elif membership_tier.lower() == 'gold':
        update.message.reply_text('You have access to the main channel, shopping branch, and public chats.')
    elif membership_tier.lower() == 'supreme':
        update.message.reply_text('You have full access to all channels and chats.')
    else:
        update.message.reply_text('Unknown membership tier.')

# Main function to run the bot
def main() -> None:
    # Replace 'YOUR_TELEGRAM_TOKEN' with your bot's API token
    updater = Updater("YOUR_TELEGRAM_TOKEN")
    
    # Get the dispatcher to register handlers
    dispatcher = updater.dispatcher
    
    # Command handlers
    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, authenticate))
    
    # Start the Bot
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()
