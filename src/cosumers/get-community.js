const { DB, ModelForum, ModelWeb } = require("../db");
const { WebTreTho, LamChaMe, ChaMeNuoiCon } = require("../pages");
const WebPage = require("../pages/web-page");
const { Socket } = require("../ultilities");

async function getCommunity(data, channel, message) {
  const { responseKey, urls = [] } = data;
  let communities = [], selectedForums = {}, errorGetForums = [];

  const { DB: db } = new DB();
  const modelWeb = new ModelWeb(db);
  const modelForum = new ModelForum(db);

  // const webtretho = new WebTreTho();
  // const lamchame = new LamChaMe();
  // const chamenuoicon = new ChaMeNuoiCon();

  const page = new WebPage(db);
  let forums = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      const community = await page.forum(urls[i]);
      if (community) {
        communities.push(community);
        if (!forums.some((forum) => forum.forum_url === community.forum_url)) {
          forums.push({
            web_id: community.web_id,
            forum_url: community.forum_url,
            forum_name: community.forum_name
          })
        }
      }
    } catch (err) {
      const strs = urls[i].split("/");
      const exist = errorGetForums.filter((forum) => forum.web_url === `${strs[0]}//${strs[2]}`)[0];
      if (exist) {
        if (!exist.messages.some(message => message === err.message)) {
          exist.messages.push(err.message)
        }
      } else {
        errorGetForums.push({
          web_url: `${strs[0]}//${strs[2]}`,
          messages: [err.message]
        })
      }
    }
  }

  console.log(forums)
  await page.close();
  if (forums.length) {
    forums.is_deleted = false;
    const list = await modelForum.query().whereIn("forum_url", forums.map((forum) => forum.forum_url)).where({ is_deleted: false });
    const data = forums.filter((forum) => {
      return !list.some((item) => item.forum_url === forum.forum_url)
    })
    if (data.length) {
      await modelForum.query().insert(data.map((data) => ({ ...data, is_deleted: false }))).onConflict(["forum_name", "web_id"]).merge();
    }
  }
  
  forums = await modelForum.query().join("webs", "webs.id", "forums.web_id").select(
    modelForum.DB.raw(`
      forums.*,
      webs.id AS web_id,
      webs.web_name,
      webs.web_url,
      webs.web_key
    `)
  );
  
  // communities.push(...await webtretho.getForums(urls.filter((url) => url.includes(webtretho.url))));
  // communities.push(...await lamchame.getForums(urls.filter((url) => url.includes(lamchame.url))));
  // communities.push(...await chamenuoicon.getForums(urls.filter((url) => url.includes(chamenuoicon.url))));
  
  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];
    let forum = forums.filter((forum) => forum.forum_url.includes(community.forum_url) || community.forum_url.includes(forum.forum_url))[0];
    if (forum) {
      if (!selectedForums[forum.id]) {
        selectedForums[forum.id] = forum;
        selectedForums[forum.id].source = [];
      }
      selectedForums[forum.id].source.push(community);
    }
  }

  const io = new Socket();
  const socket = await io.connect("users", "token");
  socket.emit("get_community", { responseKey, communities, selectedForums: Object.values(selectedForums), errorGetForums }, async () => {
    await socket.close();
  });

  await db.destroy();
  await channel.ack(message);
}

module.exports = getCommunity;