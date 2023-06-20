import puppeteer from "puppeteer";

export async function createPageWithTimeout(timeout, endpoint, inputBrowser, userAgent, res) {

    //another way to be fancy is to connect to BrightData (not free)
    //BrightData allows use to use rotating proxies to evade bot detection
    //see tutorial here - https://www.youtube.com/watch?v=qo_fUjb02ns&t=1s&ab_channel=BeyondFireship
    //To connect to BrightData:
    //USERNAME-ZONE:PASSWORD (format if we want to use BrightData proxy services)

    // const auth = 'USERNAME-ZONE:PASSWORD';
    // browser = await puppeteer.connect({
    //     //browser web socket endpoint
    //     browserWSEndpoint: `wss://${auth}@location_of_proxy:port`
    // });

    try {
        let browser = inputBrowser;

        //in case it's closed for whatever reason
        if (browser === null || browser === undefined || !browser.isConnected()) {
            browser = createNewBrowser();
        }

        const page = await browser.newPage();
        await page.setUserAgent(userAgent);
        page.setDefaultNavigationTimeout(timeout);
        await page.goto(endpoint);
        return page;
    } catch (error) {
        console.error('Error in: createPageWithTimeout(...)', error);
        return;
    }

}

export async function createNewBrowser() {
    const browser = await puppeteer.launch({
        headless: 'new',
        //args: ['--proxy-server=192.241.189.47:31028']
    });
    return browser;
}

export async function convertToJson(collectedData) {
    //Remove duplicates of collectedData
    const uniqueArray = collectedData.filter((obj, index, self) => {
        // Compare objects based on a unique identifier or specific properties
        // For example, if your objects have an 'id' property:
        return index === self.findIndex((o) => o.title === obj.title);
    });
    uniqueArray.sort((a, b) => (a.price - b.price));
    let jsonData = JSON.stringify(uniqueArray, null, 2);
    jsonData = jsonData.trim();
    return jsonData;
}