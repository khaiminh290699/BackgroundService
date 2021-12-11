const Model = require(".");
const ModelSetting = require("./setting-model");
const ModelPostingStatus = require("./posting-status-model");
const ModelTimerStatus = require("./timer-status-model");

class ModelTimerSetting extends Model {
  tableName = "timer_setting";

  createTimerPostingStatus = async (setting_id, forum_id, status, message, timer_setting_id) => {
    const modelPostingStatus = new ModelPostingStatus(this.DB, this.trx);
    const modelTimerStatus = new ModelTimerStatus(this.DB, this.trx);
    const postingStatus = await modelPostingStatus.insertOne({ setting_id, forum_id, status, message, is_timer: true });
    await modelTimerStatus.insertOne({ posting_status_id: postingStatus.id, timer_setting_id })
    return postingStatus;
  }

  listTimerAt = async (timer_at) => {
    const modelSetting = new ModelSetting(this.DB);
    return await modelSetting.query()
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

  }
}

module.exports = ModelTimerSetting;