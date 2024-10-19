const { Telegraf } = require('telegraf');
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Replace these with your actual values
const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'YOUR_REDIRECT_URI';
const API_KEY = 'YOUR_API_KEY';

const bot = new Telegraf(BOT_TOKEN);
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

// Middleware to handle user authentication
bot.start((ctx) => ctx.reply('Welcome! Please enter your membership card number.'));

bot.on('text', async (ctx) => {
    const membershipCardNumber = ctx.message.text;
    await authenticateUser(membershipCardNumber, ctx);
});

async function authenticateUser(cardNumber, ctx) {
    await doc.useApiKey(API_KEY);
    await doc.loadInfo(); // Loads the document properties and worksheets

    const sheet = doc.sheetsByIndex[0]; // Assuming the first sheet has your data
    const rows = await sheet.getRows();

    const user = rows.find(row => row.MembershipCardNumber === cardNumber); // Adjust the column name
    if (user) {
        const tier = user.MembershipTier; // Adjust the column name
        ctx.reply(`Welcome back! Your membership tier is: ${tier}`);
        navigateUser(tier, ctx);
    } else {
        ctx.reply('Authentication failed. Please check your membership card number.');
    }
}

function navigateUser(tier, ctx) {
    // Logic to navigate the user based on their tier
    if (tier === 'basic') {
        ctx.reply('You have access to the basic features.');
    } else if (tier === 'gold') {
        ctx.reply('You have access to gold features and the shopping branch.');
    } else if (tier === 'supreme') {
        ctx.reply('You have full access to all features and private chats.');
    } else {
        ctx.reply('Unknown membership tier.');
    }
}

bot.launch().then(() => {
    console.log('Bot is running...');
});
