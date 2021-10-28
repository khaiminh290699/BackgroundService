const DB = require("./connect/db");
const Model = require("./model")
const AccountModel = require("./model/account-model");
const ContentModel = require("./model/content-model");
const PostModel = require("./model/post-model");
const ProgressingModel = require("./model/progressing-model")
const WebModel = require("./model/web-model");
const ForumModel = require("./model/forum-model");
const PostingStatusModel = require("./model/posting-status-model");
const SettingModel = require("./model/setting-model");

module.exports = {
  DB,
  Model,
  AccountModel,
  PostModel,
  ContentModel,
  ProgressingModel,
  WebModel,
  ForumModel,
  PostingStatusModel,
  SettingModel,
}