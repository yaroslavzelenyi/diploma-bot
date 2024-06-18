const auth = require("./middlewares/auth");
const start = require("../handlers/start");
const stop = require("../handlers/stop");
const logout = require("../handlers/logout");
const callback_query = require("../handlers/callback_query");


module.exports = function (bot) {
    bot.hears(/^\/start[ =](.+)$/, auth.optional, start);
    bot.command('start', auth.optional, start);
    bot.command('stop', auth.optional, stop);
    bot.command('logout', auth.required, logout);
    bot.on('callback_query', auth.optional, callback_query);

    return bot;
}