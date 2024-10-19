import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(405).send('Method Not Allowed');
    }
}
