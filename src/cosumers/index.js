const createPost = require("./create-post");
const syncForums = require("./sync-forums");
const getCommunity = require("./get-community");
const timerPosting = require("./timer-posting");

module.exports = {
  createPost,
  syncForums,
  getCommunity,
  timerPosting
}