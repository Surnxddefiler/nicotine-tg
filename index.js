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
        await bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name} ! 👋`, {
            reply_markup: {
                keyboard: [
                    [{ text: 'Оформить заказ', web_app: { url: 'https://www.youtube.com/' } }],
                    [{ text: 'Админ', web_app: { url: 'https://marvelous-kheer-25e032.netlify.app'+'/admin' } }]
                ],
                resize_keyboard: true
            }
        })
    }
    else if (text=== '/start') {
        await bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name} ! 👋`, {
            reply_markup: {
                keyboard: [
                    //https://marvelous-kheer-25e032.netlify.app
                    [{ text: 'Оформить заказ', web_app: { url: 'https://www.youtube.com/' } }],
                ],
                resize_keyboard: true
            }
        })
    }
    if (msg.web_app_data) {
        try {
            const data = JSON.parse(msg.web_app_data.data)
            await bot.sendMessage(chatId, `Заказ успешно оформлен, курьер - @ravenonstop в скором времени с вами свяжется ✅ \n \nВаш заказ : \n${data.val.time} \n${data.place}  ${data.cart.map((el, i) => {
                return `\n${el.mark} ${el.name} ${el.nicotine} `
                })}`)
            console.log(data)
            await bot.sendMessage(-623730102, `\n${data.val.time} \n${data.val.phone} \n${data.place} \n${msg.from.username ? `@${msg.from.username}` :`-`} ${data.cart.map((el, i) => {
            return `\n${el.mark} ${el.name} ${el.nicotine} `
            })}`)
        }
        catch {

        }
    }
})