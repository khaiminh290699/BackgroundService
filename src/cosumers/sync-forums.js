const { DB, ModelWeb, ModelForum } = require("../db");
const { WebTreTho, LamChaMe, ChaMeNuoiCon } = require("../pages");

async function syncForums(data, channel, message) {
  const webtretho = new WebTreTho();
  const lamchame = new LamChaMe();
  const chamenuoicon = new ChaMeNuoiCon();

  const db = new DB();
  const modelWeb = new ModelWeb(db);
  const modelForum = new ModelForum(db);

  await modelForum.query().update({ is_deleted: true }); 

  const { id: chamenuoicon_id } = await modelWeb.findOne({ web_key: chamenuoicon.key });
  await modelForum.query().insert((await chamenuoicon.syncForums()).map(forum => ({ ...forum, web_id: chamenuoicon_id, is_deleted: false }))).onConflict(["web_id", "forum_name"]).merge();

  const { id: webtretho_id } = await modelWeb.findOne({ web_key: webtretho.key });
  await modelForum.query().insert((await webtretho.syncForums()).map(forum => ({ ...forum, web_id: webtretho_id, is_deleted: false }))).onConflict(["web_id", "forum_name"]).merge();

  const { id: lamchame_id } = await modelWeb.findOne({ web_key: lamchame.key });
  await modelForum.query().insert((await lamchame.syncForums()).map(forum => ({ ...forum, web_id: lamchame_id, is_deleted: false }))).onConflict(["web_id", "forum_name"]).merge();
  
  await db.DB.destroy();
  return await channel.ack(message);
}

module.exports = syncForums;