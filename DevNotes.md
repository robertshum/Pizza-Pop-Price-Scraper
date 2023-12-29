### Jest

#### ESM vs CommonJS

By default, jest will try to convert ESM code to CommonJS.  (It wants to use the module.export + require syntax).  However, my code, and the utility classes uses ES6 (which is export fn() + import ...from syntax).

To Prevent Jest to convert, add this to the `package.json

```json

"jest": {
    "transform": {}
}

```

and then pass in the flag for experimental-vm-modules like this:

```json

"scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
}

```

This was a very recent update from Paulo in Stackoverflow (Dec 2023): https://stackoverflow.com/questions/35756479/does-jest-support-es6-import-export


#### Async Tests

When running tests that uses index/app.js and has async / await calls inside, it's very possible that running tests will generate these errors and leave the test hanging:

```bash
Jest did not exit one second after the test run has completed.

'This usually means that there are asynchronous operations that weren't stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.
```

In my case, the browser from puppeteer is created (but never closed / destroyed) at the end of the test suites.  Make sure to:

1. Close the browser instance 
2. Close the listeners for express

Ex:

```js
  afterAll(async () => {

    await request(app).get('/closeBrowser');
    listener.close();
  });
```

Generally, for async tests, you want to use async await for promises.  If not, you want to explicity use call done() from the callback of the test to let Jest knows a test is complete.  Ex:

```js
test('testing async code', (done) =>{
  //test
  // ...
  // let jest know it's done async test
  done();
})
```

I added two new flags for jest in order for my test cases stop it from hanging:

In package.json
```json
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --detectOpenHandles",
    ...
  },
```

* `---runInBand` will force the tests to run in sequence (and not on multiple threads).  I am not 100% sure why this fixes my issue in `endpoint.test.js`.  
* `---detectOpenHandles` will attempt to log any async code that hasn't been gracefully closed (like DB connections that are opened).  Since I added this flag, it actually makes messages less verbose and it never logs anything useful in my case.

I was hoping to find a way to resolve the hanging tests without using flags where I'm not too sure why it solves my problem, but I am focusing on the big picture, which is the ability to test API calls fully.  Sort of like an E2E test for just the backend.