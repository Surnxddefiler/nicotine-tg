require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB);
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
const saveUser = async (chatId, username, data) => {
  try {
    await connectToMongoDB();
    const dbName = "test";
    const collectionName = "Users";
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const existingUser = await collection.findOne({ chatId });
    if (!existingUser) {
      if (data) {
        await collection.insertOne({
          chatId,
          username,
          orders: [data],
        });
      } else {
        await collection.insertOne({
          chatId,
          username,
        });
      }
      console.log(
        `Новый пользователь с chatId ${chatId} добавлен в базу данных.`
      );
    } else {
      if (data) {
        const updatedOrders = existingUser.orders || [];
        updatedOrders.unshift(data); // Добавляем заказ в начало
        if (updatedOrders.length > 5) {
          updatedOrders.pop(); // Удаляем самый старый заказ (в конце массива)
        }
        await collection.updateOne(
          { chatId },
          { $set: { orders: updatedOrders } }
        );
      }
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
  const text = msg.text || msg.caption || "";
  if (
    (text === "/start" &&
      (msg.from.id === 951800184 ||
        msg.from.id === 862045681 ||
        msg.from.id === 5078137410)) ||
    (text === "Назад" &&
      (msg.from.id === 951800184 ||
        msg.from.id === 862045681 ||
        msg.from.id === 5078137410))
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
          [
            {
              text: "Повторить заказ ранее",
            },
          ],
        ],
        resize_keyboard: true,
      },
    });
    await saveUser(chatId, username, false);
  } else if (text === "/start" || text === "Назад") {
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
              text: "Повторить заказ ранее",
            },
          ],
        ],
        resize_keyboard: true,
      },
    });
    await saveUser(chatId, username, false);
  } else if (text === "Повторить заказ ранее") {
    await connectToMongoDB();
    const db = client.db("test");
    const users = db.collection("Users");

    const user = await users.findOne({ chatId });

    if (!user || !user.orders || user.orders.length === 0) {
      return bot.sendMessage(chatId, "История заказов пока отсутсвует");
    }
    let orderMessage = "";
    let urls = [];
    const icons = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
    let index = 0;
    for (const order of user.orders) {
      //формируем сообщение
      orderMessage += `\n${icons[index]}\n ${order.val.phone} ${
        order.novaPoshta ? "" : `\n${order.val.time}`
      } \n${
        !order.novaPoshta
          ? `${order.place} \n${
              order.val.poltavapayment === "Наличные"
                ? `${order.val.poltavapayment} ${
                    order.val.cashAmount ? order.val.cashAmount : ""
                  } ₴`
                : `Карта`
            }`
          : `Доставка новой почтой \n${order.val.name} \n${order.val.town} \n${order.val.compartment} \n${order.val.payment}`
      }  ${order.cart.map((el, i) => {
        if (el.isPod === "МНОГОРАЗКИ") {
          return `\n${el.name} `;
        } else if (el.isPod === "КАРТРИДЖИ") {
          return `\n${el.name} ${el.nicotine} `;
        } else {
          return `\n${el.mark} ${el.name} ${el.nicotine} `;
        }
      })}
      \nСумма : ${order.pay} ₴ ${
        order.deliv || order.novaPoshta ? "+ доставка" : ""
      } \n`;

      //формируем юрл
      const orderData = JSON.stringify(order);
      const encodedOrder = encodeURIComponent(orderData);
      const formUrl = `https://marvelous-kheer-25e032.netlify.app?order=${encodedOrder}`;
      urls.push([
        {
          text: `Повторить заказ ${icons[index]}`,
          web_app: { url: formUrl },
        },
      ]);
      index++;
    }
    urls.push([
      {
        text: `Назад`,
      },
    ]);
    await bot.sendMessage(chatId, orderMessage, {
      reply_markup: {
        resize_keyboard: true,
        keyboard: urls,
      },
    });
  }
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      console.log(data);

      let keyboard = [
        [
          {
            text: "Оформить заказ",
            web_app: {
              url: "https://marvelous-kheer-25e032.netlify.app",
            },
          },
        ],
        [
          {
            text: "Повторить заказ ранее",
          },
        ],
      ];

      // Добавим ещё одну кнопку, если chatId совпадает
      if (
        msg.from.id === 951800184 ||
        msg.from.id === 862045681 ||
        msg.from.id === 5078137410
      ) {
        keyboard.push([
          {
            text: "Админ",
            web_app: {
              url: "https://marvelous-kheer-25e032.netlify.app" + "/admin",
            },
          },
        ]);
      }

      await bot.sendMessage(
        chatId,
        `Заказ успешно оформлен, связаться с курьером - @nicotineproductsupport 🚚 \n\nАктуальный канал - https://t.me/reservenpnp 📖\nТекстовый ассортимент - https://t.me/assortmentnp 📖 \n\nВаш заказ :\n${
          data.val.phone
        } ${data.novaPoshta ? "" : `\n${data.val.time}`} \n${
          !data.novaPoshta
            ? `${data.place} \n${
                data.val.poltavapayment === "Наличные"
                  ? `${data.val.poltavapayment} ${
                      data.val.cashAmount ? data.val.cashAmount : ""
                    } ₴`
                  : `Карта`
              }`
            : `Доставка новой почтой \n${data.val.name} \n${data.val.town} \n${data.val.compartment} \n${data.val.payment}`
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
          (data.deliv && !data.freeDelivery) ||
          (data.novaPoshta && !data.freeDelivery)
            ? "+ доставка"
            : ""
        } ${
          data.deliv || data.novaPoshta
            ? `\n${
                data.freeDelivery &&
                ((data.novaPoshta && data.np) || !data.novaPoshta)
                  ? "Бесплатная доставка включена 🚚🎁"
                  : ""
              }`
            : ""
        }
        `,
        {
          disable_web_page_preview: true,
          reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true,
          },
        }
      );

      await bot.sendMessage(
        -623730102,
        `\n${data.novaPoshta ? `Новая Почта` : `${data.val.time}`} \n${
          data.val.phone
        } \n${
          data.novaPoshta
            ? `${data.val.name} \n${data.val.town} ${data.val.compartment} ${data.val.payment}`
            : `${data.place} \n${
                data.val.poltavapayment === "Наличные"
                  ? `${data.val.poltavapayment} ${
                      data.val.cashAmount ? `${data.val.cashAmount} ₴` : ""
                    }`
                  : `Карта`
              }`
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
          (data.deliv && !data.freeDelivery) ||
          (data.novaPoshta && !data.freeDelivery)
            ? "+ доставка"
            : ""
        } ${
          data.deliv || data.novaPoshta
            ? `\n${
                data.freeDelivery &&
                ((data.novaPoshta && data.np) || !data.novaPoshta)
                  ? "Бесплатная доставка включена 🚚🎁"
                  : ""
              }`
            : ""
        }
        
        `
      );
      await saveUser(chatId, username, data);
    } catch {}
  }

  if (!text.startsWith("/broadcast")) return;

  if (
    msg.from.id === 951800184 ||
    msg.from.id === 862045681 ||
    msg.from.id === 5078137410
  ) {
    console.log("broadcast команда обнаружена");

    const users = await getUser();
    const caption = text.replace("/broadcast", "").trim();
    const photo = msg.photo?.[msg.photo.length - 1];
    const video = msg.video;

    let successCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        if (video) {
          await bot.sendVideo(user.chatId, video.file_id, {
            caption,
          });
        } else if (photo) {
          await bot.sendPhoto(user.chatId, photo.file_id, {
            caption,
          });
        } else {
          await bot.sendMessage(user.chatId, caption);
        }
        successCount++;
      } catch (err) {
        console.error(`Ошибка отправки для ${user.chatId}:`, err.message);
        failedCount++;
      }
    }

    bot.sendMessage(
      msg.chat.id,
      `Рассылка завершена.\n✅ Успешно: ${successCount}\n❌ Ошибки: ${failedCount}`
    );
  }
});

