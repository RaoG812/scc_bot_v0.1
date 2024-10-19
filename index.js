const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token from BotFather
const TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(TOKEN, { polling: true });

// Google Sheets API setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Commands
const MAIN_CHANNEL = "Main Channel";
const SHOPPING_BRANCH = "Shopping Branch";
const PRIVATE_CHAT = "Private Chat";

// Load saved credentials
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

// Save credentials
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

// Authorize and get Google Sheets API client
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// Authenticate user and return their tier
async function authenticateUser(cardNumber) {
  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // Replace with your spreadsheet ID
  const range = 'Members!A2:B'; // Adjust the range according to your sheet

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    return null;
  }

  for (const row of rows) {
    if (row[0] === cardNumber) {
      return row[1]; // Return the membership tier
    }
  }

  return null; // Not found
}

// Handle incoming messages
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! Please send your membership card number.');
});

bot.onText(/\/auth (.+)/, async (msg, match) => {
  const cardNumber = match[1].trim();
  const tier = await authenticateUser(cardNumber);

  if (tier) {
    bot.sendMessage(msg.chat.id, `Authentication successful! Your membership tier is: ${tier}`);
    
    // Navigate user based on tier
    switch (tier.toLowerCase()) {
      case 'basic':
        bot.sendMessage(msg.chat.id, `You have access to: ${MAIN_CHANNEL}`);
        break;
      case 'gold':
        bot.sendMessage(msg.chat.id, `You have access to: ${MAIN_CHANNEL} and ${SHOPPING_BRANCH}`);
        break;
      case 'supreme':
        bot.sendMessage(msg.chat.id, `You have access to: ${MAIN_CHANNEL}, ${SHOPPING_BRANCH}, and ${PRIVATE_CHAT}`);
        break;
      default:
        bot.sendMessage(msg.chat.id, 'Invalid membership tier.');
    }
  } else {
    bot.sendMessage(msg.chat.id, 'Authentication failed! Please check your card number.');
  }
});
