import puppeteer from "puppeteer";

// TODO
// 1.) Classes that handles vendor specific data manipulation logic (they will each return a json object)
// 2.) Find a way to write tests for these classes
// 3.) Convert to express js app so we can make Rest API calls

async function run() {
    let browser;
    try {
        //https://www.youtube.com/watch?v=qo_fUjb02ns&t=1s&ab_channel=BeyondFireship

        //1 set up websocket
        //username:password
        //USERNAME-ZONE:PASSWORD (format if we want to use BrightData proxy services)

        // const auth = 'USERNAME-ZONE:PASSWORD';
        // browser = await puppeteer.connect({
        //     //browser web socket endpoint
        //     browserWSEndpoint: `wss://${auth}@zproxy.lum-superproxy.io:9222`
        // });

        // browser = await puppeteer.launch({
        //     executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        // });

        browser = await puppeteer.launch();

        //2 now we can do stuff with the browser
        const page = await browser.newPage();

        //2min timeout
        page.setDefaultNavigationTimeout(2 * 60 * 1000);
        await page.goto('https://www.saveonfoods.com/sm/pickup/rsid/2287/results?q=pillsbury+pizza+pops&take=30&sort=price');
        // await page.goto('https://www.pricesmartfoods.com/sm/pickup/rsid/2274/results?q=pillsbury%20pizza%20pops');
        // await page.goto('https://www.walmart.ca/search?q=Pillsbury%20Pizza%20Pops&c=10019'); //access forbidden
        // await page.goto('https://www.realcanadiansuperstore.ca/search?search-bar=pillsbury%20pizza%20pops');

        //for saveon foods
        const selector = '[class*="ProductCardWrapper"]';
        const elements = await page.$$(selector);

        const collectedData = [];

        for (const element of elements) {
            const text = await page.evaluate(el => el.innerHTML, element);
            const titleElement = await page.evaluate(input => {
                const element = input.querySelector('[data-testid$="-ProductNameTestId"]');
                const children = element.querySelectorAll('*');
                children.forEach(child => {
                  child.textContent = '';
                });
                return element.textContent;
              }, element);


            const priceElement = await page.evaluate(input => input.querySelector('[class^="ProductCardPrice--"]').textContent, element);
            const title = titleElement.trim();
            const rawPrice = priceElement.trim();

            const price = parseFloat(rawPrice.replace('$', ''));

            const data = {
                title: title,
                price: price
            };
            collectedData.push(data);
        }

        const uniqueArray = collectedData.filter((obj, index, self) => {
            // Compare objects based on a unique identifier or specific properties
            // For example, if your objects have an 'id' property:
            return index === self.findIndex((o) => o.title === obj.title);
        });

        const jsonData = JSON.stringify(uniqueArray, null, 2);
        console.log(jsonData);
        return;

    } catch (e) {
        console.error('pizza scraping has encountered an error', e);
    }
    finally {
        await browser?.close();
    }
}

run();