import puppeteer from "puppeteer";
import {
  DEFAULT_SEARCH_TIMEOUT,
} from './config.js';

export async function createPageWithTimeout(timeout, endpoint, inputBrowser, userAgent, res) {

  //another way to be fancy is to connect to BrightData (not free)
  //BrightData allows use to use rotating proxies to evade bot detection
  //see tutorial here - https://www.youtube.com/watch?v=qo_fUjb02ns&t=1s&ab_channel=BeyondFireship
  //To connect to BrightData:
  //USERNAME-ZONE:PASSWORD (format if we want to use BrightData proxy services)

  // const auth = 'USERNAME-ZONE:PASSWORD';
  // browser = await puppeteer.connect({
  //     //browser web socket endpoint
  //     browserWSEndpoint: `wss://${auth}@location_of_proxy:port`
  // });

  try {
    let browser = inputBrowser;

    //in case it's closed for whatever reason
    if (browser === null || browser === undefined || !browser.isConnected()) {
      browser = await createNewBrowser();
    }

    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    page.setDefaultNavigationTimeout(timeout);
    await page.goto(endpoint);
    return page;
  } catch (error) {
    console.error('Error in: createPageWithTimeout(...)', error);
    return;
  }

}

export async function createNewBrowser() {
  const browser = await puppeteer.launch({
    headless: 'new',
    //args: ['--proxy-server=192.241.189.47:31028']
  });
  return browser;
}

  //This will race each selector and  the one with the fastest result
  //will be one returned.  Each selector has a race against a setTimeout,
  //hence the 2nd Promise.race().
  export async function getWinningSelector(selectors, page) {
    try {

      const winningSelector = await Promise.race(
        selectors.map(selector => {
          // For each selector in the array, we create a new Promise
          return Promise.race([
            // We use Promise.race() to race two promises:
            page.waitForSelector(selector),  // 1. Wait for the selector to appear on the page
            new Promise((_, reject) => setTimeout(reject, DEFAULT_SEARCH_TIMEOUT))  // 2. Create a timeout promise
          ]).then(() => selector);
          // If either promise resolves, we extract the corresponding selector value
        })
      );

      return winningSelector;
      // Once the race is settled and we have the winning selector, we return it from the function
    } catch (error) {
      console.log(error + ": " + "Could not find any selectors");
    }
  }

export function convertToJson(collectedData) {

  if (!collectedData || collectedData === null) {
    return JSON.stringify([{}]);
  }

  //Remove duplicates of collectedData
  const uniqueArray = collectedData.filter((obj, index, self) => {
    // Compare objects based on a unique identifier or specific properties
    // For example, if your objects have an 'id' property:
    return index === self.findIndex((o) => o.title === obj.title);
  });
  uniqueArray.sort((a, b) => (a.price - b.price));
  let jsonData = JSON.stringify(uniqueArray, null, 2);
  jsonData = jsonData.trim();
  return jsonData;
}