const throttler = require("../helpers/throttler.js");
const config = require("../../../cfg/config.js");
const mongodb = require("../../../lib/mongodb.js");

const throttle = throttler(config.throttle);

module.exports = {
    optional,
    required
}

async function optional (ctx, next) {
    const tgId = ctx.message ? ctx.message.from.id : ctx.update.callback_query.from.id;
    const allowReply = throttle(tgId);
    if (allowReply) {
        const user = await getUser(tgId);
        if (user) {
            ctx.state.user = user;
        }
        await next();
    }
};

async function required (ctx, next) {
    const tgId = ctx.message ? ctx.message.from.id : ctx.update.callback_query.from.id;
    const allowReply = throttle(tgId);
    if (allowReply) {
        const user = await getUser(tgId);
        if (user && user.is_logged) {
            ctx.state.user = user;
            await next();
        } else {
            await ctx.reply('Для цього треба бути зареєстрованим!');
        }
    }
};

async function getUser (tgId) {
    const tg_user = await mongodb().collection('tg_users').findOne({
        tg_id: String(tgId)
    })
    if (!tg_user) {
        return false;
    }
    return tg_user;
};