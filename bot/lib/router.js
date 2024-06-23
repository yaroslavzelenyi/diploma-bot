const auth = require("./middlewares/auth");
const start = require("../handlers/start");
const stop = require("../handlers/stop");
const logout = require("../handlers/logout");
const show_events = require("../handlers/show_events");
const callback_query = require("../handlers/callback_query");

module.exports = function (bot) {
  bot.hears(/^\/start[ =](.+)$/, auth.optional, start);
  bot.command("start", auth.optional, start);
  bot.command("stop", auth.optional, stop);
  bot.command("logout", auth.required, logout);
  bot.command("show_events", auth.required, show_events);
  bot.on("callback_query", auth.optional, callback_query);

  return bot;
};
