const mongodb = require("../../lib/mongodb");
const config = require("../../cfg/config");
const { sendRequest } = require("../../lib/api");
const moment = require("moment-timezone");
moment.tz.setDefault("Europe/Kiev");

module.exports = async function (ctx) {
  try {
    const user_events = await sendRequest(
      "/event/telegram-participate/0",
      "POST",
      {
        telegramId: String(ctx.message.from.id),
      }
    );
    if (!user_events || !user_events.length) {
      await ctx.reply("Ви не приймаєте участь в подіях.");
      return;
    }
    let reply_message = ``;
    user_events.map(event => {
      reply_message += `- ${event.name} (м. ${event.location}) - ${event.status} (${event.participantsCount} учасників)\n`;
    });
    await ctx.reply(reply_message);
  } catch (e) {
    console.error("Cannot send message to user", ctx.message.from.id);
    console.error(e);
    console.log(e.message);
  }
};
