const { DB, WebModel, ForumModel } = require("../db");
const { WebTreTho, LamChaMe } = require("../pages");

async function syncForums(data, channel, message) {
  return;
  const webtretho = new WebTreTho();
  const lamchame = new LamChaMe();

  const db = new DB();
  const webModel = new WebModel(db);
  const forumModel = new ForumModel(db);

  await forumModel.query().update({ is_deleted: true }); 

  const { id: webtretho_id } = await webModel.findOne({ web_key: webtretho.key });
  await forumModel.query().insert((await webtretho.getForums()).map(forum => ({ ...forum, web_id: webtretho_id, is_deleted: false }))).onConflict(["web_id", "forum_name"]).merge();

  const { id: lamchame_id } = await webModel.findOne({ web_key: lamchame.key });
  await forumModel.query().insert((await lamchame.getForums()).map(forum => ({ ...forum, web_id: lamchame_id, is_deleted: false }))).onConflict(["web_id", "forum_name"]).merge();
  
  await db.DB.destroy();
  await channel.ack(message);
}
module.exports = syncForums;