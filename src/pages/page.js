const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

class Page {

  init = async () => {

    const options = new chrome.Options();
    options.addArguments("--disable-notifications");
    options.addArguments("--disable-popup-blocking"); 
    options.addArguments("--no-startup-window"); 
    options.addArguments("--headless");

    this.driver = await new Builder().forBrowser("chrome").build();
  }

  post = async (posts, cb) => {
    try {
      const { check, callback, error } = cb;
      for (let i = 0; i < posts.length && await check(); i++) {
        const post = posts[i];
        try {
  
          // login
          if (i === 0 || post.account_id != posts[i - 1].account_id) {
            await this.login(post.username, new Buffer(post.password, "base64").toString("ascii"));
          }
  
          // posting
          await this.each(post);
  
          // logout
          if (i + 1 >= posts.length || posts[i + 1].account_id != post.account_id) {
            try {
              await this.logout();
            } catch (err) {
              console.log(err)
              await this.close();
            }
          }
  
          await callback(post);
  
        } catch (err) {
          console.log(err);
          await error(post, err);
        }
      }
    } finally {
      await this.close();
    }
  }

  close = async () => {
    if (this.driver) {
      await this.driver.close();
    }
  }

  sleep = async (ms) => {
    await new Promise((resovle) => setTimeout(resovle, ms));
  }
}

module.exports = Page;













// postOld = async (posts, progressing, db, socket) => {
//   const modelPostingStatus = new ModelPostingStatus(db);
//   try {
//     for (let i = 0; i < posts.length; i++) {
//       const { account_id, username, password, setting_id, forum_id } = posts[i];
//       let posting = null;
//       try {

//         if (i === 0 || account_id != posts[i - 1].account_id) {
//           await this.login(username, new Buffer(password, "base64").toString("ascii"));
//         }

//         await this.each(posts[i])

//         if (i + 1 >= posts.length || posts[i + 1].account_id != account_id) {
//           try {
//             await this.logout();
//           } catch {}
//         }

//         if (progressing) {
//           const model = new Model(db);
//           await model.openTransaction(async (trx) => {
//             const modelProgressing = new ModelProgressing(db, trx);
//             const modelPostingStatus = new ModelPostingStatus(db, trx);

//             progressing.progressing_amount += 1;
//             await modelProgressing.query().update({ progressing_amount: progressing.progressing_amount }).where({ id: progressing.id });
//             const [ postingStatus ] = await modelPostingStatus.query().update({ status: "success", message: `Success at ${moment(new Date()).format("HH:MM:SS DD/MM/YYYY")}` }).where({ progressing_id: progressing.id, setting_id, forum_id }).returning(["*"]);
//             posting = postingStatus;
//           })
//         } else {
//           posting = await modelPostingStatus.insertOne({ setting_id, forum_id, status: "success", message: `Success`,  posting_type: "timer_post" });
//         }
//       } catch (err) {
//         console.log(err)
//         if (progressing) {
//           const [ postingStatus ] = await modelPostingStatus.query().update({ status: "fail", message: `Fail reason ${err.message}` }).where({ setting_id, forum_id, progressing_id: progressing.id }).returning(["*"])
//           posting = postingStatus;
//         } else {
//           posting = await modelPostingStatus.insertOne({ setting_id, forum_id, status: "fail", message: `Fail reason ${err.message}`,  posting_type: "timer_post" });
//         }
//       }


//       if (progressing) {
//         const modelProgressing = new ModelProgressing(db);
//         let progressingStatus = await modelProgressing.findOne({ id: progressing.id });
//         progressing.status = progressingStatus.status;
//         if (socket) {
//           socket.emit("progressing", { ...progressing, postingStatus: posting })
//         } 
//         if (progressingStatus.status != "progressing") {
//           return false;
//         }
//       } else {
//         if (socket) {
//           socket.emit("timer_posting", { postingStatus: posting })
//         } 
//       }
//     }
//     return true;
//   } finally {
//     await this.close();
//   }
// }
