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
    const {app, closeBrowser} = await initApp();
    appInstance = app;
    closeBrowserInstance = closeBrowser;
    listener = appInstance.listen(TESTING_PORT);
  });


  afterAll(async () => {
    await closeBrowserInstance();
    listener.close();
  });


  test('should return json with Hello World msg', async () => {
    const response = await request(appInstance).get('/helloWorld');
    expect(response.status).toBe(200);
    expect(response.body).toBe('Hello World!  🤩');
  });
});