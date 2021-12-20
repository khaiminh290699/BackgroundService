const moment = require("moment");
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { ModelProgressing, ModelPostingStatus, Model } = require("../db");
const Page = require("./page");

class LamChaMe extends Page {

  key = "lam_cha_me"
  url = "https://www.lamchame.com";

  // constructor(username, password) {
  //   super();
  //   this.username = username || "minhne2906";
  //   this.password = password || "khaiminh2906";
  // };

  // login = async (username, password) => {
  //   if (!this.driver) {
  //     await this.init();
  //   }
  //   await this.driver.get(`${this.url}/forum/login`);
  //   await this.driver.findElement(By.name("login")).sendKeys(username || this.username);
  //   await this.driver.findElement(By.id("ctrl_pageLogin_registered")).click();
  //   await this.driver.findElement(By.name("password")).sendKeys(password || this.password);
  //   await this.driver.findElement(By.css("input[value='Đăng nhập']")).click();
  //   return;
  // }

  // logout = async () => {
  //   if (!this.driver) {
  //     await this.init();
  //   }
  //   await this.driver.findElement(By.css("ul.visitorTabs li:first-child a")).click();
  //   const logout = await this.driver.wait(until.elementLocated(By.className("LogOut")), 5000);
  //   await this.driver.get(await logout.getAttribute("href"))
  //   return;
  // }

  // each = async (post) => {
  //   const { title, content, forum_url } = post;
  //   await this.driver.get(forum_url);
  
  //   await this.driver.findElement(By.className("callToAction")).click();
  //   await this.driver.wait(until.elementLocated(By.id("pageDescription")), 5000);

  //   await this.driver.switchTo().defaultContent();
  //   await this.driver.switchTo().frame(0);
  //   await this.driver.executeScript(`document.querySelector("body").innerHTML = '${content.replace(/(\r\n|\n|\r)/gm, "")}'`);
  //   await this.driver.switchTo().defaultContent(); 
  //   await this.driver.actions({ bridge: false }).keyDown("A").keyUp("A").keyDown(Key.BACK_SPACE).keyUp(Key.BACK_SPACE).perform();


  //   await this.driver.findElement(By.name("title")).sendKeys(title, Key.TAB);

  //   if (!post.is_demo) {
  //     // await this.driver.findElement(By.css(`input[value='Đăng chủ đề']`)).click();
  //   } else {
  //     // await this.sleep(30000)
  //   }
  // }

  // getForums = async (urls = []) => {
  //   if (!urls.length) {
  //     return [];
  //   }
  //   const communities = [];
  //   await this.init();
  //   for (let i = 0; i < urls.length; i++) {
  //     await this.driver.get(urls[i]);
  //     const elements = await this.driver.findElements(By.css(".breadBoxTop nav .breadcrumb .crumbs .crust a"));
  //     const element = elements[elements.length - 1];
  //     communities.push({
  //       post_url: urls[i],
  //       web_url: this.url,
  //       web_key: this.key,
  //       forum_name: await element.getText(),
  //       forum_url: await element.getAttribute("href")
  //     })
  //   }
  //   await this.close();
  //   return communities;
  // }

  // syncForums = async () => {
  //   const getSubForums = async (nodes = [], forums = []) => {
  //     if (!this.driver) {
  //       await this.login();
  //     }
  //     if (!nodes.length) {
  //       await this.driver.get(`${this.url}/forum/`);
  //     } else {
  //       await this.driver.get(nodes[nodes.length - 1].forum_url);
  //     }

  //     const buttonDangBai = await this.driver.findElements(By.className("callToAction"));
  //     if (buttonDangBai.length) {
  //       forums.push(nodes[nodes.length - 1]);
  //     }

  //     nodes.splice(nodes.length - 1, 1);

  //     const nodeList = await this.driver.findElements(By.css("li.forum div.nodeText h3.nodeTitle a"));
  //     if (nodeList.length) {
  //       for (let i = 0; i < nodeList.length; i++) {
  //         nodes.push({
  //           forum_url: await nodeList[i].getAttribute("href"),
  //           forum_name: await nodeList[i].getText()
  //         })
  //       }
  //     }

  //     if (!nodes.length) {
  //       return forums;
  //     }
  //     return getSubForums(nodes, forums)
  //   }

  //   const forums = await getSubForums();
  //   await this.close();
  //   return forums;
  // }

}

module.exports = LamChaMe;