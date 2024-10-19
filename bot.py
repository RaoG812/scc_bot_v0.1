import os
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from telegram import Update
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext

# Set up logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# Google Sheets API configuration
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
SAMPLE_SPREADSHEET_ID = "1m0wrn2aaCY8wdKIFpxKg_k1O8ZMf1impeOIfAymcMnw"  # Replace with your spreadsheet ID
SAMPLE_RANGE_NAME = "Members!A2:C"  # Adjust range as necessary

# Initialize credentials
creds = None
if os.path.exists("token.json"):
    creds = Credentials.from_authorized_user_file("token.json", SCOPES)
if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
        creds = flow.run_local_server(port=0)
    with open("token.json", "w") as token:
        token.write(creds.to_json())

# Function to authenticate user
def authenticate_member(card_number):
    try:
        service = build("sheets", "v4", credentials=creds)
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=SAMPLE_SPREADSHEET_ID, range=SAMPLE_RANGE_NAME).execute()
        values = result.get("values", [])

        for row in values:
            if row[0] == card_number:  # Assuming card number is in the first column
                return row[1]  # Return membership tier or any other info needed
        return None
    except HttpError as err:
        logging.error(err)
        return None

# Command handler to start the bot
def start(update: Update, context: CallbackContext):
    update.message.reply_text("Welcome! Please enter your membership card number.")

# Message handler to process card number
def handle_message(update: Update, context: CallbackContext):
    card_number = update.message.text
    membership_tier = authenticate_member(card_number)

    if membership_tier:
        update.message.reply_text(f"Authenticated! Your membership tier is: {membership_tier}")
        # Here you can add logic to navigate based on membership tier
    else:
        update.message.reply_text("Authentication failed. Please check your card number.")

# Main function to run the bot
def main():
    updater = Updater("YOUR_TELEGRAM_BOT_TOKEN")  # Replace with your bot token
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(MessageHandler(Filters.text & ~Filters.command, handle_message))

    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()
