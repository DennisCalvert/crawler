
const httpGet = require('./modules/httpFetch');
const digestImageLinks = require('./modules/digestImageLinks');
const digestPageLinks = require('./modules/digestPageLinks');
const cheerio = require('cheerio');
const log = require('./modules/log');
const redis = require('./modules/Redis');

//   const ImgHtmlDomElms = $('img').toArray();
//   digestImageLinks(ImgHtmlDomElms);

function safeRetry(link){
  setTimeout(function(){
    main(link);
  },0);
}

function cachePageLinks(pageLinks){
  const r = new redis();
  return pageLinks.forEach(function(link){
    //const r = new redis();
    return r.addPageLink(link)
    .then((res) => {
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
  .then(function(e){
    //console.log('cached:', link);
  })
  .catch(e => {
    console.log('failed caching: ', link);
    safeRetry(link);
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
  var r = new redis();
  r.delPageLinks();
  console.log('cache cleared');
  main();
}());
