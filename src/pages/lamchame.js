const moment = require("moment");
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { ProgressingModel, PostingStatusModel, Model } = require("../db");

class LamChaMe{

  key = "lam_cha_me"
  url = "https://www.lamchame.com";

  constructor(username, password) {
    this.username = username || "minhne2906";
    this.password = password || "khaiminh2906";
  };

  init = async () => {

    const options = new chrome.Options();
    options.addArguments("--disable-notifications");
    options.addArguments("--disable-popup-blocking"); 
    options.addArguments("--no-startup-window"); 
    options.addArguments("--headless");

    this.driver = await new Builder().forBrowser("chrome").build();
  }

  login = async (username, password) => {
    if (!this.driver) {
      await this.init();
    }
    await this.driver.get(`${this.url}/forum/login`);
    await this.driver.findElement(By.name("login")).sendKeys(username || this.username);
    await this.driver.findElement(By.id("ctrl_pageLogin_registered")).click();
    await this.driver.findElement(By.name("password")).sendKeys(password || this.password);
    await this.driver.findElement(By.css("input[value='Đăng nhập']")).click();
    return;
  }

  logout = async () => {
    if (!this.driver) {
      await this.init();
    }
    await this.driver.findElement(By.css("ul.visitorTabs li:first-child a")).click();
    const logout = await this.driver.wait(until.elementLocated(By.className("LogOut")), 5000);
    await this.driver.get(await logout.getAttribute("href"))
    return;
  }

  post = async (posts, progressing, db, socket) => {
    const postingStatusModel = new PostingStatusModel(db);
    try {
      for (let i = 0; i < posts.length; i++) {
        const { account_id, title, content, username, password, forum_url, setting_id, forum_id } = posts[i];

        let posting = null;
        try {
          if (i === 0 || account_id != posts[i - 1].account_id) {
            await this.login(username, new Buffer(password, "base64").toString("ascii"));
          }
  
          await this.driver.get(forum_url);
  
          await this.driver.findElement(By.className("callToAction")).click();
          await this.driver.wait(until.elementLocated(By.id("pageDescription")), 5000);
  
          await this.driver.switchTo().defaultContent();
          await this.driver.switchTo().frame(0);
          await this.driver.executeScript(`document.querySelector("body").innerHTML = '${content.replace(/(\r\n|\n|\r)/gm, "")}'`);
          await this.driver.switchTo().defaultContent(); 
          await this.driver.actions({ bridge: false }).keyDown("A").keyUp("A").keyDown(Key.BACK_SPACE).keyUp(Key.BACK_SPACE).perform();
  
  
          await this.driver.findElement(By.name("title")).sendKeys(title, Key.TAB);
  
          // await this.driver.findElement(By.css(`input[value='Đăng chủ đề']`)).click();
  
          if (i + 1 >= posts.length || posts[i + 1].account_id != account_id) {
            try {
              await this.logout();
            } catch {}
          }

          if (progressing) {
            const model = new Model(db);
            await model.openTransaction(async (trx) => {
              const progressingModel = new ProgressingModel(db, trx);
              const postingStatusModel = new PostingStatusModel(db, trx);
  
              progressing.progressing_amount += 1;
              await progressingModel.query().update({ progressing_amount: progressing.progressing_amount }).where({ id: progressing.id });
              const [ postingStatus ] = await postingStatusModel.query().update({ status: "success", message: `Success at ${moment(new Date()).format("HH:MM:SS DD/MM/YYYY")}` }).where({ progressing_id: progressing.id, setting_id, forum_id }).returning(["*"]);
              posting = postingStatus;
            })
          } else {
            posting = await postingStatusModel.insertOne({ setting_id, forum_id, status: "success", message: `Success`,  posting_type: "timer_post" });
          }
        } catch (err) {
          if (progressing) {
            const [ postingStatus ] = await postingStatusModel.query().update({ status: "fail", message: `Fail reason ${err.message}` }).where({ setting_id, forum_id, progressing_id: progressing.id }).returning(["*"])
            posting = postingStatus;
          } else {
            posting = await postingStatusModel.insertOne({ setting_id, forum_id, status: "fail", message: `Fail reason ${err.message}`,  posting_type: "timer_post" });
          }
        }

        if (socket) {
          if (progressing) {
            socket.emit("progressing", { ...progressing, postingStatus: posting })
          } else {
            socket.emit("timer_posting", { postingStatus: posting })
          }
        } 

        if (progressing) {
          const progressingModel = new ProgressingModel(db);
          let progressingStatus = await progressingModel.findOne({ id: progressing.id });
          progressing.status = progressingStatus.status;
          if (socket) {
            socket.emit("progressing", { ...progressing, postingStatus: posting })
          } 
          if (progressingStatus.status != "progressing") {
            return false;
          }
        } else {
          if (socket) {
            socket.emit("timer_posting", { postingStatus: posting })
          } 
        }
      }
      return true;
    } finally {
      await this.close();
    }
  }

