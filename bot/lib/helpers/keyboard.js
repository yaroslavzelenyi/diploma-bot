const api = require("../../../lib/api");

module.exports = {
  getActivitiesKeyboard: getActivitiesKeyboard,
};

async function getActivitiesKeyboard(previous_activities = []) {
  const list = await api.sendRequest("/activity-category", "GET");
  if (!list || !list.length) {
    return [];
  }
  const result = [];
  let temporary_line = [];

  for (const activ of list) {
    if (previous_activities.indexOf(activ.id) === -1) {
      if (list.length > 4) {
        if (temporary_line.length > 1) {
          result.push(temporary_line);
          temporary_line = [
            {
              text: activ.name,
              callback_data: `add_activity//${activ.id}`,
            },
          ];
        } else {
          temporary_line.push({
            text: activ.name,
            callback_data: `add_activity//${activ.id}`,
          });
        }
      } else {
        result.push([
          {
            text: activ.name,
            callback_data: `add_activity//${activ.id}`,
          },
        ]);
      }
    }
  }
  if (temporary_line.length) {
    result.push(temporary_line);
  }

  return result;
}
