const Model = require(".");
const ModelPost = require("./post-model");

class ModelPostingStatus extends Model {
  tableName = "posting_status";

  listUndoneInProgressing = async (progressing_id) => {
    const modelPost = new ModelPost(this.DB);
    return await modelPost.query()
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
      progressings.id = :progressing_id
      AND posting_status.status != 'success'
      AND forums.is_deleted = false
      AND accounts.disable = false
    `, { progressing_id })
    .orderByRaw(`
      webs.id,
      accounts.id
    `)
  }

  updateStatus = async (posting_status_id, status, message) => {
    let postingStatus = await this.findOne({ id: posting_status_id });
    postingStatus.status = status;
    postingStatus.message = message;
    
    postingStatus = await this.updateOne(postingStatus);

    return postingStatus;
  }
}

module.exports = ModelPostingStatus;