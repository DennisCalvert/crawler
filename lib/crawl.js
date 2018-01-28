const httpGet = require('./httpFetch');
const digestPageLinks = require('./contentParsers/digestPageLinks');
const log = require('./log');
const Bluebird = require('bluebird');
const REDIS = require('./Redis');
const redis = new REDIS();
const config = require('../config');

let domainName;

function cachePageLinks(pageLinks){

  function reduceLinkList(linkList, link) {    
    log.debug("[[crawl.js]]::reduceLinkList::",link);
    return redis.pageLinks.cache(link)
      // If the link had not been cached already, add it 
      // to the linkList so we can then crwal it as well
      .then(res => res ? linkList.concat(link) : linkList)
      .catch(e => log.error('error caching link: ', e));
  }

  return Bluebird.reduce(pageLinks, reduceLinkList, []);
}

function ensureFullPath(href){
  if(href.startsWith('/')){
      return domainName + href;
  }
  return href;
}

function main(link){
  return httpGet(link)
    .then(digestPageLinks)
    .then(pageLinks => pageLinks.map(ensureFullPath).filter(l => l.startsWith(domainName)))
    .then(cachePageLinks)
    .then(uncachedPageLinks => {
      log.debug('nextBatch', uncachedPageLinks);
      if(uncachedPageLinks.length){
        return Bluebird.map(uncachedPageLinks, main, {concurrency: config.promiseConcurrency});
      } else {
        // return "Complete!";
        return Bluebird.resolve([]);
      }
    })
    .catch(e => console.error('failed caching: ', link, e));
}

/*
 * Start service
 * empty cache then recusivley collect page links
 */
function crawl(url){
  console.log('starting');
  domainName = url;
  return redis.pageLinks.delete().then(() => {
    log.info('cache cleared');
    return Bluebird.all(main(url)).then(result => {
      const success = result.every(e => e);
      if(success){
        log.info(`Crawl Complete for ${url}`);
      }  else {
        log.error('Shit went wrong...');
      }
      return;
      // process.exit();
    });
  });
}

module.exports = crawl;