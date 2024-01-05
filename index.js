import express from 'express';
import rateLimit from 'express-rate-limit';
import { convertToJson, createNewBrowser, createPageWithTimeout } from './browserUtils.js';
import { createNewProductData } from './commonData.js';
import cors from 'cors';
import {
  DEFAULT_LIMITER_WINDOWMS,
  DEFAULT_LIMITER_MAX_REQUESTS,
  MSG_EXCEEDED_REQUESTS,
  GENERIC_API_ERROR,
  NO_PRODUCTS_FOUND,
  TIME_OUT_ERROR_NAME,
  TIMEOUT_MSG
} from './config.js';

// Vendor specific logic
import {
  processLoblawsGroupData
} from './vendors/loblaws.js';

import {
  processJimPattisonFoodGroupData
} from './vendors/jim_pattison.js';

const LIMITER = rateLimit({
  windowMs: DEFAULT_LIMITER_WINDOWMS,
  max: DEFAULT_LIMITER_MAX_REQUESTS,
  message: MSG_EXCEEDED_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false
});

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
      const results = await processJimPattisonFoodGroupData(page, endpoint, BROWSER);

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
      const results = await processJimPattisonFoodGroupData(page, endpoint, BROWSER);

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
      const results = await processLoblawsGroupData(page, endpoint, site, BROWSER);

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
      const results = await processLoblawsGroupData(page, endpoint, site, BROWSER);

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
      const results = await processLoblawsGroupData(page, endpoint, site, BROWSER);

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


  app.get('/helloWorld', async (_req, res) => {
    res.json('Hello World!  🤩');
  });

  return {
    app,
    closeBrowser,
    processLoblawsGroupData,
    processJimPattisonFoodGroupData
  };
};