### Jest

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

This was a very recent update from Paulo in stackoverflow (Dec 2023): https://stackoverflow.com/questions/35756479/does-jest-support-es6-import-export


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
