const httpGet = require('./httpFetch');
const digestImageLinks = require('./contentParsers/digestImageLinks');
const log = require('./log');

/*
 * Start service
 * empty cache then recusivley collect page links
 */
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

  function main(){
    return redisSvc.pageLinks.popCopy()
    .then(url => {
      if(url){
        return httpGet(url)
        .then(digestImageLinks)
        .then(ensureValidPath)
        .then(cacheImageLinks)
        .then(main);
      } else {
        return;
      }
    });
  }

  console.log('starting');  
  return redisSvc.pageLinks.copy()
  .then(main)
  .then(res => {
    log.info('Done finding images for ', domain);
  });
}

module.exports = crawlImages;
