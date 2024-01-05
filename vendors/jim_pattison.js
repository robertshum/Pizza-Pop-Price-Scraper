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

export async function processJimPattisonFoodGroupData(page, endpoint, browser) {

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
  const selector = '[class*="ProductCardWrapper"]';
  const noResultsSelector = '[class^="EmptyTitle-"]';
  const winningSelector = await getWinningSelector([selector, noResultsSelector], page);

  if (winningSelector === undefined) {
    const data = createNewProductData(MSG_COULD_NOT_FIND_SELECTORS, '', '');
    const jsonData = convertToJson([data]);

    results.errorMsg = MSG_COULD_NOT_FIND_SELECTORS;
    results.jsonData = jsonData;
    return results;
  }

  //if the winning selector is a no result, exit function but return 200 and empty deck.
  if (winningSelector == noResultsSelector) {
    results.errorMsg = NO_PRODUCTS_FOUND;
    return results;
  }

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

    // Remove \n char and trim.
    const titleElementNoNewLines = titleElement.replace(/\n/g, '').trim();

    const data = createNewProductData(titleElementNoNewLines, priceElement, hyperlinkElement);
    collectedData.push(data);
  }

  //convert to JSON string and trim()
  const jsonData = convertToJson(collectedData);

  await page.close();

  results.jsonData = jsonData;

  return results;
}