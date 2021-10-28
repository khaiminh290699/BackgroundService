const { DB, PostModel, ProgressingModel } = require("../db");
const { WebTreTho, LamChaMe } = require("../pages");
const { Socket } = require("../ultilities");

async function createPost(data, channel, message) {
  const { progressing: { id } } = data;
  const db = new DB();

  const webtretho = new WebTreTho();
  const lamchame = new LamChaMe();

  const postModel = new PostModel(db);
  const progressingModel = new ProgressingModel(db);
  

  let progressing = await progressingModel.findOne({ id });

  if (progressing.status != "waiting") {
    await channel.ack(message);
  }

  progressing.status = "progressing";
  await progressingModel.updateOne(progressing);

  const io = new Socket();
  const socket = await io.connect("users", "token");

  await socket.emit("progressing", { ...progressing, isStarted: true });

  try {
    const posts = await postModel.query()
    .select(
      postModel.DB.raw(`
        posts.id AS post_id,
        posts.title,
        posts.content,
        accounts.id AS account_id,
        accounts.username,
        accounts.password,
        webs.web_key,
        forums.id AS forum_id,
        forums.forum_url,
        settings.id AS setting_id
      `)
    )
    .joinRaw(`
      JOIN progressings ON ( progressings.post_id = posts.id )
      JOIN posting_status ON ( posting_status.progressing_id = progressings.id )
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
  
    if (await lamchame.post(posts.filter((post) => post.web_key === lamchame.key), progressing, db, socket) ) {
      let progressing = await progressingModel.findOne({ id });
      await socket.emit("progressing", { ...progressing }, async () => { await socket.close(); });
      return;
    }
    if (await webtretho.post(posts.filter((post) => post.web_key === webtretho.key), progressing, db, socket)) {
      let progressing = await progressingModel.findOne({ id });
      await socket.emit("progressing", { ...progressing }, async () => { await socket.close(); });
      return;
    }
  
    progressing.status = "success";
    await progressingModel.updateOne(progressing);
    await socket.emit("progressing", { ...progressing }, async () => { await socket.close(); });
  } catch (err) {
    console.log(err);
    progressing.status = "fail";
    await progressingModel.updateOne(progressing);
    await socket.emit("progressing", { ...progressing }, async () => { await socket.close(); });
  } finally {
    await db.DB.destroy();
    await channel.ack(message);
  }
}

module.exports = createPost;