
const httpGet = require('./modules/httpFetch');
const digestImageLinks = require('./modules/digestImageLinks');
const cheerio = require('cheerio');
const log = require('./modules/log');
const redis = require('./modules/Redis');

const r = new redis();
//console.log(r);

function safeRetry(e){
    if(e){
        setTimeout(function(){
            main();
        },0);
    }
}

function extractImgLinks(html){
  const $ = new cheerio.load(html);
  const imgLinks = $('img').toArray();
  //console.log(imgLinks);
  return imgLinks;
}

let failedLinks = [];

function main(){

  let currentLinkUrl;

  r.popPageLink()
  .tap(l => currentLinkUrl = l)
  //.tap(console.log)
  .tap(safeRetry)
  .then(httpGet)
  //.tap(console.log)
  .then(extractImgLinks)
  //.tap(console.log)
  .then(digestImageLinks)
  .catch(e => {
    //console.log('failed caching: ', e);
    failedLinks.push(currentLinkUrl);
    console.log(failedLinks.length);
    console.log(failedLinks);
    //r.ca(e);
    //log.error(e)
  })
  //.finally(e => console.log('task complete'));
}

/*
 * Start service
 * empty cache then recusivley collect page links
 */
(function(){
  console.log('starting');
  r.pageLinksCopySet()
  .then(main);
  //var r = new redis();
  //r.flushAll();
  //console.log('cache cleared');
  main();
}());
