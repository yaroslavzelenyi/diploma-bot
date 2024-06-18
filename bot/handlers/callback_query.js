const mongodb = require("../../lib/mongodb");
const config = require("../../cfg/config");
const moment = require('moment-timezone');
moment.tz.setDefault(config.timezone);
const { Markup } = require('telegraf');

module.exports = async function (ctx) {
    try {
        const { update: { callback_query } } = ctx;
    
        switch (callback_query.data) {
            case 'dis_news': {
                if (ctx.state.user) {
                    await mongodb().collection('tg_users').updateOne({ tg_id: String(ctx.update.callback_query.from.id) }, {
                        $set: {
                            allow_news: 0
                        }
                    });

                    await ctx.editMessageText(
                        ctx.update.callback_query.message.text,
                        Markup.inlineKeyboard([
                            {
                                text: 'Дозволити розсилку',
                                callback_data: `allow_news`
                            }
                        ])
                    );
                }
                break;
            }

            case 'allow_news': {
                if (ctx.state.user) {
                    await mongodb().collection('tg_users').updateOne({ tg_id: String(ctx.update.callback_query.from.id) }, {
                        $set: {
                            allow_news: 1
                        }
                    });

                    await ctx.editMessageText(
                        ctx.update.callback_query.message.text,
                        Markup.inlineKeyboard([
                            {
                                text: 'Заборонити розсилку',
                                callback_data: `dis_news`
                            }
                        ])
                    );
                }
                break;
            }

            default: {
                console.log('!!! Unknown case', callback_query.data);
                break;
            }
        }
    } catch (e) {
        console.error('Cannot send message to user', ctx.update.callback_query.from.id);
        console.error(e)
        console.log(e.message);
    }
}
