const config = require('../../cfg/config')
const { Telegraf } = require('telegraf');
const router = require('./router');

let bot = new Telegraf(config.token);
bot = router(bot);
module.exports = bot;