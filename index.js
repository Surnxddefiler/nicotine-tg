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
    if (text === '/start' && (msg.from.id === 951800184 || msg.from.id === 862045681 || msg.from.id === 5078137410 )) {
        await bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name} ! 👋`, {
            reply_markup: {
                keyboard: [
                    [{ text: 'Оформить заказ', web_app: { url: 'https://marvelous-kheer-25e032.netlify.app' } }],
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
                    [{ text: 'Оформить заказ', web_app: { url: 'https://marvelous-kheer-25e032.netlify.app' } }],
                ],
                resize_keyboard: true
            }
        })
    }
    if (msg.web_app_data) {
        try {
            const data = JSON.parse(msg.web_app_data.data)
            console.log(data.novaPoshta)
            await bot.sendMessage(chatId, `Заказ успешно оформлен, курьер - @ravenonstop в скором времени с вами свяжется ✅ \n \nВаш заказ : \n${data.novaPoshta ? '' :data.val.time} \n${!data.novaPoshta ? data.place : `Доставка новой почтой: \n${data.val.town} \n${data.val.ompartment}`}  ${data.cart.map((el, i) => {
                return `\n${el.mark} ${el.name} ${el.nicotine} `
                })}`)
         
            await bot.sendMessage(-623730102, `\n${data.val.time} \n${'0'+data.val.phone} \n${data.place} \n${msg.from.username ? `@${msg.from.username}` :`-`} ${data.cart.map((el, i) => {
            return `\n${el.mark} ${el.name} ${el.nicotine} `
            })}`)
        }
        catch {

        }
    }
})