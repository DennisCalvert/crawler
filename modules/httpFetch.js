const http = require('http');
const https = require('https');
const Q = require('q');
const config = require('../config');

function fetchData(path){

  path = encodeURI(path);

  // if(path.startsWith('/')){
  //   path = config.target.domain + path;
  // }

  console.log('[http:fetching] ', path);

  const deferred = Q.defer();    

  function httpCallback(res){
    if(res.statusCode === 400){
      deferred.reject("Status Code 400 for " + config.target.domain + path);
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
    console.log(`Got error: ${e.message}`);
    deferred.reject(e);
  }

  if(config.target.domain.includes('https://')){
    https.get(config.target.domain + path, httpCallback).on('error', httpErrorCallback);
  } else {
    http.get(path, httpCallback).on('error', httpErrorCallback);  
  }
  
  return deferred.promise;
}

module.exports = fetchData;