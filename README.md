# Pillsbury Pizza Pop Price Scraper
Backend API that scrapes local vendor websites for the current prices 💵 of a searched product.  Originally it was supposed to just return the prices of Pillsbury Pizza Pops (as a joke) but, I decided to make it more robust by adding a search function.  I also created a front-end app that uses this API which can be found here: (will link later).

## Vendors
Currently, the project scrapes the following vendor websites:\
Save-on-foods\
Pricesmart\
Superstore\
Your Independent Grocer\
No Frills\
~~Walmart~~

Vendors, such as Walmart.ca doesn't render a full 'proper' page, and I suspect it's because of their bot-detection algorithms and/or my use of web-scraping APIs such as Puppeteer.

# How it Works

This app uses node express to enable API calls.  The calls then uses Google Puppeteer, to browse websites using a headless Chrome browser, and then filter out data from the sites, such as the title, price, and URL of each product on the page.  It then finally consolidates the results into a JSON array and sends the response back.  Do note that the app only loads the products on the first page, while sorting the price from low to high.

# Features

*Rate limiter that prevents users from making too many requests in a specific time window.\
*Basic error handling (timeouts from going to a page, creating a browser, waiting too long on finding a selector on a page).\
*Handles empty results (if a user types in gibberish into search, for example).\
*For vendors under the Loblaws group (Superstore, No Frills, etc.), the app filters out 'Sponsored' advertisements.  If I search for Pillsbury Pizza Pockets, I better get those results!

# Get Started

## Installing the Project

1. Clone the project
2. npm install

## Running the Project

1. configure the port in config.json
2. npm . or npm index.js
3. Make a GET request (see below) from a browser or software that can test Rest APIs like Postman
4. Results will be an array of objects in JSON.  The attributes returned are:

The title found on the product
The price of the product
The link to the product page (Vendor site)



# Usage / Endpoints

Format:
`http:// + localhost:portNumber + vendorEndpoint + ?search= + product_to_search_for`

Example:
`http://localhost:3000/GetSaveOnFoodsData?search=Pillsbury&Pizza&Pops`

Vendors:
```
//Save-on-Foods
/GetSaveOnFoodsData?search=Pillsbury&Pizza&Pops

//Pricesmart
/GetPricesmartData?search=Pillsbury&Pizza&Pops

//Superstore
/GetSuperstoreData?search=Pillsbury&Pizza&Pops

//No Frills
/GetNoFrillsData?search=Pillsbury&Pizza&Pops

//Your Independent Grocer
/GetYourIndependentGrocerData?search=Pillsbury&Pizza&Pops
```

Example of JSON results:
```js
[
  {
    "title": "Carrots",
    "price": 0.51,
    "link": "https://www.realcanadiansuperstore.ca/carrots/p/20116186001_KG"
  },
  {
    "title": "President's Choice Dressing Blue Cheese",
    "price": 0.55,
    "link": "https://www.realcanadiansuperstore.ca/dressing-blue-cheese/p/21206954_EA"
  }
]
```

Other:
```
//Closes the browser.  Currently not needed, as every new GET request creates and closes a new page.  When the app starts, it creates a Puppeteer browser that is shared for all users until shutdown.
/closeBrowser

//A simple endpoint that console logs 'hello world' for testing.
/helloWorld
```

# Limitations

1. The app works well locally but if it's deployed on an instance provisioned by, say, Amazon EC2, Puppeteer has issues loading the website.  It seems to always time out either when trying to establish a connection to the website or when trying to find a specific element on the page.  I'm believing that the vendor websites are blocking IP's from major commercial vendors like Amazon.

2. If Puppeteer is launched in incognito, the results of the web scrape may be different from a normal browser interaction.  Most likely due to cookies that set the default location of a store when searching.  

	For example, for Superstore, Pillsbury Pizza Pops might be available at the Marine Drive location (default location from incognito) but it might be sold out in Richmond (the location set from cookies from previous visits in a normal browser).

3. The app only scrapes the first page of the results of the vendor's website, with the price sorted from low to high.

4. The app is not a search engine and the results of a web scrape come from the search results of the vendor.  Don't be surprised if you typed in 'Cheese' in a search for Superstore and it returned 'Carrots' as one of the results.  Try it on their official website, it does the same thing!

# Tech Stack
[![image](https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=Puppeteer&logoColor=white)](https://pptr.dev/)\
[![image](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)\
[![image](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/en)



# License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
