const httpGet = require('./modules/httpFetch');
const digestImageLinks = require('./modules/digestImageLinks');
const log = require('./modules/log');
const redis = require('./modules/Redis');
const r = new redis();

function main(){
  return r.pageLinks.popCopy()
  .then(url => {
    if(url){
      return httpGet(url).then(digestImageLinks).then(main);
    } else {
      return;
    }
  });
}

/*
 * Start service
 * empty cache then recusivley collect page links
 */
(function(){

  console.log('starting');
  
  return r.pageLinks.copy()
  .then(main)
  .then(res => {
    console.log('All Done!', res);
  });
}());
