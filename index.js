const TelegramBot = require('node-telegram-bot-api');

const token = '6110612220:AAHIuT4MPFWyahCy8FOcTRrHx0USSUAvS4I'

const bot = new TelegramBot(token, { polling: true });


bot.on('message', async (msg) => {

    if (msg && msg.error && msg.error.code === 403) {
        console.log('Пользователь заблокировал бота');
        return; // Прекращаем обработку сообщения
    }

    const chatId = msg.chat.id
    const text = msg.text
    if (text === '/start' && (msg.from.id === 951800184 || msg.from.id === 862045681)) {
        await bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name}! 👋`, {
            reply_markup: {
                keyboard: [
                    [{ text: 'Оформить заказ', web_app: { url: 'https://marvelous-kheer-25e032.netlify.app' } }],
                    [{ text: 'админ', web_app: { url: 'https://marvelous-kheer-25e032.netlify.app'+'/admin' } }]
                ],
                resize_keyboard: true
            }
        })
    }
    else if (text=== '/start') {
        await bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name} ! 👋`, {
            reply_markup: {
                keyboard: [
                    [{ text: 'Оформить заказ', web_app: { url: 'https://marvelous-kheer-25e032.netlify.app' } }],
                ],
                resize_keyboard: true
            }
        })
    }
    if (msg.web_app_data) {
        try {
            const data = JSON.parse(msg.web_app_data.data)
            await bot.sendMessage(chatId, 'Заказ успешно оформлен, курьер - @ravenonstop в скором времени с вами свяжется ✅')
            console.log(data)
            await bot.sendMessage(-623730102, `время: ${data.val.time}, номер: ${data.val.phone} place: ${data.place}, ник: ${msg.from.username ? `@${msg.from.username}` :`-`} ${data.cart.map((el, i) => {
            return `\n ${i+1}: марка: ${el.mark}, имя: ${el.name}, описание: ${el.nicotine} `
            })}`)
        }
        catch {

        }
    }
})