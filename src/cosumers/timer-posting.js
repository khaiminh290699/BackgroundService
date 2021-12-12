const { DB, ModelTimerSetting } = require("../db");
const { Socket } = require("../ultilities");
const moment = require("moment");
const WebPage = require("../pages/web-page");

async function timerPosting(data, channel, message) {
  const { timer_at } = data;

  console.log(`Running timer posting at ${ timer_at }`)

  const db = new DB();
  const modelTimerSetting = new ModelTimerSetting(db);

  const page = new WebPage(db);

  try {

    let posts = await modelTimerSetting.listTimerAt(timer_at);
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

    await page.post(posts, { 
      check: async () => { return true },
      callback: async (post) => {
        const message = `Success at ${moment(new Date()).format("HH:MM:SS DD/MM/YYYY")}`;
        const { setting_id, forum_id, timer_setting_id } = post;
        const modelTimerSetting = new ModelTimerSetting(db);
        const postingStatus = await modelTimerSetting.createTimerPostingStatus(setting_id, forum_id, "success", message, timer_setting_id );
        socket.emit("timer_posting", { ...postingStatus, keyDate: moment(new Date()).startOf("date").format("DD_MM_YYYY"), timer_setting_id: post.timer_setting_id  })
      }, 
      error: async (post, err) => {
        const message = `Fail reason ${err.message}`;
        const { setting_id, forum_id, timer_setting_id } = post;
        const modelTimerSetting = new ModelTimerSetting(db);
        const postingStatus = await modelTimerSetting.createTimerPostingStatus(setting_id, forum_id, "fail", message, timer_setting_id );
        socket.emit("timer_posting", { ...postingStatus, keyDate: moment(new Date()).startOf("date").format("DD_MM_YYYY"), timer_setting_id: post.timer_setting_id  })
      } 
    })

    await socket.disconnect();
    await channel.ack(message); 
  } finally {
    await db.DB.destroy();
  }
}

module.exports = timerPosting;





  // const callback = async (post) => {
  //   const message = `Success at ${moment(new Date()).format("HH:MM:SS DD/MM/YYYY")}`;
  //   const { setting_id, forum_id, timer_setting_id } = post;
  //   const modelTimerSetting = new ModelTimerSetting(db);
  //   const postingStatus = await modelTimerSetting.createTimerPostingStatus(setting_id, forum_id, "success", message, timer_setting_id );

  //   socket.emit("timer_posting", { ...postingStatus, keyDate: moment(new Date()).startOf("date").format("DD_MM_YYYY"), timer_setting_id: post.timer_setting_id  })

  // }

  // const error = async (post, err) => {

  //   const message = `Fail reason ${err.message}`;
  //   const { setting_id, forum_id, timer_setting_id } = post;
  //   const modelTimerSetting = new ModelTimerSetting(db);
  //   const postingStatus = await modelTimerSetting.createTimerPostingStatus(setting_id, forum_id, "fail", message, timer_setting_id );
    
  //   socket.emit("timer_posting", { ...postingStatus, keyDate: moment(new Date()).startOf("date").format("DD_MM_YYYY"), timer_setting_id: post.timer_setting_id  })
  // }

  // const check = async () => {
  //   return true;
  // }