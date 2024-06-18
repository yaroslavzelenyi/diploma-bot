const mongodb = require('../../lib/mongodb');
const config = require('../../cfg/config');
const moment = require('moment-timezone');
moment.tz.setDefault('Europe/Kiev');
const { Markup } = require('telegraf');

module.exports = async function (ctx) {
    try {
        if (ctx.state.user.is_logged) {
            await mongodb().collection('tg_users').updateOne({ tg_id: String(ctx.message.from.id) }, {
                $set: {
                    is_logged: 0
                }
            });
        }

        await ctx.reply(
            'Ви вийшли з аккаунту.\nЩоб прив\'язати знову - перейдіть по посиланню на сайті.',
            Markup.inlineKeyboard([
                {
                    text: 'НА САЙТ',
                    url: config.baseUrl
                }
            ])
        );
    } catch (e) {
        console.error('Cannot send message to user', ctx.message.from.id);
        console.error(e)
        console.log(e.message);
        await ctx.reply('Помилка! Спробуйте пізніше!')
    }
}