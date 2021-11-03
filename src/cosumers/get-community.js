const { DB, ModelForum, ModelWeb } = require("../db");
const { WebTreTho, LamChaMe, ChaMeNuoiCon } = require("../pages");
const { Socket } = require("../ultilities");

async function getCommunity(data, channel, message) {
  const { responseKey, urls = [] } = data;
  let communities = [], selectedForums = {}, notSupporting = [];

  const db = new DB();
  const modelWeb = new ModelWeb(db);
  const modelForum = new ModelForum(db);

  const forums = await modelForum.query().join("webs", "webs.id", "forums.web_id").select(
    modelForum.DB.raw(`
      forums.*,
      webs.id AS web_id,
      webs.web_name,
      webs.web_url,
      webs.web_key
    `)
  );

  const webtretho = new WebTreTho();
  const lamchame = new LamChaMe();
  const chamenuoicon = new ChaMeNuoiCon();

  communities.push(...await webtretho.getForums(urls.filter((url) => url.includes(webtretho.url))));
  communities.push(...await lamchame.getForums(urls.filter((url) => url.includes(lamchame.url))));
  communities.push(...await chamenuoicon.getForums(urls.filter((url) => url.includes(chamenuoicon.url))));
  
  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];
    let forum = forums.filter((forum) => forum.forum_url.includes(community.forum_url) || community.forum_url.includes(forum.forum_url))[0];
    if (forum) {
      if (!selectedForums[forum.id]) {
        selectedForums[forum.id] = forum;
        selectedForums[forum.id].source = [];
      }
      selectedForums[forum.id].source.push(community);
    } else {
      notSupporting.push(community.forum_url)
    }
  }

  const io = new Socket();
  const socket = await io.connect("users", "token");
  socket.emit("get_community", { responseKey, communities, selectedForums: Object.values(selectedForums), notSupporting }, async () => {
    await socket.close();
  });

  await db.DB.destroy();
  await channel.ack(message);
}

module.exports = getCommunity;