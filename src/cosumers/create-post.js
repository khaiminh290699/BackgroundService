const { DB, ModelProgressing, Model, ModelPostingStatus } = require("../db");
const { Socket } = require("../ultilities");
const moment = require("moment");
const WebPage = require("../pages/web-page");

async function createPost(data, channel, message) {
  const { progressing: { id } } = data;
  const { DB: db } = new DB();

  const page = new WebPage(db);

  const modelProgressing = new ModelProgressing(db);
  const modelPostingStatus = new ModelPostingStatus(db);
  

  let progressing = null

  const io = new Socket();
  const socket = await io.connect("users", "token");

  try {
    progressing = await modelProgressing.getOne(id);

    if (progressing.status != "waiting" && progressing.status != "progressing") {
      return;
    }

    progressing.status = "progressing";
    await modelProgressing.updateOne(progressing);

    await socket.emit("progressing", { ...progressing, isStarted: true });

    let posts = await modelPostingStatus.listUndoneInProgressing(progressing.id);

    posts = posts.map((post) => {
      const { forum_id, post_id, setting_id } = post;
      post.content = post.content.replace(":post_id", post_id);
      post.content = post.content.replace(":setting_id", setting_id);
      post.content = post.content.replace(":forum_id", forum_id);
      post.content = post.content.replace(":type", "create");

      return post;
    })

    await page.post(posts, { 
      check: async () => {
        const modelProgressing = new ModelProgressing(db);
        progressing = await modelProgressing.findOne({ id: progressing.id });
        return progressing.status === "progressing"
      }, 
      callback: async (post) => {
        const { posting_status_id } = post;
        const model = new Model(db);
        const result = await model.openTransaction(async (trx) => {
          const modelProgressing = new ModelProgressing(db, trx);
          const modelPostingStatus = new ModelPostingStatus(db, trx);
          progressing.done += 1;
          progressing = await modelProgressing.updateOne(progressing);
          const postingStatus = await modelPostingStatus.updateStatus(posting_status_id, "success", `Success at ${moment(new Date()).format("HH:MM:SS DD/MM/YYYY")}`)
          return { ...progressing, postingStatus }
        })
        socket.emit("progressing", result)
    
      }, 
      error: async (post, err) => {
        const { posting_status_id } = post;
        const modelPostingStatus = new ModelPostingStatus(db);
        const postingStatus = await modelPostingStatus.updateStatus(posting_status_id, "fail", `Fail reason ${err.message}`)
        socket.emit("progressing", { ...progressing, postingStatus })
      } });
  
    progressing.status = "success";
    await modelProgressing.updateOne(progressing);
    await socket.emit("progressing", { ...progressing }, async () => { await socket.close(); });
  } catch (err) {
    console.log(err);
    progressing.status = "fail";
    await modelProgressing.updateOne(progressing);
    await socket.emit("progressing", { ...progressing }, async () => { await socket.close(); });
  } finally {
    await db.destroy();
    await channel.ack(message);
  }
}

module.exports = createPost;



// const callback = async (post) => {

//   const { posting_status_id } = post;

//   const model = new Model(db);
//   const result = await model.openTransaction(async (trx) => {
//     const modelProgressing = new ModelProgressing(db, trx);
//     const modelPostingStatus = new ModelPostingStatus(db, trx);

//     progressing.done += 1;
//     progressing = await modelProgressing.updateOne(progressing);

//     const postingStatus = await modelPostingStatus.updateStatus(posting_status_id, "success", `Success at ${moment(new Date()).format("HH:MM:SS DD/MM/YYYY")}`)

//     return { ...progressing, postingStatus }
//   })

//   socket.emit("progressing", result)

// }

// const error = async (post, err) => {
//   const { posting_status_id } = post;
//   const modelPostingStatus = new ModelPostingStatus(db);

//   const postingStatus = await modelPostingStatus.updateStatus(posting_status_id, "fail", `Fail reason ${err.message}`)

//   socket.emit("progressing", { ...progressing, postingStatus })
// }

// const check = async () => {
//   const modelProgressing = new ModelProgressing(db);
//   progressing = await modelProgressing.findOne({ id: progressing.id });
//   return progressing.status === "progressing"
// }