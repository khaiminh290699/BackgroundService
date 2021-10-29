const DB = require("./connect/db");
const Model = require("./model")
const ModelAccount = require("./model/account-model");
const ModelPost = require("./model/post-model");
const ModelProgressing = require("./model/progressing-model")
const ModelWeb = require("./model/web-model");
const ModelForum = require("./model/forum-model");
const ModelPostingStatus = require("./model/posting-status-model");
const ModelSetting = require("./model/setting-model");

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
}