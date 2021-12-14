const { Builder, until, By, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { ModelAction, ModelWeb } = require("../db");

const Up = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const Down = "abcdefghijklmnopqrstuvwxyz";

class WebPage {
  constructor(db) {
    this.db = db;
  }

  init = async () => {

    if (!this.driver) {
      const options = new chrome.Options();
      // options.addArguments("--disable-notifications");
      // options.addArguments("--disable-popup-blocking"); 
      // options.addArguments("--no-startup-window"); 

      // options.addArguments("--window-size=1920,1080")
      // options.addArguments("--start-maximized");
      // options.addArguments("--headless");

      // options.addArguments("--headless");

      // this.driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

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

      // if (action.text) {
      //   xpath = `text() = '${action.text}'`
      // }

      if (action.attributes) {
        Object.keys(action.attributes).forEach((key) => {
          const value = action.attributes[key].field ? data[action.attributes[key].value] : action.attributes[key].value;
          const lower = value.toLowerCase();
          const upper = value.toUpperCase();
          if (xpath) {
            xpath = `${ xpath } and contains(translate(${ key === "text" ? "text()" : `@${ key }` }, '${lower}', '${upper}'), '${upper}')`;
          } else {
            xpath = `contains(translate(${ key === "text" ? "text()" : `@${ key }` }, '${lower}', '${upper}'), '${upper}')`
          }
        })
      }

      if (xpath) {
        xpath = `${action.tag}[${xpath}]`;
      } else {
        xpath = `${action.tag}`
      }
      
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
          con = `${ con ? 'and' : '' } text() = '${ancestor.text}'`
        }
        xpath = `//${ancestor.tag}${con ? `[${con}]` : ''}/${ancestor.axes}::${xpath}`
      })

      console.log(xpath)
      try {
        if (action.number != null) {
          const elements = await this.driver.wait(until.elementsLocated(By.xpath(xpath), 2000));
          element = elements[action.number >= 0 ? action.number : ( elements.length + action.number )];
          if (!element) {
            throw new Error("Element not found");
          }
        } else {
          element = await this.driver.wait(until.elementLocated(By.xpath(xpath)), 2000);
        }
      } catch (err) {
        if (action.action != "not_found") {
          throw new Error(`Element not found ${xpath}`)
        }
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
        case "not_found": {
          if (element) {
            throw new Error(`Element ${xpath} exist while expect not found `)
          }
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
    await this.init();
    try {
      const model = new ModelAction(this.db);
      const actions = await model.listActionsByWeb(web_id, "login");
      await this.driver.get(web_url)
      for (let i = 0; i < actions.length; i++) {
        await this.action(actions[i], { username, password });
      }
    } catch (err) {
      throw new Error(`Login Fail: ${ err.message }`)
    }
  }

  logout = async (username, password, web_id, web_url) => {
    await this.init();
    const model = new ModelAction(this.db);
    const actions = await model.listActionsByWeb(web_id, "logout");
    for (let i = 0; i < actions.length; i++) {
      await this.action(actions[i], { username, password });
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

    const actions = await model.listActionsByWeb(web.id, "get_forum");
    
    let result = {
      web_id: web.id,
      post_url: url,
      web_url: web.web_url,
      web_key: web.web_key,
    };
    for (let i = 0; i < actions.length; i++) {
      let element = await this.action(actions[i], {});
      if (actions[i].action === "find") {
        const keys = Object.keys(actions[i].output);
        for (let j = 0; j < keys.length; j++) {
          const value = actions[i].output[keys[j]];
          if (keys[j] === "text") {
            result = {
              ...result,
              [value]: await element.getText()
            }
          } else {
            result = {
              ...result,
              [value]: await element.getAttribute(keys[j])
            }
          }
        }
      }
    }
  
    if (!result.forum_url || !result.forum_name) {
      throw new Error("Miss forum url and forum name")
    }

    return result;
  }

  each = async (post) => {
    await this.init();
    try {
      const model = new ModelAction(this.db);
      const actions = await model.listActionsByWeb(post.web_id, "posting");
      await this.driver.get(post.forum_url)
      await this.sleep(1000);
      for (let i = 0; i < actions.length; i++) {
        await this.action(actions[i], { ...post });
      }
    } catch (err) {
      throw new Error(`Posting Fail: ${ err.message }`)
    }
  }

  post = async (posts, cb) => {
    try {
      const { check, callback, error } = cb;
      let logined = false;
      await this.init();
      for (let i = 0; i < posts.length && await check(); i++) {
        const post = posts[i];
        try {

          // if (!logined || i === 0 || post.web_id != posts[i - 1].web_id) {
          //   await this.driver.get(post.web_url)
          // }
  
          // login
          if (!logined || i === 0 || post.account_id != posts[i - 1].account_id) {
            try {
              await this.login(post.username, new Buffer(post.password, "base64").toString("ascii"), post.web_id, post.web_url);
              logined = true;
            } catch (err) {
              logined = false;
              throw err;
            }
          }
  
          // posting
          await this.each(post);
  
          // logout
          if (i + 1 >= posts.length || posts[i + 1].account_id != post.account_id) {
            try {
              await this.logout(post.username, new Buffer(post.password, "base64").toString("ascii"), post.web_id, post.web_url);
            } catch (err) {
              await this.close();
              logined = false;
            }
          }
  
          await callback(post);
  
        } catch (err) {
          console.log(err)
          await error(post, err);
          await this.close();
          logined = false;
        }
      }
    } finally {
      await this.close();
    }
  }

  close = async () => {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  sleep = async (ms) => {
    await new Promise((resovle) => setTimeout(resovle, ms));
  }
}

module.exports = WebPage;