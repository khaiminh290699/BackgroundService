const DB = require("./connect/db");
const Model = require("./model")
const ModelAccount = require("./model/account-model");
const ModelPost = require("./model/post-model");
const ModelProgressing = require("./model/progressing-model")
const ModelWeb = require("./model/web-model");
const ModelForum = require("./model/forum-model");
const ModelPostingStatus = require("./model/posting-status-model");
const ModelSetting = require("./model/setting-model");
const ModelForumSetting = require("./model/forum-setting-model");
const ModelProgressingPostStatus = require("./model/progressing-post-status-model");
const ModelAction = require("./model/action-model");
const ModelTimerStatus = require("./model/timer-status-model");
const ModelTimerSetting = require("./model/timer-setting-model");

module.exports = {
  DB,
  Model,
  ModelAccount,
  ModelPost,
  ModelProgressing,
  ModelWeb,
  ModelForum,
  ModelPostingStatus,
  ModelSetting,
  ModelForumSetting,
  ModelProgressingPostStatus,
  ModelAction,
  ModelTimerStatus,
  ModelTimerSetting
}