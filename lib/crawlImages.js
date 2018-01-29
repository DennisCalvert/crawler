const httpGet = require('./httpFetch');
const digestImageLinks = require('./contentParsers/digestImageLinks');
const log = require('./log');
const Bluebird = require('bluebird');
const config = require('../config');

function crawlImages(domain, redisSvc){

  function cacheImageLinks(linkArray){
    return linkArray.map(url => {
      return redisSvc.imgLinks.cache(url);
    });
  }

  function ensureValidPath(linkArray){
    return linkArray.map(url => {
      if(url.startsWith('/')){
        return domain + url;  
      }
      if(url.startsWith('..')){
        return domain + url.subString(2);
      }
      if(!url.startsWith('http') && !url.startsWith('/')){
        return domain + '/' + url;
      }
      return url;
    });
  }

  function main(url){
    return httpGet(url)
      .then(digestImageLinks)
      .then(ensureValidPath)
      .then(cacheImageLinks)
  }
 
  return redisSvc.pageLinks.get().then(pageLinkArray => {
    log.info('Starting image crawl for ', domain);
    log.info(`Parsing ${pageLinkArray.length} URLs`); 
    return Bluebird.map(pageLinkArray, main, {concurrency: config.promiseConcurrency})
  });
}

module.exports = crawlImages;
