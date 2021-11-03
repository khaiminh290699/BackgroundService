const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const Page = require("./page");

require("chromedriver");

class ChaMeNuoiCon extends Page {
  key = "cha_me_nuoi_con"
  url = `https://diendan.chamenuoicon.com`;

  constructor(username, password) {
    super();
    this.username = username || "KHAIMINH";
    this.password = password || "khaiminh2906";
  };

  login = async (username, password) => {
    if (!this.driver) {
      await this.init();
    }
    await this.driver.get(`${this.url}/login/`)
    await this.driver.findElement(By.name("login")).sendKeys(username);
    await this.driver.findElement(By.name("password")).sendKeys(password);
    await this.driver.findElement(By.className("button--icon--login")).click();
    try {
      await this.driver.wait(until.urlIs(`${this.url}/`), 10000);
    } catch (err) {
      throw Error("Login fail");
    }
    return;
  }

  logout = async () => {
    const navItems = await this.driver.findElement(By.className("p-navgroup-linkText"));
    await navItems[0].click();
    const logout = await this.driver.wait(until.elementLocated(By.xpath("//a[text()='Thoát']")), 5000);
    await logout.click();
  }

  each = async (post) => {
    const { title, content, forum_url } = post;

    await this.driver.get(forum_url);

    const titleInput = await this.driver.wait(until.elementLocated(By.name("title"))); 

    await titleInput.sendKeys(title, Key.TAB);
    await this.sleep(1000);

    await this.driver.executeScript(`document.querySelector(".fr-element").innerHTML = '${content.replace(/(\r\n|\n|\r)/gm, "")}'`);
    await this.driver.actions({ bridge: false }).keyDown("A").keyUp("A").keyDown(Key.BACK_SPACE).keyUp(Key.BACK_SPACE).perform();

    if (!post.is_demo) {
      // await this.driver.findElement(By.className("button--icon--write")).click();
    } else {
      // await this.sleep(30000);
    }
  }

  getForums = async (urls = []) => {
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
        web_key: this.key,
        forum_name: await element.findElement(By.tagName("span")).getText(),
        forum_url: await element.getAttribute("href")
      })
    }
    await this.close();
    return communities;
  }

  syncForums = async () => {
    if (!this.driver) {
      await this.init();
    }
    const forums = [];
    await this.login(this.username, this.password);
    await this.driver.get(this.url);
    await this.driver.findElement(By.className("p-title-pageAction")).click();

    const links = await this.driver.wait(until.elementsLocated(By.className("fauxBlockLink-blockLink")));
    for (let i = 0; i < links.length; i++) {
      forums.push({
        forum_url: await links[i].getAttribute("href"),
        forum_name: await links[i].getText()
      })
    }
    await this.close();
    return forums;
  }
}

module.exports = ChaMeNuoiCon;