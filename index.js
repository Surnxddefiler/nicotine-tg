const TelegramBot = require("node-telegram-bot-api");

const token = "6110612220:AAHIuT4MPFWyahCy8FOcTRrHx0USSUAvS4I";

const bot = new TelegramBot(token, { polling: true });

const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://Nick:httpstmenicotineproduct@nicotine.qavv7uy.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
let isClientConnected = false;

const connectToMongoDB = async () => {
  if (!isClientConnected) {
    await client.connect();
    isClientConnected = true;
    console.log("Подключение к MongoDB установлено.");
  }
};

//get users from db
const getUser = async () => {
  await connectToMongoDB();
  const dbName = "test";
  const collectionName = "Users";
  const database = client.db(dbName);
  const collection = database.collection(collectionName);
  const documents = await collection.find({}).toArray();
  return documents;
};

//save user code
const saveUser = async (chatId, username) => {
  try {
    await connectToMongoDB();
    const dbName = "test";
    const collectionName = "Users";
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const existingUser = await collection.findOne({ chatId });
    if (!existingUser) {
      await collection.insertOne({ chatId, username });
      console.log(
        `Новый пользователь с chatId ${chatId} добавлен в базу данных.`
      );
    } else {
      console.log(
        `Пользователь с chatId ${chatId} уже существует в базе данных.`
      );
    }
  } catch (error) {
    console.error("Ошибка при сохранении пользователя:", error);
  }
};

process.on("SIGINT", async () => {
  if (isClientConnected) {
    await client.close();
    console.log("Соединение с MongoDB закрыто.");
    process.exit(0);
  }
});

bot.on("message", async (msg) => {
  if (msg && msg.error && msg.error.code === 403) {
    console.log("Пользователь заблокировал бота");
    return; // Прекращаем обработку сообщения
  }

  if (msg.chat.type !== "private") {
    return;
  }

  const chatId = msg.chat.id;
  const username = msg.chat.username;
  const text = msg.text;
  if (
    text === "/start" &&
    (msg.from.id === 951800184 ||
      msg.from.id === 862045681 ||
      msg.from.id === 5078137410)
  ) {
    await bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name} ! 👋`, {
      reply_markup: {
        keyboard: [
          [
            {
              text: "Оформить заказ",
              web_app: { url: "https://marvelous-kheer-25e032.netlify.app" },
            },
          ],
          [
            {
              text: "Админ",
              web_app: {
                url: "https://marvelous-kheer-25e032.netlify.app" + "/admin",
              },
            },
          ],
        ],
        resize_keyboard: true,
      },
    });
    await saveUser(chatId, username);
  } else if (text === "/start") {
    await bot.sendMessage(chatId, `Приветствую, ${msg.from.first_name} ! 👋`, {
      reply_markup: {
        keyboard: [
          [
            {
              text: "Оформить заказ",
              web_app: { url: "https://marvelous-kheer-25e032.netlify.app" },
            },
          ],
        ],
        resize_keyboard: true,
      },
    });
    await saveUser(chatId, username);
  }
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      console.log(data);
      await bot.sendMessage(
        chatId,
        `Заказ успешно оформлен, саппорт - @nicotineproductsupport  в скором времени с вами свяжется ✅ \n\nАктуальный канал - https://t.me/reservenpnp 📖 \n\nВаш заказ :\n${
          data.val.phone
        } ${data.novaPoshta ? "" : `\n${data.val.time}`} \n${
          !data.novaPoshta
            ? data.place
            : `Доставка новой почтой \n${data.val.name} \n${data.val.town} \n${data.val.compartment}`
        }  ${data.cart.map((el, i) => {
          if (el.isPod === "МНОГОРАЗКИ") {
            return `\n${el.name} `;
          } else if (el.isPod === "КАРТРИДЖИ") {
            return `\n${el.name} ${el.nicotine} `;
          } else {
            return `\n${el.mark} ${el.name} ${el.nicotine} `;
          }
        })}
        \nСумма : ${data.pay} ₴ ${
          data.deliv || data.novaPoshta ? "+ доставка" : ""
        }
        `,
        { disable_web_page_preview: true }
      );

      await bot.sendMessage(
        -623730102,
        `\n${data.novaPoshta ? "Новая Почта" : data.val.time} \n${
          data.val.phone
        } \n${
          data.novaPoshta
            ? `${data.val.name} \n${data.val.town} ${data.val.compartment}`
            : data.place
        } \n${
          msg.from.username ? `@${msg.from.username}` : `-`
        } ${data.cart.map((el, i) => {
          if (el.isPod === "МНОГОРАЗКИ") {
            return `\n${el.name} `;
          } else if (el.isPod === "КАРТРИДЖИ") {
            return `\n${el.name} ${el.nicotine} `;
          } else {
            return `\n${el.mark} ${el.name} ${el.nicotine} `;
          }
        })}
        \nСумма : ${data.pay} ₴ ${
          data.deliv || data.novaPoshta ? "+ доставка" : ""
        }
        `
      );
      await saveUser(chatId, username);
    } catch {}
  }
});

//message to all code
bot.onText(/\/broadcast((.|\n)+)/, async (msg, match) => {
  if (
    msg.from.id === 951800184 ||
    msg.from.id === 862045681 ||
    msg.from.id === 5078137410
  ) {
    const users = await getUser();
    const message = match[1];
    users.forEach((user) => {
      let chatId = user.chatId;
      bot.sendMessage(chatId, message).catch((err) => {
        console.error(`Ошибка отправки сообщения для ${chatId}:`, err);
      });
    });

    bot.sendMessage(msg.chat.id, "Сообщение отправлено всем пользователям.");
  }
});
