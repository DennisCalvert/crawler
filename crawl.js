
const httpGet = require('./modules/httpFetch');
const digestImageLinks = require('./modules/digestImageLinks');
const digestPageLinks = require('./modules/digestPageLinks');
const cheerio = require('cheerio');
const log = require('./modules/log');
const redis = require('./modules/Redis');

const r = new redis();
function safeRetry(link){
  setTimeout(function(){
    main(link);
  },0);
}

function cachePageLinks(pageLinks){
  return pageLinks.forEach(function(link){
    return r.addPageLink(link)
    .then((res) => {
      // TODO Add logging here
      console.log(res);
      if(res){
        safeRetry(link);
      }
    })
    .catch(e => console.log('error caching link: ', e));
  });
}

function extractPageLinks(html){
  const $ = new cheerio.load(html);
  const pageLinks = $('a').toArray();
  return pageLinks;
}

function main(link = '/'){
  console.log('Main called: ', link);

  httpGet(link)
  .then(extractPageLinks)
  .then(digestPageLinks)
  .then(cachePageLinks)
  .catch(e => {
    console.log('failed caching: ', link);
    safeRetry(link);
    //log.error(e)
  })
}

/*
 * Start service
 * empty cache then recusivley collect page links
 */
(function(){
  console.log('starting');
  var r = new redis();
  r.delPageLinks();
  console.log('cache cleared');
  main();
}());
