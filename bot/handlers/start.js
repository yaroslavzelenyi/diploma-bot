const mongodb = require('../../lib/mongodb');
const config = require('../../cfg/config');
const { sendRequest } = require('../../lib/api');
const moment = require('moment-timezone');
moment.tz.setDefault('Europe/Kiev');

module.exports = async function (ctx) {
    console.log('!!! start !!!', ctx.match ? ctx.match[1] : '');
    try {
        const auth_string = ctx.match ? ctx.match[1] : undefined;

        if (ctx.state.user) {
            if (ctx.state.user.is_logged) {
                await ctx.reply('Ласкаво просимо! Раді бачити Вас знову!');
            } else if (!auth_string || !auth_string.length) {
                await ctx.reply('Ласкаво просимо!\nДля прив\'язки акаунту, перейдіть на сайт по посиланню!', {
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                url: config.baseUrl + '/?tgId=' + String(ctx.message.from.id),
                                text: 'ПЕРЕЙТИ'
                            }]
                        ]
                    }
                });
            } else {
                await registerUser(ctx, auth_string);
            }
        } else {
            if (!auth_string) {
                await mongodb().collection('tg_users').insertOne({
                    tg_id: String(ctx.message.from.id),
                    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                    is_logged: 0,
                    allow_news: 1
                });
                await ctx.reply('Ласкаво просимо!\nДля прив\'язки акаунту, перейдіть на сайт по посиланню!', {
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                url: config.baseUrl + '/?tgId=' + String(ctx.message.from.id),
                                text: 'ПЕРЕЙТИ'
                            }]
                        ]
                    }
                });
            } else {
                await registerUser(ctx, auth_string);
            }
        }
    } catch (e) {
        console.error('Cannot send message to user', ctx.message.from.id);
        console.error(e)
        console.log(e.message);
    }
}

async function registerUser (ctx, auth_string) {
    const token_record = await sendRequest('/telegram/login', 'POST', {
        token: auth_string,
        userInfo: "TG user with id " + ctx.message.from.id,
        telegramUser: ctx.message.from.id
    });

    if (!token_record) {
        await ctx.reply('Помилка прив\'язки акаунта! Спробуйте ще раз!');
        return;
    }
    
    await mongodb().collection('tg_users').updateOne({ tg_id: String(ctx.message.from.id) }, {
        $set: {
            user_id: token_record.id,
            is_logged: 1,
            allow_news: 1,
            first_name: token_record.firstName,
            last_name: token_record.lastName,
            is_admin: !!token_record.isAdmin,
        },
        $setOnInsert: {
            tg_id: String(ctx.message.from.id),
            created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        }
    }, { upsert: true });

    await ctx.reply(`Ласкаво просимо${token_record.firstName ? [',', token_record.firstName].join(' ') : ''}!`);
}