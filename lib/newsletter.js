const config = require("../cfg/config");
const mongodb = require("./mongodb");
const api = require("./api");
const bot = require("../bot/lib/bot");
const Promise = require("bluebird");

module.exports = {
  getAndUpdate: getAndUpdate,
  sendMessage: sendMessage,
  sendMessageList: sendMessageList,
};

async function getAndUpdate() {
  console.log("--- START updates ---");
  const updates = await api.sendRequest("/update/new", "GET");
  if (!updates || !updates.length) {
    console.log("--- NO updates ---");
    return;
  }

  console.log("UPDATES", updates);

  const result = await Promise.map(updates, sendMessageByUpdate, {
    concurrency: 2,
  });

  await api.sendRequest("/update/seen", "PATCH", {
    confirmed: updates.map(update => update.id),
  });

  await mongodb().collection("tg_news_logs").insertMany(result);

  console.log("--- END updates ---");
}

async function sendMessageByUpdate(update) {
  const text = update.content;
  const tgId = update.connection.telegramUser;

  if (["all", "registered", "non-registered"].indexOf(tgId) !== -1) {
    return sendMessagesByList(update, tgId);
  }

  const user = await mongodb()
    .collection("tg_users")
    .findOne({
      allow_news: 1,
      tg_id: String(tgId),
      is_logged: 1,
    });

  if (!user) {
    return Promise.resolve({
      id: update.id,
      tg_id: String(tgId),
      status: false,
      message: "User disabled news",
    });
  }

  try {
    let url = config.baseUrl;
    if (update.url) {
      url = update.url;
    }
    await bot.telegram.sendMessage(tgId, text, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Перейти",
              url,
            },
          ],
        ],
      },
    });
  } catch (e) {
    console.log(e.message);
    console.log("Cannot send to user", tgId, "update", update.id);
    return Promise.resolve({
      id: update.id,
      tg_id: String(tgId),
      status: false,
      message: e.message,
    });
  }

  return Promise.resolve({
    id: update.id,
    tg_id: String(tgId),
    status: true,
    message: "OK",
  });
}

async function sendMessage(json, req, client) {
  const template = json.params.Template;
  if (!json.params.UserId || !template) {
    throw new Error("Wrong body");
  }

  const user = await mongodb()
    .collection("tg_users")
    .findOne({
      user_id: parseInt(json.params.UserId),
      tg_id: {
        $exists: true,
      },
    });
  if (!user) {
    throw new Error("No such user");
  }

  await sendMessageByTemplate(template, user);

  return Promise.resolve({
    status: true,
  });
}

async function sendMessageList(json, req, client) {
  const template = json.params.Template;
  if (
    ((!json.params.UserIds || !json.params.UserIds.length) &&
      !json.params.Type) ||
    !template
  ) {
    throw new Error("Wrong body");
  }

  switch (json.params.Type) {
    case "non-registered":
    case "registered":
    case "all": {
      await sendMessagesByList(template, json.params.Type);
      break;
    }
    default: {
      if (!json.params.UserIds) throw new Error("Wrong body");
      await sendMessagesByList(template, json.params.UserIds);
      break;
    }
  }

  return Promise.resolve({
    status: true,
  });
}

async function sendMessagesByList(template, list) {
  // if no list - sends to all
  console.log(
    `Sending template #${template.id}, userPerRequest: ${
      config.userPerRequest
    } ${list ? "by list:\n" + list : "to all"}`
  );
  let i = 0;
  while (true) {
    const db_req = {};
    if (typeof list === String) {
      switch (list) {
        case "non-registered": {
          db_req["is_logged"] = 0;
          db_req["allow_news"] = 1;
          break;
        }
        case "registered": {
          db_req["is_logged"] = 1;
          db_req["allow_news"] = 1;
          break;
        }
        default: {
          db_req["allow_news"] = 1;
          break;
        }
      }
    } else if (list) {
      db_req.user_id = {
        $in: list,
      };
    }
    const users = await mongodb()
      .collection("tg_users")
      .find(db_req)
      .sort({ created_at: -1 })
      .limit(config.userPerRequest)
      .skip(config.userPerRequest * i)
      .toArray();
    if (!users.length) break;
    await Promise.map(users, user => sendMessageByTemplate(template, user), {
      concurrency: 30,
    });
    i += 1;
    await new Promise(r => setTimeout(r, 200));
    if (!(i % 10)) {
      console.log(`Proccessed ${i * config.userPerRequest} users`);
    }
  }
}

async function sendMessageByTemplate(template, user, params) {
  try {
    const markup = {};
    if (template.inline_buttons && template.inline_buttons.length) {
      markup.reply_markup = {
        inline_keyboard: template.inline_buttons.map(button => [
          {
            text: button.text,
            url:
              button.type === "external"
                ? button.url
                : config.baseUrl + button.url,
          },
        ]),
      };
    }

    let text;

    text = template.content;

    if (template.img || template.gif || template.vid) {
      markup.caption = content;
    }

    if (!markup.caption) {
      await bot.telegram.sendMessage(user.tg_id, text, markup);
    } else {
      if (template.img) {
        await bot.telegram.sendPhoto(
          user.tg_id,
          { source: template.img },
          markup
        );
      } else if (template.gif) {
        await bot.telegram.sendAnimation(
          user.tg_id,
          { source: template.gif },
          markup
        );
      } else if (template.vid) {
        await bot.telegram.sendVideo(user.tg_id, template.vid, markup);
      }
    }
  } catch (e) {
    console.log(e.message);
    console.log("Cannot send to user", user.user_id);
  }
}

function isString(value) {
  return typeof value === "string" || value instanceof String;
}
