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