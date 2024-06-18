const mongodb = require('../../lib/mongodb');
const moment = require('moment-timezone');
moment.tz.setDefault('Europe/Kiev');
const { Markup } = require('telegraf');

module.exports = async function (ctx) {
    try {
        if (ctx.state.user) {
            if (ctx.state.user.allow_news) {
                await mongodb().collection('tg_users').updateOne({ tg_id: String(ctx.message.from.id) }, {
                    $set: {
                        allow_news: 0
                    }
                });
            }

            await ctx.reply(
                'Ви заборонили розсилку.\nЩоб дозволити - нажміть на кнопку знизу.',
                Markup.inlineKeyboard([
                    {
                        text: 'Дозволити розсилку',
                        callback_data: `allow_news`
                    }
                ])
            );
        } else {
            await ctx.reply('Помилка! Спробуйте пізніше!')
        }
    } catch (e) {
        console.error('Cannot send message to user', ctx.message.from.id);
        console.error(e)
        console.log(e.message);
        await ctx.reply('Помилка! Спробуйте пізніше!')
    }
}