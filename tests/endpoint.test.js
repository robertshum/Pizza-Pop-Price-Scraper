import request from 'supertest';
import { initApp } from '../index.js';

const TESTING_PORT = 3001; // Use a different port for testing

describe('GET /helloWorld test', () => {

  let listener;
  let app;

  beforeAll(async () => {
    app = await initApp();

    listener = app.listen(TESTING_PORT);
  });


  afterAll(async () => {

    await request(app).get('/closeBrowser');
    listener.close();
  });


  test('should return json with Hello World msg', async () => {
    const response = await request(app).get('/helloWorld');

    expect(response.status).toBe(200);
    expect(response.body).toBe('Hello World!  🤩');

  //   // return request(app)
  //   //   .get('/helloWorld')
  //   //   .expect(200)
  //   //   .then(response => {
  //   //     expect(response.body).toBe('Hello World!  🤩');
  //   //     done();
  //   //   });

  });
});