//message to all code
// bot.onText(/\/broadcast([\s\S]*)/, async (msg, match) => {
//   console.log("rabotaet");
//   if (
//     msg.from.id === 951800184 ||
//     msg.from.id === 862045681 ||
//     msg.from.id === 5078137410
//   ) {
//     const users = await getUser();

//     const caption = (match?.[1]?.trim() || msg.caption || "").trim();
//     const photo = msg.photo?.[msg.photo.length - 1];
//     const video = msg.video;
//     console.log("srabotal");
//     let successCount = 0;
//     let failedCount = 0;

//     for (const user of users) {
//       try {
//         if (video) {
//           await bot.sendVideo(user.chatId, video.file_id, {
//             caption,
//           });
//         } else if (photo) {
//           await bot.sendPhoto(user.chatId, photo.file_id, {
//             caption,
//           });
//         } else {
//           await bot.sendMessage(user.chatId, caption);
//         }

//         successCount++;
//       } catch (err) {
//         console.error(`Ошибка отправки для ${user.chatId}:`, err.message);
//         failedCount++;
//       }
//     }

//     bot.sendMessage(
//       msg.chat.id,
//       `Рассылка завершена.\n✅ Успешно: ${successCount}\n❌ Ошибки: ${failedCount}`
//     );
//   }
// });
