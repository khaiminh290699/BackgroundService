const { DB, ModelWeb, ModelForum } = require("../db");
const { WebTreTho, LamChaMe } = require("../pages");

async function syncForums(data, channel, message) {
  return;
  const webtretho = new WebTreTho();
  const lamchame = new LamChaMe();

  const db = new DB();
  const modelWeb = new ModelWeb(db);
  const modelForum = new ModelForum(db);

  await modelForum.query().update({ is_deleted: true }); 

  const { id: webtretho_id } = await modelWeb.findOne({ web_key: webtretho.key });
  await modelForum.query().insert((await webtretho.getForums()).map(forum => ({ ...forum, web_id: webtretho_id, is_deleted: false }))).onConflict(["web_id", "forum_name"]).merge();

  const { id: lamchame_id } = await modelWeb.findOne({ web_key: lamchame.key });
  await modelForum.query().insert((await lamchame.getForums()).map(forum => ({ ...forum, web_id: lamchame_id, is_deleted: false }))).onConflict(["web_id", "forum_name"]).merge();
  
  await db.DB.destroy();
  await channel.ack(message);
}
module.exports = syncForums;