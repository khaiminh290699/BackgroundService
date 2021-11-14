const { DB, ModelSetting, ModelPostingStatus, Model, ModelTimerStatus } = require("../db");
const { WebTreTho, LamChaMe, ChaMeNuoiCon } = require("../pages");
const { Socket } = require("../ultilities");
const moment = require("moment");
const WebPage = require("../pages/web-page");

async function timerPosting(data, channel, message) {
  const { timer_at } = data;

  const db = new DB();
  const modelSetting = new ModelSetting(db);

  const page = new WebPage(db);

  // const webtretho = new WebTreTho();
  // const lamchame = new LamChaMe();
  // const chamenuoicon = new ChaMeNuoiCon();

  const callback = async (post) => {
    const { setting_id, forum_id } = post;
    const modelPostingStatus = new ModelPostingStatus(db);
    const modelTimerStatus = new ModelTimerStatus(db);
    const postingStatus = await modelPostingStatus.insertOne({ setting_id, forum_id, status: "success", message: `Success at ${moment(new Date()).format("HH:MM:SS DD/MM/YYYY")}`,  is_timer: true });
    await modelTimerStatus.insertOne({ posting_status_id: postingStatus.id, timer_setting_id: post.timer_setting_id })
    socket.emit("timer_posting", { ...postingStatus, keyDate: moment(new Date()).startOf("date").format("DD_MM_YYYY"), timer_setting_id: post.timer_setting_id  })

  }

  const error = async (post, err) => {
    const { setting_id, forum_id } = post;
    const modelPostingStatus = new ModelPostingStatus(db);
    const modelTimerStatus = new ModelTimerStatus(db);
    const postingStatus = posting = await modelPostingStatus.insertOne({ setting_id, forum_id, status: "fail", message: `Fail reason ${err.message}`, is_timer: true });
    await modelTimerStatus.insertOne({ posting_status_id: postingStatus.id, timer_setting_id: post.timer_setting_id })
    socket.emit("timer_posting", { ...postingStatus, keyDate: moment(new Date()).startOf("date").format("DD_MM_YYYY"), timer_setting_id: post.timer_setting_id  })
  }

  const check = async () => {
    return true;
  }

  let posts = await modelSetting.query()
    .select(
      modelSetting.DB.raw(`
        posts.id AS post_id,
        posts.title,
        posts.content,
        accounts.id AS account_id,
        accounts.username,
        accounts.password,
        webs.id AS web_id,
        webs.web_key,
        webs.web_url,
        forums.id AS forum_id,
        forums.forum_url,
        settings.id AS setting_id,
        timer_setting.id AS timer_setting_id
      `)
    )
    .joinRaw(`
      JOIN timer_setting ON ( timer_setting.setting_id = settings.id AND timer_setting.is_deleted = false  )
      JOIN posts ON ( posts.id = settings.post_id )
      JOIN accounts ON ( accounts.id = settings.account_id )
      JOIN forums ON ( forums.id = timer_setting.forum_id )
      JOIN webs ON ( webs.id = accounts.web_id AND webs.id = forums.web_id )
    `)
    .whereRaw(`
      accounts.disable = false
      AND posts.is_deleted = false
      AND forums.is_deleted = false
      AND timer_setting.from_date <= NOW()::DATE AND timer_setting.to_date >= NOW()::DATE
      AND timer_setting.timer_at = :timer_at
      AND timer_setting.is_deleted = false
    `, { timer_at })
    .orderByRaw(`
      webs.id,
      accounts.id
    `)  

  if (!posts.length) {
    return await channel.ack(message); 
  }

  posts = posts.map((post) => {
    const { forum_id, post_id, setting_id } = post;
    post.content = post.content.replace(":post_id", post_id);
    post.content = post.content.replace(":setting_id", setting_id);
    post.content = post.content.replace(":forum_id", forum_id);
    post.content = post.content.replace(":type", `timer/${timer_at}`);

    return post;
  })

  const socket = await new Socket().connect("users", "token");

  await page.post(posts, { check, callback, error })
  
  // await webtretho.post(posts.filter((post) => post.web_key === webtretho.key), { callback, error, check });
  // await chamenuoicon.post(posts.filter((post) => post.web_key === chamenuoicon.key), { callback, error, check });
  // await lamchame.post(posts.filter((post) => post.web_key === lamchame.key), { callback, error, check });

  await channel.ack(message); 
}

module.exports = timerPosting;