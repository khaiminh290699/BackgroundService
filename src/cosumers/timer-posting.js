const { DB, SettingModel } = require("../db");
const { WebTreTho, LamChaMe } = require("../pages");
const { Socket } = require("../ultilities");

async function timerPosting(data, channel, message) {
  const { timer_at } = data;

  const db = new DB();
  const settingModel = new SettingModel(db);

  const webtretho = new WebTreTho();
  const lamchame = new LamChaMe();

  const posts = await settingModel.query()
    .select(
      settingModel.DB.raw(`
        posts.id AS post_id,
        posts.title,
        posts.content,
        accounts.id AS account_id,
        accounts.username,
        accounts.password,
        webs.web_key,
        forums.id AS forum_id,
        forums.forum_url,
        settings.id AS setting_id
      `)
    )
    .joinRaw(`
      JOIN timer_setting ON ( timer_setting.setting_id = settings.id )
      JOIN posts ON ( posts.id = settings.post_id )
      JOIN accounts ON ( accounts.id = settings.account_id )
      JOIN post_forum ON ( post_forum.post_id = posts.id )
      JOIN forums ON ( forums.id = post_forum.forum_id )
      JOIN webs ON ( webs.id = accounts.web_id AND webs.id = forums.web_id )
    `)
    .whereRaw(`
      accounts.disable = false
      AND posts.is_deleted = false
      AND timer_setting.from_date <= NOW()::DATE AND timer_setting.to_date >= NOW()::DATE
      AND timer_setting.timer_at = :timer_at
    `, { timer_at })
    .orderByRaw(`
      webs.id,
      accounts.id
    `)  

  if (!posts.length) {
    return await channel.ack(message); 
  }

  const socket = await new Socket().connect("users", "token");
  await lamchame.post(posts.filter((post) => post.web_key === lamchame.key), null, db, socket);
  await webtretho.post(posts.filter((post) => post.web_key === webtretho.key), null, db, socket);

  await channel.ack(message); 
}

module.exports = timerPosting;