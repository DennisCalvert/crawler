const httpGet = require('./modules/httpFetch');
const digestPageLinks = require('./modules/digestPageLinks');
const log = require('./modules/log');
const Bluebird = require('bluebird');
const REDIS = require('./modules/Redis');
const redis = new REDIS();
const config = require('./config');


function cachePageLinks(pageLinks){

  function reduceLinkList(linkList, link) {    
    console.log("[[crawl.js]]::reduceLinkList::",link);
    return redis.addPageLink(link)
      // If the link had not been cached already, add it 
      // to the linkList so we can then crwal it as well
      .then(res => res ? linkList.concat(link) : linkList)
      .catch(e => log.error('error caching link: ', e));
  }

  return Bluebird.reduce(pageLinks, reduceLinkList, []);
}


function main(link = '/'){
  return httpGet(link)
    .then(digestPageLinks)
    .then(cachePageLinks)
    .then(pageLinks => {
      console.log('nextBatch', pageLinks);
      if(pageLinks.length){
        return Bluebird.map(pageLinks, main, {concurrency: config.linkSetCacheconCurrency});
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
console.log('starting');
redis.delPageLinks();
log.info('cache cleared');
Bluebird.all(main()).then(result => {
  const success = result.every(e => e);
  if(success){
    log.info('Crawl Complete');
  }  else {
    log.error('Shit went wrong...');
  }
});
