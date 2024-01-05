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

  // scraper logic for loblaws food group
  let loblawsGroupData;

  // scraper logic for jim pattison food group
  let jimPattisonFoodGroupData;

  let testBrowser;

  beforeAll(async () => {
    const { app,
      processLoblawsGroupData,
      processJimPattisonFoodGroupData,
      browser } = await initApp();
    appInstance = app;
    listener = appInstance.listen(TESTING_PORT);
    loblawsGroupData = processLoblawsGroupData;
    jimPattisonFoodGroupData = processJimPattisonFoodGroupData;
    testBrowser = browser;
  });

  afterAll(async () => {
    await testBrowser?.close();
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

    const site = 'https://www.superstore.com';
    const results = await loblawsGroupData(page, endpoint, site, testBrowser);
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
    expect(firstProduct.link).toBe(`${site}/pepperoni`);

    expect(secondProduct.title).toBe('Pillsbury Pizza Pockets 4 Cheese');
    expect(secondProduct.price).toBe(4.49);
    expect(secondProduct.link).toBe(`${site}/4cheese`);

    expect(thirdProduct.title).toBe('Pillsbury Pizza Pockets Supreme Deluxe');
    expect(thirdProduct.price).toBe(5.49);
    expect(thirdProduct.link).toBe(`${site}/deluxe`);
  });

  test('processJimPattisonFoodGroupData should return product array related to Pillsbury', async () => {

    // call processJimPattisonFoodGroupData
    // endpoint is the physical HTML file saved on file
    // page is an undefined variable (will be defined in createPageWithTimeout)
    // site is the root website. (ex: https://www.saveonfoods.ca)

    let page = undefined;

    const currentFileUrl = new URL(import.meta.url);
    const directoryPath = path.dirname(currentFileUrl.pathname);
    const endpoint = `file://${directoryPath}/pages/jim_pattison_group.html`;

    const site = 'https://www.saveonfoods.com';
    const results = await jimPattisonFoodGroupData(page, endpoint, testBrowser);
    let jsonData = JSON.parse(results.jsonData);

    // 3 products total
    expect(jsonData.length).toBe(3);

    const firstProduct = jsonData[0];
    const secondProduct = jsonData[1];
    const thirdProduct = jsonData[2];

    // test the title, price and link of one of the products
    // note: the results should also be sorted by price, thats why we see 4.49 as the 2nd item and not the 1st. (4.49, 5.49, 6.49)
    expect(firstProduct.title).toBe('Pillsbury Pizza Pockets Pepperoni');
    expect(firstProduct.price).toBe(4.49);
    expect(firstProduct.link).toBe(`${site}/pepperoni`);

    expect(secondProduct.title).toBe('Pillsbury Pizza Pockets 4 Cheese');
    expect(secondProduct.price).toBe(5.49);
    expect(secondProduct.link).toBe(`${site}/4cheese`);

    expect(thirdProduct.title).toBe('Pillsbury Pizza Pockets Supreme Deluxe');
    expect(thirdProduct.price).toBe(6.49);
    expect(thirdProduct.link).toBe(`${site}/deluxe`);
  });
});