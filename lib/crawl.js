const httpGet = require('./httpFetch');
const digestPageLinks = require('./contentParsers/digestPageLinks');
const log = require('./log');
const Bluebird = require('bluebird');
const config = require('../config');

function crawl(domain, redisSvc){

  function cachePageLinks(pageLinks){
    function reduceLinkList(linkList, link) {    
      log.debug("[[crawl.js]]::reduceLinkList::",link);
      return redisSvc.pageLinks.cache(link)
        // If the link has not been cached already, add it 
        // to the linkList so we can then crawl it as well
        .then(res => res ? linkList.concat(link) : linkList)
        .catch(e => log.error('error caching link: ', e));
    }
    return Bluebird.reduce(pageLinks, reduceLinkList, []);
  }


  function ensureFullPath(href){
    if(href.startsWith('/')){
      return domain + href;
    }
    return href;
  }


  function main(link){
    return httpGet(link)
      .then(digestPageLinks)
      .then(pageLinks => pageLinks
          .map(ensureFullPath)
          .filter(l => l.startsWith(domain)))
      .then(cachePageLinks)
      .then(uncachedPageLinks => {
        if(uncachedPageLinks.length){
          return Bluebird
            .map(uncachedPageLinks, main, {concurrency: config.promiseConcurrency});
        } else {
          return;
        }
      })
      .catch(e => log.error('failed caching: ', link, e));
  }


  /*
  * Start service
  * empty cache then recusivley collect page links
  */
  log.info('starting ', domain);
  return redisSvc.pageLinks.delete()
  .tap(() => log.info('cache cleared for ', domain))
  .then(() => {
    return Bluebird.all(main(domain))
  })
}


module.exports = crawl;