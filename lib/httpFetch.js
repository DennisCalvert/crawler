const http = require('http');
const https = require('https');
const Q = require('q');
const log = require('./log');

function fetchData(path){

  path = encodeURI(path);

  log.info('http:get:', path);

  const deferred = Q.defer();    

  function httpCallback(res){
    if(res.statusCode === 400){
      deferred.reject("Status Code 400 for " + path);
    }
    var body = '';
    res.on("data", function(chunk){
      body += chunk;
    });
    res.on("error", function(err){
      deferred.reject(err);
    });
    res.on("end", function(){
      deferred.resolve(body);
    });
  }

  function httpErrorCallback(e){
    log.error(`Got error: ${e.message}`);
    deferred.reject(e);
  }

  if(path.includes('https://')){
    https.get(path, httpCallback).on('error', httpErrorCallback);
  } else {
    http.get(path, httpCallback).on('error', httpErrorCallback);  
  }
  
  return deferred.promise;
}

module.exports = fetchData;