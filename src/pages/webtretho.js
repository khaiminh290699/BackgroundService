const { Builder, By, until, Key } = require("selenium-webdriver");
const { default: axios } = require("axios");
const chrome = require("selenium-webdriver/chrome");
const { ModelProgressing, ModelPostingStatus, Model } = require("../db");
const moment = require("moment");
const Page = require("./page");

require("chromedriver");

class WebTreTho extends Page {
  // constructor(username, password) {
  //   super();
  //   this.username = username || "minhne2906";
  //   this.password = password || "khaiminh2906";
  // };

  url = "https://www.webtretho.com";
  key = "web_tre_tho";

  // login = async (username, password) => {
  //   if (!this.driver) {
  //     await this.init();
  //   }
  //   await this.driver.get(`${this.url}/dang-nhap`)
  //   const form = await this.driver.findElement(By.className("form-auth"));
  //   await form.findElement(By.name("login")).sendKeys(username || this.username);
  //   await form.findElement(By.name("password")).sendKeys(password || this.password);
  //   await form.findElement(By.xpath("//button[text()='Đăng nhập']")).click();
  //   return;
  // }

  // logout = async () => {
  //   if (!this.driver) {
  //     await this.init();
  //   }
  //   await this.driver.findElement(By.css(`div.avatar-info div.user-name`)).click();
  //   await this.sleep(1000);
  //   await this.driver.findElement(By.css("div.dropdow-menu-desktop div.nav-item:last-child")).click();
  //   return;
  // }

  // each = async (post) => {
  //   const { title, content, forum_url } = post;
  //   await this.driver.get(forum_url);
  //   await this.driver.findElement(By.className("btn-create-post")).click();

  //   await this.driver.wait(until.urlContains("/tao-bai-viet"))
  //   const titleInput = await this.driver.wait(until.elementLocated(By.name("title"))); 

  //   await this.driver.wait(until.ableToSwitchToFrame(0));
  //   await this.sleep(1000);

  //   await this.driver.switchTo().defaultContent();
  //   await this.driver.switchTo().frame(0);


  //   await this.driver.executeScript(`document.querySelector("body").innerHTML = '${content.replace(/(\r\n|\n|\r)/gm, "")}'`);
  //   await this.driver.switchTo().defaultContent(); 

  //   await titleInput.sendKeys(title, Key.TAB);
  //   await this.sleep(500);
  //   await this.driver.actions({ bridge: false }).keyDown("A").keyUp("A").keyDown(Key.BACK_SPACE).keyUp(Key.BACK_SPACE).perform();

  //   if (!post.is_demo) {
  //     // await this.driver.findElement(By.xpath(`//button[contains(text(), "Đăng bài")]`)).click();
  //   } else {
  //     await this.sleep(30000);
  //   }
  // }

  // getForums = async (urls = []) => {
  //   if (!urls.length) {
  //     return [];z
  //   }
  //   await this.init();
  //   const communities = [];
  //   for (let i = 0; i < urls.length; i++) {
  //     await this.driver.get(urls[i]);
  //     const communityElement = await this.driver.findElement(By.css("a.w-desc-180x"))
  //     communities.push({
  //       post_url: urls[i],
  //       web_url: this.url,
  //       web_key: this.key,
  //       forum_name: await communityElement.getText(),
  //       forum_url: await communityElement.getAttribute("href")
  //     })
  //   }
  //   await this.close();
  //   return communities;
  // }

  // syncForums = async () => {
  //   const api = async (page, limit = 50) => {
  //     const { data: { data: { searchCommunities } } } = await axios.post(`${this.url}/api`, {
  //       variables: null,
  //       query: `query { searchCommunities (where: {isInternal: false, isPrivate: false, isApproved: true, isHidden: false, isDeleted: false, }, limit: ${limit}, offset: ${limit * (page - 1)} , order: \"participantCount DESC\") {   id   name   slug   about } }`
  //     })

  //     return searchCommunities;
  //   }

  //   let i = 1;
  //   const forums = [];
  //   while (true) {
  //     const data = await api(i);

  //     forums.push(...data.map((forum) => {
  //       const { name, slug } = forum;
  //       return {
  //         forum_name: name,
  //         forum_url: `${this.url}/f/${slug}`,
  //       }
  //     }));
      
  //     if (!data.length) {
  //       return forums;
  //     }

  //     i += 1;
  //   }

  // }

}

module.exports = WebTreTho