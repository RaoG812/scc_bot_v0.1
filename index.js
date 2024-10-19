const { Telegraf } = require('telegraf');
const { google } = require('googleapis');
const sheets = google.sheets('v4');

// Environment variables
const botToken = process.env.BOT_TOKEN;
const spreadsheetId = process.env.SHEET_ID;
const serviceAccountEmail = process.env.SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

// Google Sheets auth
const auth = new google.auth.JWT(
  serviceAccountEmail,
  null,
  privateKey,
  ['https://www.googleapis.com/auth/spreadsheets']
);

// Initialize Telegram bot
const bot = new Telegraf(botToken);

// Function to get membership data from Google Sheets
async function getMembershipData(cardNumber) {
  const request = {
    spreadsheetId,
    range: 'Sheet1!A:C',  // Adjust the range to where your data is
    auth,
  };
  
  const response = await sheets.spreadsheets.values.get(request);
  const rows = response.data.values;
  
  if (rows.length) {
    for (let row of rows) {
      if (row[0] === cardNumber) {  // Assuming card number is in the first column
        return { cardNumber: row[0], tier: row[1] }; // Tier is in the second column
      }
    }
  }
  return null;
}

// Bot command: /start
bot.start((ctx) => ctx.reply('Welcome! Please enter your membership card number.'));

// Handle membership validation
bot.on('text', async (ctx) => {
  const cardNumber = ctx.message.text;
  
  const member = await getMembershipData(cardNumber);
  
  if (member) {
    ctx.reply(`Welcome ${member.tier} member!`);
    // Add logic to navigate the user based on their membership tier
  } else {
    ctx.reply('Invalid membership card number.');
  }
});

bot.launch();
