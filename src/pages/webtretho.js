const { Builder, By, until, Key } = require("selenium-webdriver");
const { default: axios } = require("axios");
const chrome = require("selenium-webdriver/chrome");
const { ProgressingModel, PostingStatusModel, Model } = require("../db");
const moment = require("moment");

require("chromedriver");

class WebTreTho {
  constructor(username, password) {
    this.username = username || "minhne2906";
    this.password = password || "khaiminh2906";
  };

  url = "https://www.webtretho.com";
  key = "web_tre_tho";

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
    await this.driver.get(`${this.url}/dang-nhap`)
    const form = await this.driver.findElement(By.className("form-auth"));
    await form.findElement(By.name("login")).sendKeys(username || this.username);
    await form.findElement(By.name("password")).sendKeys(password || this.password);
    await form.findElement(By.xpath("//button[text()='Đăng nhập']")).click();
    return;
  }

  logout = async () => {
    if (!this.driver) {
      await this.init();
    }
    await this.driver.findElement(By.css(`div.avatar-info div.user-name`)).click();
    await this.sleep(1000);
    await this.driver.findElement(By.css("div.dropdow-menu-desktop div.nav-item:last-child")).click();
    return;
  }

  post = async (posts, progressing, db, socket) => {
    const postingStatusModel = new PostingStatusModel(db);
    try {
      for (let i = 0; i < posts.length; i++) {
        const { title, account_id, content, forum_url, username, password, setting_id, forum_id } = posts[i];
        let posting = null;
        try {
          if (i === 0 || account_id != posts[i - 1].account_id) {
            await this.login(username, new Buffer(password, "base64").toString("ascii"));
          }
      
          await this.driver.get(forum_url);
          await this.driver.findElement(By.className("btn-create-post")).click();
      
          await this.driver.wait(until.urlContains("/tao-bai-viet"))
          const titleInput = await this.driver.wait(until.elementLocated(By.name("title"))); 
  
          await this.driver.wait(until.ableToSwitchToFrame(0));
          await this.sleep(1000);
  
          await this.driver.switchTo().defaultContent();
          await this.driver.switchTo().frame(0);
  
  
          await this.driver.executeScript(`document.querySelector("body").innerHTML = '${content.replace(/(\r\n|\n|\r)/gm, "")}'`);
          await this.driver.switchTo().defaultContent(); 
  
          await titleInput.sendKeys(title, Key.TAB);
          await this.sleep(500);
          await this.driver.actions({ bridge: false }).keyDown("A").keyUp("A").keyDown(Key.BACK_SPACE).keyUp(Key.BACK_SPACE).perform();
      
          // await this.driver.findElement(By.xpath(`//button[contains(text(), "Đăng bài")]`)).click();
      
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
              const [ postingStatus ] = await postingStatusModel.query().update({ status: "success", message: `Success at ${moment(new Date()).format("HH:MM:SS DD/MM.YYYY")}` }).where({ progressing_id: progressing.id, setting_id, forum_id }).returning(["*"]);
              posting = postingStatus;
            })
          } else {
            posting = await postingStatusModel.insertOne({ setting_id, forum_id, status: "success", message: `Success at ${moment(new Date()).format("HH:MM:SS DD/MM.YYYY")}` });
          }
        } catch (err) {
          if (progressing) {
            const [ postingStatus ] =  await postingStatusModel.query().update({ status: "fail", message: `Fail reason ${err.message}` }).where({ setting_id, forum_id, progressing_id: progressing.id }).returning(["*"]);
            posting = postingStatus;
          } else {
            posting = await postingStatusModel.insertOne({ setting_id, forum_id, status: "fail", message: `Fail reason ${err.message}` });
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
      return [];z
    }
    await this.init();
    const communities = [];
    for (let i = 0; i < urls.length; i++) {
      await this.driver.get(urls[i]);
      const communityElement = await this.driver.findElement(By.css("a.w-desc-180x"))
      communities.push({
        post_url: urls[i],
        web_url: this.url,
        web_key: this.key,
        forum_name: await communityElement.getText(),
        forum_url: await communityElement.getAttribute("href")
      })
    }
    await this.close();
    return communities;
  }

  getForums = async () => {
    const api = async (page, limit = 50) => {
      const { data: { data: { searchCommunities } } } = await axios.post(`${this.url}/api`, {
        variables: null,
        query: `query { searchCommunities (where: {isInternal: false, isPrivate: false, isApproved: true, isHidden: false, isDeleted: false, }, limit: ${limit}, offset: ${limit * (page - 1)} , order: \"participantCount DESC\") {   id   name   slug   about } }`
      })

      return searchCommunities;
    }

    let i = 1;
    const forums = [];
    while (true) {
      const data = await api(i);

      forums.push(...data.map((forum) => {
        const { name, slug } = forum;
        return {
          forum_name: name,
          forum_url: `${this.url}/f/${slug}`,
        }
      }));
      
      if (!data.length) {
        return forums;
      }

      i += 1;
    }

  }
  
  sleep = async (ms) => {
    await new Promise((resovle) => setTimeout(resovle, ms));
  }
}

module.exports = WebTreTho