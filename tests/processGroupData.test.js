import { initApp } from '../index.js';
import {
  TESTING_PORT
} from '../config.js';
import path from 'path';

describe('Testing Process Group Data', () => {

  // instance returned from listening on the app
  let listener;

  // app exported from index.js
  let appInstance;

  // function to close puppeteer browser from index.js
  let closeBrowserInstance;

  // scraper logic for loblaws food group
  let loblawsGroupData;

  beforeAll(async () => {
    const { app, closeBrowser, processLoblawsGroupData } = await initApp();
    appInstance = app;
    closeBrowserInstance = closeBrowser;
    listener = appInstance.listen(TESTING_PORT);
    loblawsGroupData = processLoblawsGroupData;
  });

  afterAll(async () => {
    await closeBrowserInstance();
    listener.close();
  });


  test('processLoblawsGroupData should return product array related to Pillsbury', async () => {

    // call processLoblawsGroupData
    // endpoint is the physical HTML file saved on file
    // page is an undefined variable (will be defined in createPageWithTimeout)
    // site is the root website. (ex: https://www.superstore.ca)

    let page = undefined;

    const currentFileUrl = new URL(import.meta.url);
    const directoryPath = path.dirname(currentFileUrl.pathname);
    const endpoint = `file://${directoryPath}/pages/loblaws_group.html`;

    const site = 'https://www.example.com';
    const results = await loblawsGroupData(page, endpoint, site);
    let jsonData = JSON.parse(results.jsonData);

    // 3 products total
    expect(jsonData.length).toBe(3);

    const firstProduct = jsonData[0];
    const secondProduct = jsonData[1];
    const thirdProduct = jsonData[2];

    // test the title, price and link of one of the products
    // note: the results should also be sorted by price, thats why we see 4.49 as the 2nd item and not the 1st. (3.49, 4.49, 5.49)
    expect(firstProduct.title).toBe('Pillsbury Pizza Pockets Pepperoni');
    expect(firstProduct.price).toBe(3.49);
    expect(firstProduct.link).toBe(`${site}/pepperoni`)

    expect(secondProduct.title).toBe('Pillsbury Pizza Pockets 4 Cheese');
    expect(secondProduct.price).toBe(4.49);
    expect(secondProduct.link).toBe(`${site}/4cheese`)

    expect(thirdProduct.title).toBe('Pillsbury Pizza Pockets Supreme Deluxe');
    expect(thirdProduct.price).toBe(5.49);
    expect(thirdProduct.link).toBe(`${site}/deluxe`)
  });

  test('processJimPattisonFoodGroupData should return product array related to Pillsbury', async () => {
    // TODO
  });
});