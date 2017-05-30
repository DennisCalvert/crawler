
const httpGet = require('./modules/httpFetch');
const digestImageLinks = require('./modules/digestImageLinks');
const log = require('./modules/log');
const redis = require('./modules/Redis');

const r = new redis();

function safeRetry(e){
    if(e){
        setTimeout(function(){
            main();
        },0);
    }
}

let failedLinks = [];

function main(){

  let currentLinkUrl;

  return r.popPageLink()
  .tap(l => currentLinkUrl = l)
  .tap(safeRetry)
  .then(httpGet)
  .then(digestImageLinks)
  .tap(console.log)
  .catch(e => {
    console.log('[crawl images] failed caching image: ', e);
    console.log('failed count: ', failedLinks.length);
    console.log(failedLinks);
    failedLinks.push(currentLinkUrl);
    //r.ca(e);
    //log.error(e)
  })
  .finally(e => console.log('task complete'));
}

/*
 * Start service
 * empty cache then recusivley collect page links
 */
(function(){
  console.log('starting');
  r.pageLinksCopySet()
  .then(main);
}());
