const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

require("chromedriver");

class ChaMeNuoiCon {
  url = `https://diendan.chamenuoicon.com`;

  constructor(username, password) {
    this.username = username || "KHAIMINH";
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

  login = async () => {
    if (!this.driver) {
      await this.init();
    }
    await this.driver.get(`${this.url}/login/`)
    await this.driver.findElement(By.name("login")).sendKeys(this.username);
    await this.driver.findElement(By.name("password")).sendKeys(this.password);
    await this.driver.findElement(By.className("button--icon--login")).click();
    try {
      await this.driver.wait(until.urlIs(`${this.url}/`), 10000);
    } catch (err) {
      throw Error("Login fail");
    }
    return;
  }

  post = async (post) => {
    const { title, comunity, content } = post;
    await this.login();
    await this.driver.get(`${this.url}/forums/-/post-thread`);
    await this.driver.wait(until.elementLocated(By.className("contentRow-main")), 5000);
    const comunityDiv = await this.driver.findElements(By.className("contentRow-main"));
    let i = 0
    for (; i < comunityDiv.length; i++) {
      const text = await comunityDiv[i].getText();
      if (text.includes(comunity)) {
        break;
      }
    }

    const href = await comunityDiv[i].findElement(By.tagName("a")).getAttribute("href");
    await this.driver.get(href);

    await this.driver.findElement(By.name("title")).sendKeys(title, Key.TAB);
    await this.driver.executeScript(`document.querySelector(".fr-element").innerHTML = "${content}"`);
    await this.driver.actions({ bridge: false }).keyDown("A").keyUp("A").keyDown(Key.BACK_SPACE).keyUp(Key.BACK_SPACE).perform();

    await this.driver.findElement(By.className("button--icon--write")).click();
  }

  close = async () => {
    if (this.driver) {
      await this.driver.close();
    }
  }
  
  community = async (urls = []) => {
    if (!urls.length) {
      return [];
    }
    await this.init();
    const communities = [];
    for (let i = 0; i < urls.length; i++) {
      await this.driver.get(urls[i]);
      const elements = await this.driver.findElements(By.css(".p-breadcrumbs--bottom li a"));
      const element = elements[elements.length - 1];
      communities.push({
        post_url: urls[i],
        web_url: this.url,
        community: await element.findElement(By.tagName("span")).getText(),
        href: await element.getAttribute("href")
      })
    }
    await this.close();
    return communities;
  }
}

module.exports = ChaMeNuoiCon;