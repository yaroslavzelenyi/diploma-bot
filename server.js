const bot = require("./bot/lib/bot");
const { getAndUpdate } = require("./lib/newsletter");

process.title = "bot.master " + process.pid;

(async () => {
  bot.botInfo = await bot.telegram.getMe();
  console.log("---- BOT ----");

  setInterval(getAndUpdate, 30 * 1000);
  console.log("Started proccess UPDATES");

  bot.launch();
  console.log("#### BOT STARTED\n");
})();
