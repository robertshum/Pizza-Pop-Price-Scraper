import request from 'supertest';
import { initApp } from '../index.js';
import {
  TESTING_PORT
} from '../config.js';



describe('GET /helloWorld test', () => {


  // instance returned from listening on the app
  let listener;

  // app exported from index.js
  let appInstance;

  // function to close puppeteer browser from index.js
  let closeBrowserInstance;

  beforeAll(async () => {
    const { app, closeBrowser } = await initApp();
    appInstance = app;
    closeBrowserInstance = closeBrowser;
    listener = appInstance.listen(TESTING_PORT);
  });

  afterAll(async () => {
    await closeBrowserInstance();
    listener.close();
  });

  // Basic API request to service
  test('GET /helloWorld test', async () => {
    const response = await request(appInstance).get('/helloWorld');
    expect(response.status).toBe(200);
    expect(response.body).toBe('Hello World!  🤩');
  });

  // End to end API request to superstore, which includes pupeteer code
  // This test will fail if the vendors update the class tags on their site
  test('GET /GetSuperStoreData test', async () => {
    const response = await request(appInstance).get(
      '/GetSuperstoreData?search=Pillsbury&Pizza&Pops'
    );
    expect(response.status).toBe(200);

    const arrayOfProducts = response.body;

    // Should have at least one pillsbury product
    expect(arrayOfProducts.length).toBeGreaterThan(0);

    const firstProduct = arrayOfProducts[0];
    const title = firstProduct.title;
    const price = firstProduct.price;
    const link = firstProduct.link;

    expect(title.includes('Pillsbury')).toBe(true);
    expect(price).toBeGreaterThan(0);
    expect(link.includes('www.realcanadiansuperstore.ca'));

    // 10s to wait
  }, 10000);
});