  close = async () => {
    if (this.driver) {
      await this.driver.close();
    }
  }

  getForumByPost = async (urls = []) => {
    if (!urls.length) {
      return [];
    }
    const communities = [];
    await this.init();
    for (let i = 0; i < urls.length; i++) {
      await this.driver.get(urls[i]);
      const elements = await this.driver.findElements(By.css(".breadBoxTop nav .breadcrumb .crumbs .crust a"));
      const element = elements[elements.length - 1];
      communities.push({
        post_url: urls[i],
        web_url: this.url,
        web_key: this.key,
        forum_name: await element.getText(),
        forum_url: await element.getAttribute("href")
      })
    }
    await this.close();
    return communities;
  }

  getForums = async () => {
    const getSubForums = async (nodes = [], forums = []) => {
      if (!this.driver) {
        await this.login();
      }
      if (!nodes.length) {
        await this.driver.get(`${this.url}/forum/`);
      } else {
        await this.driver.get(nodes[nodes.length - 1].forum_url);
      }

      const buttonDangBai = await this.driver.findElements(By.className("callToAction"));
      if (buttonDangBai.length) {
        forums.push(nodes[nodes.length - 1]);
      }

      const nodeList = await this.driver.findElements(By.css("li.forum div.nodeText h3.nodeTitle a"));
      if (nodeList.length) {
        for (let i = 0; i < nodeList.length; i++) {
          nodes.push({
            forum_url: await nodeList[i].getAttribute("href"),
            forum_name: await nodeList[i].getText()
          })
        }
      }

      if (!nodes.length) {
        return forums;
      }
      return getSubForums(nodes, forums)
    }

    const forums = await getSubForums();
    await this.close();
    return forums;
  }

  // getForums  = async () => {
  //   await this.init();
  //   await this.driver.get(`${this.url}/forum/`);
  //   const parentForums = [];
  //   const parents = await this.driver.findElements(By.css(`li div.nodeText h3.nodeTitle a`));
  //   for (let i = 0; i < parents.length; i++) {
  //     const forum_url = await parents[i].getAttribute("href");
  //     const forum_name = await parents[i].getText();
  //     parentForums.push({
  //       forum_name,
  //       forum_url
  //     });
  //   }

  //   const forums = [];
  //   for (let i = 0; i < parentForums.length; i++) {
  //     await this.driver.get(parentForums[i].forum_url);
  //     const childs = await this.driver.findElements(By.css(`li.forum div.nodeText h3.nodeTitle a`));
  //     if (!childs.length) {
  //       forums.push(parentForums[i]);
  //       continue;
  //     }
  //     for (let j = 0; j < childs.length; j++) {
  //       const subForumList = await childs[i].findElements(By.className("subForumList"));
  //       if (!subForumList.length) {
  //         forums.push({
  //           forum_url: await childs[j].getAttribute("href"),
  //           forum_name: await childs[j].getText()
  //         })
  //       }
  //     }

  //   }

  //   await this.close();
  //   return forums;
  // }
}

module.exports = LamChaMe;