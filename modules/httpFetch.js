const http = require('http');
const https = require('https');
const Q = require('q');
const config = require('../config');

function fetchData(path){

  path = encodeURI(path);
  console.log('[http:fetching] ', path);

  if(path.includes('https://')){
    path = path.slice(0,7);
  } else if (path.includes('http://')){
    path = path.slice(0,6);
  }

  const deferred = Q.defer();    

  const httpConfig = {
    hostname: config.target.domain,
    port: 80,
    path: path,
    agent: false
  };

  function httpCallback(res){
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
    http.get(httpConfig, httpCallback).on('error', httpErrorCallback);  
  }
  
  return deferred.promise;
}

module.exports = fetchData;