const { DB, ModelPost, ModelProgressing, Model, ModelPostingStatus, ModelProgressingPostStatus } = require("../db");
const { WebTreTho, LamChaMe, ChaMeNuoiCon } = require("../pages");
const { Socket } = require("../ultilities");
const moment = require("moment");
const WebPage = require("../pages/web-page");

// khi tao moi post hoac bat dau lai tien trinh dang bai => dang lai nhung bai co trang thai loi va dang waiting

async function createPost(data, channel, message) {
  const { progressing: { id } } = data;
  const db = new DB();

  // const webtretho = new WebTreTho();
  // const lamchame = new LamChaMe();
  // const chamenuoicon = new ChaMeNuoiCon();
  const page = new WebPage(db);

  const modelPost = new ModelPost(db);
  const modelProgressing = new ModelProgressing(db);
  

  let progressing = null

  const io = new Socket();
  const socket = await io.connect("users", "token");

  const callback = async (post) => {

    const { posting_status_id } = post;

    const model = new Model(db);
    const result = await model.openTransaction(async (trx) => {
      const modelProgressing = new ModelProgressing(db, trx);
      const modelPostingStatus = new ModelPostingStatus(db, trx);

      progressing.done += 1;
      progressing = await modelProgressing.updateOne(progressing);

      let postingStatus = await modelPostingStatus.findOne({ id: posting_status_id });
      postingStatus.status = "success";
      postingStatus.message = `Success at ${moment(new Date()).format("HH:MM:SS DD/MM/YYYY")}`
      
      postingStatus = await modelPostingStatus.updateOne(postingStatus);

      return { ...progressing, postingStatus }
    })

    socket.emit("progressing", result)

  }

  const error = async (post, err) => {
    const { posting_status_id } = post;
    const modelPostingStatus = new ModelPostingStatus(db);

    let postingStatus = await modelPostingStatus.findOne({ id: posting_status_id });
    postingStatus.status = "fail";
    postingStatus.message = `Fail reason ${err.message}`;
    
    postingStatus = await modelPostingStatus.updateOne(postingStatus);

    socket.emit("progressing", { ...progressing, postingStatus })
  }

  const check = async () => {
    const modelProgressing = new ModelProgressing(db);
    progressing = await modelProgressing.findOne({ id: progressing.id });
    return progressing.status === "progressing"
  }

  try {
    // kiem tra tien tirnh co dang waiting ko ?
    progressing = await modelProgressing.findOne({ id });

    if (progressing.status != "waiting" && progressing.status != "progressing") {
      return;
    }
  
    //update 'progresing' status for progressing;
    progressing.status = "progressing";
    await modelProgressing.updateOne(progressing);

    // emit socket
    await socket.emit("progressing", { ...progressing, isStarted: true });

    // get post fail or waiting status of this progressing;
    let posts = await modelPost.query()
    .select(
      modelPost.DB.raw(`
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
        posting_status.id AS posting_status_id
      `)
    )
    .joinRaw(`
      JOIN progressings ON ( progressings.post_id = posts.id )
      JOIN progressing_post_status ON ( progressing_post_status.progressing_id = progressings.id )
      JOIN posting_status ON ( posting_status.id = progressing_post_status.posting_status_id )
      JOIN settings ON ( settings.post_id = posts.id AND settings.id = posting_status.setting_id )
      JOIN forums ON ( forums.id = posting_status.forum_id )
      JOIN accounts ON ( accounts.id = settings.account_id AND accounts.web_id = forums.web_id )
      JOIN webs ON (webs.id = accounts.web_id AND webs.id = forums.web_id)
    `)
    .whereRaw(`
      posts.id = :post_id
      AND progressings.id = :progressing_id
      AND posting_status.status != 'success'
    `, { post_id: progressing.post_id, progressing_id: progressing.id })
    .orderByRaw(`
      webs.id,
      accounts.id
    `)

    // map data for backlink
    posts = posts.map((post) => {
      const { forum_id, post_id, setting_id } = post;
      post.content = post.content.replace(":post_id", post_id);
      post.content = post.content.replace(":setting_id", setting_id);
      post.content = post.content.replace(":forum_id", forum_id);
      post.content = post.content.replace(":type", "create");

      return post;
    })

    await page.post(posts, { check, callback, error })
    

    // await webtretho.post(posts.filter((post) => post.web_key === webtretho.key), {
    //   callback, error, check
    // })

    // if (progressing.status != "progressing") {
    //   return;
    // }


    // await chamenuoicon.post(posts.filter((post) => post.web_key === chamenuoicon.key), {
    //   callback, error, check
    // })

    // if (progressing.status != "progressing") {
    //   return;
    // }

    // await lamchame.post(posts.filter((post) => post.web_key === lamchame.key), {
    //   callback, error, check
    // })

    // if (progressing.status != "progressing") {
    //   return;
    // }
  
    progressing.status = "success";
    await modelProgressing.updateOne(progressing);
    await socket.emit("progressing", { ...progressing }, async () => { await socket.close(); });
  } catch (err) {
    console.log(err);
    progressing.status = "fail";
    await modelProgressing.updateOne(progressing);
    await socket.emit("progressing", { ...progressing }, async () => { await socket.close(); });
  } finally {
    await db.DB.destroy();
    await channel.ack(message);
  }
}

module.exports = createPost;