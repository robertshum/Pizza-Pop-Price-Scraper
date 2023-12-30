import { initApp } from '../index.js';
import {
  TESTING_PORT
} from '../config.js';

describe('Testing Process Group Data', () => {

    // instance returned from listening on the app
    let listener;

    // app exported from index.js
    let appInstance;

    // function to close puppeteer browser from index.js
    let closeBrowserInstance;
  
    beforeAll(async () => {
      const { app, closeBrowser, processLoblawsGroupData } = await initApp();
      appInstance = app;
      closeBrowserInstance = closeBrowser;
      listener = appInstance.listen(TESTING_PORT);
    });
  
    afterAll(async () => {
      await closeBrowserInstance();
      listener.close();
    });

    
  test('processLoblawsGroupData should return product array related to Pillsbury', async () => {
    // TODO
    // call processLoblawsGroupData
    // endpoint is the physical HTML file saved on file
    // page is an undefined variable (will be defined in createPageWithTimeout)
    // site is the root website. (ex: https://www.superstore.ca)
  });
});