const siteCrawler = require('./lib/crawl');
const crawlImages = require('./lib/crawlImages');
// const copyPageContnet = require('.lib/copyPageContnet')
const redis = require('./lib/Redis');
const config = require('./config');
const log = require('./lib/log');
const copyPageContent = require('./lib/contentParsers/copyPageContent');


const domain = 'https://www.govinfo.gov/bulkdata/BILLS';
const cacheName = 'rpp';

const main = async () => {
    const redisInstance = await new redis(cacheName);
    await siteCrawler(domain, redisInstance);
    console.log('Closing REDIS conenction');
    redisInstance.client.quit();
    console.log('Finished');
};

main(); 