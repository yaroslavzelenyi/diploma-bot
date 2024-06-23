const mongodb = require("../../lib/mongodb");
const api = require("../../lib/api");
const config = require("../../cfg/config");
const moment = require("moment-timezone");
moment.tz.setDefault("Europe/Kiev");
const { Markup } = require("telegraf");

module.exports = async function (ctx) {
  try {
    const result = await api.sendRequest("/telegram/logout", "POST", {
      telegramUser: String(ctx.message.from.id),
    });
    if (!result || result.error) {
      await ctx.reply("Помилка! Спробуйте ще раз пізніше!");
      return;
    }

    await mongodb()
      .collection("tg_users")
      .updateOne(
        { tg_id: String(ctx.message.from.id) },
        {
          $set: {
            is_logged: 0,
            user_id: null,
          },
        }
      );

    await ctx.reply(
      "Ви вийшли з аккаунту.\nЩоб прив'язати знову - перейдіть по посиланню на сайті.",
      Markup.inlineKeyboard([
        {
          text: "НА САЙТ",
          url: config.baseUrl,
        },
      ])
    );
  } catch (e) {
    console.error("Cannot send message to user", ctx.message.from.id);
    console.error(e);
    console.log(e.message);
    await ctx.reply("Помилка! Спробуйте пізніше!");
  }
};
