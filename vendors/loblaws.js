import {
  convertToJson,
  createPageWithTimeout,
  getWinningSelector,
} from '../browserUtils.js';

import {
  DEFAULT_TIMEOUT,
  USER_AGENT,
  NO_PRODUCTS_FOUND,
  MSG_CREATE_PAGE_FAILURE,
  MSG_COULD_NOT_FIND_SELECTORS,
} from '../config.js';

import { createNewProductData } from '../commonData.js';

export async function processLoblawsGroupData(page, endpoint, site, browser) {

  const results = {
    errorMsg: undefined,
    jsonData: undefined
  };

  page = await createPageWithTimeout(DEFAULT_TIMEOUT, endpoint, browser, USER_AGENT);
  if (page === undefined) {
    const data = createNewProductData(MSG_CREATE_PAGE_FAILURE, '', '');
    const jsonData = convertToJson([data]);
    results.errorMsg = MSG_CREATE_PAGE_FAILURE;
    results.jsonData = jsonData;
    return results;
  }

  //Beginning of Vendor specific cleaning
  //each product belongs to this class
  const productSelector = '[class="product-tile-group__list__item"]';
  const noResultsSelector = '[class*="-no-results__section-title"]';

  const selector = await getWinningSelector([productSelector, noResultsSelector], page);
  if (selector === undefined) {
    const data = createNewProductData(MSG_COULD_NOT_FIND_SELECTORS, '', '');
    const jsonData = convertToJson([data]);
    results.errorMsg = MSG_COULD_NOT_FIND_SELECTORS;
    results.jsonData = jsonData;
    return results;
  }

  //if the winning selector is a no result, exit function but return 200 and empty deck.
  if (selector == noResultsSelector) {
    results.errorMsg = NO_PRODUCTS_FOUND;
    return results;
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

    // Remove \n char and trim.
    const brandElementNoNewLines = brandElement.replace(/\n/g, '').trim();
    const titleElementNoNewLines = titleElement.replace(/\n/g, '').trim();

    const data = createNewProductData(brandElementNoNewLines + " " + titleElementNoNewLines, priceElement, productLink);
    collectedData.push(data);
  }

  //convert to JSON string and trim()
  const jsonData = convertToJson(collectedData);

  await page.close();

  results.jsonData = jsonData;

  return results;
}