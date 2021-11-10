const { Builder, until, By, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { ModelAction, ModelWeb } = require("../db");

class WebPage {
  constructor(db) {
    this.db = db;
  }

  init = async () => {

    if (!this.driver) {
      const options = new chrome.Options();
      options.addArguments("--disable-notifications");
      options.addArguments("--disable-popup-blocking"); 
      options.addArguments("--no-startup-window"); 
      options.addArguments("--headless");

      this.driver = await new Builder().forBrowser("chrome").build();
    }
  }

  action = async (action, data) => {
    if (action.tag === "iframe") {

      await this.driver.switchTo().defaultContent();
      await this.sleep(2000);
      await this.driver.switchTo().frame(action.number);

      if (action.action === "input") {
        await this.driver.executeScript(`document.querySelector("body").innerHTML = '${data[action.input].replace(/(\r\n|\n|\r)/gm, "")}'`);
        await this.sleep(2000);
        await this.driver.findElement(By.tagName("body")).click();
        await this.driver.actions({ bridge: false }).keyDown("A").keyUp("A").keyDown(Key.BACK_SPACE).keyUp(Key.BACK_SPACE).perform();
      }

      await this.driver.switchTo().defaultContent();

    } else {
      let element = null;

      let xpath = null;

      if (action.text) {
        xpath = `text() = '${action.text}'`
      }

      if (action.attributes) {
        Object.keys(action.attributes).forEach((key) => {
          if (xpath) {
            xpath = `${ xpath } and contains(@${ key }, '${action.attributes[key]}')`
          } else {
            xpath = `contains(@${ key }, '${action.attributes[key]}')`
          }
        })
      }

      xpath = `${action.tag}[${xpath}]`;
      if (!action.ancestors.length) {
        xpath = `//${xpath}`
      }
      action.ancestors.map((ancestor) => {
        let con = ``;
        if (ancestor.id) {
          con = `${ con ? 'and' : '' } contains(@id, '${ancestor.id}')`
        }
        if (ancestor.class) {
          con = `${ con ? 'and' : '' } contains(@class, '${ancestor.class}')`
        }
        if (ancestor.text) {
          con = `${ con ? 'and' : '' } text{} = '${ancestor.class}'`
        }
        xpath = `//${ancestor.tag}${con ? `[${con}]` : ''}//${ancestor.axes}::${xpath}`
      })

      console.log(xpath)
      try {
        element = await this.driver.wait(until.elementLocated(By.xpath(xpath)), 1000);
      } catch (err) {
        console.log(err)
        throw new Error(`Element not found ${xpath}`)
      }

      switch(action.action) {
        case "click": {
          await element.click();
          break;
        } 
        case "input": {
          await element.sendKeys(data[action.input])
          break;
        } 
      }
      
      if (action.action === "find") {
        return element;
      }

      await this.sleep(2000);
      
    }
  }

  login = async (username, password, web_id, web_url) => {
    const model = new ModelAction(this.db);
    const actions = await model.query().where({ web_id, type: "login" }).orderBy("order_number");
    await this.driver.get(web_url)
    for (let i = 0; i < actions.length; i++) {
      await this.action(actions[i], { username, password });
    }
  }

  logout = async (web_id) => {
    const model = new ModelAction(this.db);
    const actions = await model.query().where({ web_id, type: "logout" }).orderBy("order_number");
    for (let i = 0; i < actions.length; i++) {
      await this.action(actions[i], { });
    }
  }

  forum = async (url) => {
    await this.init();
    await this.driver.get(url);
    const model = new ModelAction(this.db);
    const modelWeb = new ModelWeb(this.db);

    const strs = url.split("/");
    const web_url = `${strs[0]}//${strs[2]}/`;

    const web = await modelWeb.findOne({ web_url });

    const actions = await model.query().where({ web_id: web.id, type: "get_forum" }).orderBy("order_number");
    
    let element = null;
    for (let i = 0; i < actions.length; i++) {
      if (actions[i].action === "find") {
        element = await this.action(actions[i], {});
        break;
      }
    }
    if (element) {
      return {
        web_id: web.id,
        post_url: url,
        web_url: web.web_url,
        web_key: web.web_key,
        forum_name: await element.getText(),
        forum_url: await element.getAttribute("href")
      }
    }

    return null;
  }

  each = async (post) => {
    const model = new ModelAction(this.db);
    const actions = await model.query().where({ web_id: post.web_id, type: "posting" }).orderBy("order_number");
    await this.driver.get(post.forum_url)
    for (let i = 0; i < actions.length; i++) {
      await this.action(actions[i], { ...post });
    }
  }

  post = async (posts, cb) => {
    try {
      const { check, callback, error } = cb;
      await this.init();
      for (let i = 0; i < posts.length && await check(); i++) {
        const post = posts[i];
        try {

          // if (i === 0 || post.web_id != posts[i - 1].web_id) {
          //   await this.driver.get(post.web_url)
          // }
  
          // login
          if (i === 0 || post.account_id != posts[i - 1].account_id) {
            await this.login(post.username, new Buffer(post.password, "base64").toString("ascii"), post.web_id, post.web_url);
          }
  
          // posting
          await this.each(post);
  
          // logout
          if (i + 1 >= posts.length || posts[i + 1].account_id != post.account_id) {
            try {
              await this.logout(posts[i].web_id);
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

module.exports = WebPage;