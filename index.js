import puppeteer from "puppeteer";
import express from 'express';
import rateLimit from 'express-rate-limit';
import { convertToJson, createNewBrowser, createPageWithTimeout } from './browserUtils.js';
import { createNewProductData } from './commonData.js';
import cors from 'cors';
import {
  DEFAULT_SEARCH_TIMEOUT,
  DEFAULT_TIMEOUT,
  DEFAULT_LIMITER_WINDOWMS,
  DEFAULT_LIMITER_MAX_REQUESTS,
  MSG_EXCEEDED_REQUESTS
} from './config.js';

const LIMITER = rateLimit({
  windowMs: DEFAULT_LIMITER_WINDOWMS,
  max: DEFAULT_LIMITER_MAX_REQUESTS,
  message: MSG_EXCEEDED_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false
});
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36';
const GENERIC_API_ERROR = 'There was an error trying to process this API call';
const NO_PRODUCTS_FOUND = 'No Products Found.';
const TIME_OUT_ERROR_NAME = 'TimeoutError';
const TIMEOUT_MSG = 'Timeout Error.';


export async function initApp() {
  const app = express();

  //this must be before the API code below
  app.use(LIMITER);

  //https://stackoverflow.com/questions/61238680/access-to-fetch-at-from-origin-http-localhost3000-has-been-blocked-by-cors
  app.use(cors());

  //create a new browser and try to reuse it for all endpoints
  let BROWSER = await createNewBrowser();

  app.get('/closeBrowser', async (_req, res) => {
    const result = closeBrowser();
    if (result) {
      res.status(200).send();
      return;
    }

    // error
    res.status(500).send();
  });

  async function closeBrowser() {
    try {
      //in case it's closed for whatever reason
      if (BROWSER !== null && BROWSER !== undefined && BROWSER.isConnected()) {
        await BROWSER?.close();
        return true;
      }
    } catch (e) {
      console.error('Could not close the browser connection', e);
      return false;
    }
  }

  async function processLoblawsGroupData(page, endpoint, site) {

    const results = {
      errorMsg: undefined,
      jsonData: undefined
    };

    page = await createPageWithTimeout(DEFAULT_TIMEOUT, endpoint, BROWSER, USER_AGENT);
    if (page === undefined) {
      const data = createNewProductData('Failed to create page from Puppeteer.  Check/rotate proxy or use localhost.', '', '');
      const jsonData = convertToJson([data]);
      // res.type('application/json').send(jsonData).status(500);

      // TODO duplpicated str, move to config or const file
      results.errorMsg = 'Failed to create page from Puppeteer.  Check/rotate proxy or use localhost.';
      results.jsonData = jsonData;
      return results;
    }

    //Beginning of Vendor specific cleaning
    //each product belongs to this class
    const productSelector = '[class="product-tile-group__list__item"]';
    const noResultsSelector = '[class*="-no-results__section-title"]';

    const selector = await getWinningSelector([productSelector, noResultsSelector], page);
    if (selector === undefined) {
      const data = createNewProductData('Could not find any selectors.  Puppeteer page exceeded timeout.', '', '');
      const jsonData = convertToJson([data]);
      // res.type('application/json').send(jsonData).status(500);

      // TODO duplpicated str, move to config or const file
      results.errorMsg = 'Could not find any selectors.  Puppeteer page exceeded timeout.';
      results.jsonData = jsonData;
      return results;
    }

    //if the winning selector is a no result, exit function but return 200 and empty deck.
    if (selector == noResultsSelector) {

      // TODO this will have to be done from the caller
      // respondOkWithMsg(NO_PRODUCTS_FOUND, "404", res);

      results.errorMsg = NO_PRODUCTS_FOUND;
      return results; //will run the finally block
    }

    //await page.waitForSelector(selector, { timeout: DEFAULT_SEARCH_TIMEOUT });
    const elements = await page.$$(selector);

    const collectedData = [];
    for (const element of elements) {

      //check for the textContent of the sponsored.  if it's 'Sponsored', then we skip this product (an ad)
      const badgeElement = await page.evaluate(element => {
        const badgeElement = element.querySelector('.product-badge__text.product-badge__text--product-tile');
        return (badgeElement !== undefined && badgeElement !== null) ? badgeElement.textContent : '';
      }, element);

      //if the badge null/undefined or ""
      if ((badgeElement || '').trim().length !== 0) {
        if (badgeElement == "Sponsored") {
          continue;
        }
      }

      //Query for the price of the product
      const priceElement = await page.evaluate(element => {
        const priceElement = element.querySelector('.price__value.selling-price-list__item__price.selling-price-list__item__price--now-price__value');
        return (priceElement !== undefined && priceElement !== null) ? priceElement.textContent : '';
      }, element);

      //Query for the 'brand' of the product
      const brandElement = await page.evaluate(element => {
        const brandElement = element.querySelector('.product-name__item.product-name__item--brand');
        return (brandElement !== undefined && brandElement !== null) ? brandElement.textContent : '';
      }, element);

      //Query for the 'title' of the product
      const titleElement = await page.evaluate(element => {
        const titleElement = element.querySelector('.product-name__item.product-name__item--name');
        const title = (titleElement !== undefined && titleElement !== null) ? titleElement.getAttribute('title') : '';
        return title;
      }, element);

      //Query link to the actual store item
      const partialLink = await page.evaluate(element => {
        const hyperlinkParentElement = element.querySelector('.product-tile__details__info__name__link');
        const hyperlink = (hyperlinkParentElement !== undefined && hyperlinkParentElement !== null) ? hyperlinkParentElement.getAttribute("href") : '';
        return hyperlink;
      }, element);

      const productLink = site + partialLink;

      // TODO do this for other process
      const brandElementNoNewLines = brandElement.replace(/\n/g,'').trim();
      const titleElementNoNewLines = titleElement.replace(/\n/g,'').trim();

      const data = createNewProductData(brandElementNoNewLines + " " + titleElementNoNewLines, priceElement, productLink);
      collectedData.push(data);
    }

    //convert to JSON string and trim()
    const jsonData = convertToJson(collectedData);

    // TODO test
    await page.close();

    // res.type('application/json').send(jsonData).status(200);

    results.jsonData = jsonData;

    return results;
  }

  // TODO look at processLoblawsGroupData and refactor to return an object
  async function processJimPattisonFoodGroupData(page, endpoint, res) {
    page = await createPageWithTimeout(DEFAULT_TIMEOUT, endpoint, BROWSER, USER_AGENT, res);
    if (page === undefined) {
      const data = createNewProductData('Failed to create page from Puppeteer.  Check/rotate proxy or use localhost.', '', '');
      const jsonData = convertToJson([data]);
      res.type('application/json').send(jsonData).status(500);
      return;
    }

    //Beginning of Vendor specific cleaning
    //each product belongs to this class
    const selector = '[class*="ProductCardWrapper"]';
    const noResultsSelector = '[class^="EmptyTitle-"]';
    const winningSelector = await getWinningSelector([selector, noResultsSelector], page);

    if (winningSelector === undefined) {
      const data = createNewProductData('Could not find any selectors.  Puppeteer page exceeded timeout.', '', '');
      const jsonData = convertToJson([data]);
      res.type('application/json').send(jsonData).status(500);
      return;
    }

    //if the winning selector is a no result, exit function but return 200 and empty deck.
    if (winningSelector == noResultsSelector) {
      respondOkWithMsg(NO_PRODUCTS_FOUND, "404", res);
      return; //will run the finally block
    }

    //await page.waitForSelector(winningSelector, { timeout: DEFAULT_SEARCH_TIMEOUT });
    const elements = await page.$$(winningSelector);

    const collectedData = [];

    for (const element of elements) {
      //Old way - keeping for notes!  We need to get the text content of the product, but we can't just do element.textContent directly
      //because this will return the textnode and it's children. (one of the child contains text 'open product description').
      //Filter out the children's text (set to ''), and then finally query the textnode by itself.  QuerySelectorAll does not
      //include text nodes, only child elements (which is why the actual product title is safe).
      // const titleElement = await page.evaluate(input => {
      //     const element = input.querySelector('[data-testid$="-ProductNameTestId"]');
      //     const children = element.querySelectorAll('*');
      //     children.forEach(child => {
      //         child.textContent = '';
      //     });
      //     return element.textContent;
      // }, element);

      //New way - query the div that contains the text and then just get the first child
      const titleElement = await page.evaluate((inputElement, productNameTestIdSelector) => {
        const targetElement = inputElement.querySelector(productNameTestIdSelector);
        return targetElement ? targetElement.firstChild.textContent : '';
      }, element, '[data-testid$="-ProductNameTestId"]');

      //Get link to the actual store item
      const hyperlinkElement = await page.evaluate(element => {
        const hyperlinkElement = element.querySelector('[class^="ProductCardHiddenLink"]');
        const hyperlink = (hyperlinkElement !== undefined && hyperlinkElement !== null) ? hyperlinkElement.getAttribute("href") : '';
        return hyperlink;
      }, element);

      //Queries the price of this product
      const priceElement = await page.evaluate(input => input.querySelector('[class^="ProductCardPrice--"]').textContent, element);
      const data = createNewProductData(titleElement, priceElement, hyperlinkElement);
      collectedData.push(data);
    }

    //convert to JSON string and trim()
    const jsonData = convertToJson(collectedData);

    // TODO test
    await page.close();

    res.type('application/json').send(jsonData).status(200);
  }

  /**
   * Get Save-on-Foods Data.
   * @route GET /GetSaveOnFoodsData
   * @summary Loads the search results web page from Save-on-Foods with the search parameters, filters the data, and returns it as a JSON.   The vendor specific
   * code, atm, belongs to the Jim Pattison Food group.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {object} The response containing the JSON data from Save-on-Foods.
   * @throws {Error} If there is an error retrieving the data.
   */
  app.get('/GetSaveOnFoodsData', async (req, res) => {
    let page;
    const searchStr = encodeURI(req.query.search); //<--'search'  is the attribute (strange how it doesnt take a string value instead)
    const endpoint = `https://www.saveonfoods.com/sm/pickup/rsid/2287/results?q=${searchStr}&take=30&sort=price`;
    try {
      processJimPattisonFoodGroupData(page, endpoint, res);
    } catch (e) {
      //timeout error from Wait for selector
      if (e.name === TIME_OUT_ERROR_NAME) {
        respondOkWithMsg(res, TIMEOUT_MSG, '');
      }
      else {
        res.status(500).json({ error: GENERIC_API_ERROR });
      }
    } finally {
      // Close the page
      await page?.close();
    }
  });

  /**
   * Get Pricesmart Data.
   * @route GET /GetPricesmartData
   * @summary Loads the search results web page from Pricesmart with the search parameters, filters the data, and returns it as a JSON.  The vendor specific
   * code, atm, belongs to the Jim Pattison Food group.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {object} The response containing the JSON data from Pricesmart.
   * @throws {Error} If there is an error retrieving the data.
   */
  app.get('/GetPricesmartData', async (req, res) => {
    let page;
    const searchStr = encodeURI(req.query.search);
    const endpoint = `https://www.pricesmartfoods.com/sm/pickup/rsid/2274/results?q=${searchStr}&take=30&sort=price`;
    try {
      processJimPattisonFoodGroupData(page, endpoint, res);
    }
    catch (e) {
      //timeout error from Wait for selector
      if (e.name === TIME_OUT_ERROR_NAME) {
        respondOkWithMsg(res, TIMEOUT_MSG, '');
      }
      else {
        res.status(500).json({ error: GENERIC_API_ERROR });
      }
    } finally {
      // Close the page
      await page?.close();
    }
  });

  /**
   * Get Superstore Data.
   * @route GET /GetSuperstoreData
   * @summary Loads the search results web page from superstore with the search parameters, filters the data, and returns it as a JSON.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {object} The response containing the JSON data from Superstore.
   * @throws {Error} If there is an error retrieving the data.
   */
  app.get('/GetSuperstoreData', async (req, res) => {
    let page;
    const searchStr = encodeURI(req.query.search);
    const endpoint = `https://www.realcanadiansuperstore.ca/search?search-bar=${searchStr}&sort=price-asc`;
    const site = 'https://www.realcanadiansuperstore.ca';
    try {
      const results = await processLoblawsGroupData(page, endpoint, site);

      if (results.errorMsg === NO_PRODUCTS_FOUND) {
        respondOkWithMsg(NO_PRODUCTS_FOUND, "404", res);
        return;
      }

      // for any other errors
      if (results.errorMsg !== undefined) {
        res.type('application/json').send(results.jsonData).status(500);
        return;
      }

      // no errors here, return results
      res.type('application/json').send(results.jsonData).status(200);
    }
    catch (e) {
      //timeout error from Wait for selector
      if (e.name === TIME_OUT_ERROR_NAME) {
        respondOkWithMsg(res, TIMEOUT_MSG, '');
      }
      else {
        res.status(500).json({ error: GENERIC_API_ERROR });
      }

    } finally {
      // Close the page
      await page?.close();
    }
  });

  /**
   * Get NoFrills Data.
   * @route GET /GetNoFrillsData
   * @summary Loads the search results web page from No Frills with the search parameters, filters the data, and returns it as a JSON.  The vendor specific
   * code, atm, is exactly like Superstore (Loblaws group).
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {object} The response containing the JSON data from No Frills.
   * @throws {Error} If there is an error retrieving the data.
   */
  app.get('/GetNoFrillsData', async (req, res) => {
    let page;
    const searchStr = encodeURI(req.query.search);
    const endpoint = `https://www.nofrills.ca/search?search-bar=${searchStr}&sort=price-asc`;
    const site = 'https://www.nofrills.ca';
    try {
      const results = await processLoblawsGroupData(page, endpoint, site);

      if (results.errorMsg === NO_PRODUCTS_FOUND) {
        respondOkWithMsg(NO_PRODUCTS_FOUND, "404", res);
        return;
      }

      // for any other errors
      if (results.errorMsg !== undefined) {
        res.type('application/json').send(results.jsonData).status(500);
        return;
      }

      // no errors here, return results
      res.type('application/json').send(results.jsonData).status(200);
    }
    catch (e) {
      //timeout error from Wait for selector
      if (e.name === TIME_OUT_ERROR_NAME) {
        respondOkWithMsg(res, TIMEOUT_MSG, '');
      }
      else {
        res.status(500).json({ error: GENERIC_API_ERROR });
      }
    } finally {
      // Close the page
      await page?.close();
    }
  });

  /**
   * Get Your Independent Grocer Data.  Not used at the moment, for some reason the page.waitForSelector is incredibly slow
   * @route GET /GetYourIndependentGrocerData
   * @summary Loads the search results web page from Your Independent Grocer Data with the search parameters, filters the data, and returns it as a JSON.  The vendor specific
   * code, atm, is exactly like Superstore (Loblaws group).
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {object} The response containing the JSON data from Your Independent Grocer Data.
   * @throws {Error} If there is an error retrieving the data.
   */
  app.get('/GetYourIndependentGrocerData', async (req, res) => {
    let page;
    const searchStr = encodeURI(req.query.search);
    const endpoint = `https://www.yourindependentgrocer.ca/search?search-bar=${searchStr}&sort=price-asc`;
    const site = 'https://yourindependentgrocer.ca';
    try {
      const results = await processLoblawsGroupData(page, endpoint, site);

      if (results.errorMsg === NO_PRODUCTS_FOUND) {
        respondOkWithMsg(NO_PRODUCTS_FOUND, "404", res);
        return;
      }

      // for any other errors
      if (results.errorMsg !== undefined) {
        res.type('application/json').send(results.jsonData).status(500);
        return;
      }

      // no errors here, return results
      res.type('application/json').send(results.jsonData).status(200);
    }
    catch (e) {
      //timeout error from Wait for selector
      if (e.name === TIME_OUT_ERROR_NAME) {
        respondOkWithMsg(res, TIMEOUT_MSG, '');
      }
      else {
        res.status(500).json({ error: GENERIC_API_ERROR });
      }
    } finally {
      // Close the page
      await page?.close();
    }
  });

  async function respondOkWithMsg(msg, numberMsg, res) {
    const data = createNewProductData(msg, numberMsg, '');
    const jsonData = convertToJson([data]);
    res.type('application/json').send(jsonData).status(200);
  }

  //This will race each selector and  the one with the fastest result
  //will be one returned.  Each selector has a race against a setTimeout,
  //hence the 2nd Promise.race().
  async function getWinningSelector(selectors, page) {
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

  app.get('/helloWorld', async (_req, res) => {
    res.json('Hello World!  🤩');
  });

  return {
    app,
    closeBrowser,
    processLoblawsGroupData
  };
};