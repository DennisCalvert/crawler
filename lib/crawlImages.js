const httpGet = require('./httpFetch');
const digestImageLinks = require('./contentParsers/digestImageLinks');
const log = require('./log');

/*
 * Start service
 * empty cache then recusivley collect page links
 */
function crawlImages(redisSvc){

  function cacheImageLinks(linkArray){
    return linkArray.map(url => {
      return redisSvc.imgLinks.cache(url);
    });
  }

  function main(){
    return redisSvc.pageLinks.popCopy()
    .then(url => {
      if(url){
        return httpGet(url)
        .then(digestImageLinks)
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
    console.log('All Done!', res);
  });
}

module.exports = crawlImages;
