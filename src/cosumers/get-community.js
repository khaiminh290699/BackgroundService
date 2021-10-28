const { DB, ForumModel, WebModel } = require("../db");
const { WebTreTho, LamChaMe } = require("../pages");
const { Socket } = require("../ultilities");

async function getCommunity(data, channel, message) {
  const { responseKey, urls = [] } = data;
  let communities = [], selectedForums = {};

  const db = new DB();
  const webModel = new WebModel(db);
  const forumModel = new ForumModel(db);

  const forums = await forumModel.query().join("webs", "webs.id", "forums.web_id").select(
    forumModel.DB.raw(`
      forums.*,
      webs.id AS web_id,
      webs.web_name,
      webs.web_url,
      webs.web_key
    `)
  );

  const webtretho = new WebTreTho();
  const lamchame = new LamChaMe();
  communities.push(...await webtretho.getForumByPost(urls.filter((url) => url.includes(webtretho.url))));
  communities.push(...await lamchame.getForumByPost(urls.filter((url) => url.includes(lamchame.url))));

  const webs = await webModel.query();
  
  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];
    let forum = forums.filter((forum) => forum.forum_url.includes(community.forum_url) || community.forum_url.includes(forum.forum_url))[0];
    if (!forum) {
      const web = webs.filter((web) => web.web_key === community.web_key)[0];
      forum = await forumModel.insertOne({ forum_url: community.forum_url, forum_name: community.forum_name, web_id: web.id });
      forum.web_key = web.web_key;
      forum.web_url = web.web_url;
      forum.web_name = web.web_name;
    }
    if (!selectedForums[forum.id]) {
      selectedForums[forum.id] = forum;
      selectedForums[forum.id].source = [];
    }
    selectedForums[forum.id].source.push(community);
  }

  const io = new Socket();
  const socket = await io.connect("users", "token");
  socket.emit("get_community", { responseKey, communities, selectedForums: Object.values(selectedForums) }, async () => {
    await socket.close();
  });

  await db.DB.destroy();
  await channel.ack(message);
}

module.exports = getCommunity;