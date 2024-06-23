const mongodb = require("../../lib/mongodb");
const config = require("../../cfg/config");
const moment = require('moment-timezone');
moment.tz.setDefault(config.timezone);
const { Markup } = require('telegraf');
const keyboard = require("../lib/helpers/keyboard");
const api = require("../../lib/api");

module.exports = async function (ctx) {
    try {
        const { update: { callback_query } } = ctx;
        const callback_data = callback_query.data.split(`//`);

        switch (callback_data[0]) {
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

            case 'add_activity': {
                if (!callback_data[1] || isNaN(parseInt(callback_data[1]))) {
                    return;
                }
                const activity = parseInt(callback_data[1]);
                const prev_activities = ctx.state.user.activities || [];
                if (prev_activities.indexOf(activity) === -1) {
                    prev_activities.push(activity);
                    await mongodb().collection('tg_users').updateOne({ tg_id: String(ctx.update.callback_query.from.id) }, {
                        $set: {
                            activities: prev_activities
                        }
                    });
                }
                const new_keyboard = await keyboard.getActivitiesKeyboard(prev_activities);
                new_keyboard.push([{
                    text: '⛔️ Закінчити вибір ⛔️',
                    callback_data: 'end_activity'
                }]);
                await ctx.editMessageText(
                    ctx.update.callback_query.message.text,
                    {
                        reply_markup: {
                            inline_keyboard: new_keyboard
                        }
                    }
                );
                break;
            }
            
            case 'end_activity': {
                const tg_id = String(ctx.update.callback_query.from.id);
                if (ctx.state.user.is_logged) {
                    return;
                }

                const result = await api.sendRequest('/telegram/create-account', 'POST', {
                    name: ctx.update.callback_query.from.first_name || 'TG користувач',
                    region: 'Чернігівська область',
                    activities: ctx.state.user.activities,
                    userInfo: 'TG user with id ' + tg_id,
                    telegramUser: tg_id
                });
                if (!result || !!result.error) {
                    console.error(`Error creating account!`, result);
                    return;
                }

                const data = await await api.sendRequest('/telegram/generate-register-link', 'POST', {
                    telegramUser: tg_id
                });
                const is_url = !!data && !!data.url;
                if (!is_url) {
                    console.error(`Error getting url!`, data);
                }

                const url  = !is_url ? config.baseUrl : data.url;

                await ctx.editMessageText(
                    `Ви успішно підписалися на новини!`,
                    Markup.inlineKeyboard([
                        {
                            text: is_url ? 'Закінчити реєстрацію' : 'На сайт',
                            url: url
                        }
                    ])
                );

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
