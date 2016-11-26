
const httpGet = require('./modules/httpFetch');
const digestImageLinks = require('./modules/digestImageLinks');
const digestPageLinks = require('./modules/digestPageLinks');
const cheerio = require('cheerio');
const log = require('./modules/log');
const redis = require('./modules/Redis');
//const Q = require('Q');

//   const ImgHtmlDomElms = $('img').toArray();
//   digestImageLinks(ImgHtmlDomElms);


function cachePageLinks(pageLinks){
  return pageLinks.forEach(function(link){
    const r = new redis();
    return r.addPageLink(link)
    .then(function(res){
      //console.log(res);
      if(res){
        setTimeout(function(){
          //console.log('stack cleared');
          main(link);
        },0);
      }
    });
  });
}

function extractPageLinks(html){
  const $ = new cheerio.load(html);
  const pageLinks = $('a').toArray();
  return pageLinks;
}

function main(link = '/'){
  log.debug('Main called: ', link);

  httpGet(link)
  .then(extractPageLinks)
  .then(digestPageLinks)
  .then(cachePageLinks)
  .then(function(e){
    console.log('cached:', link);
  })
  .catch(e => {
    main(link);
    log.error(link);
    log.error(e)
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
  r.flushAll();
  console.log('cache cleared');
  main();
}());
