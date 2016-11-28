const http = require('http');
const Q = require('q');
const config = require('../config');

function fetchData(path){

  //path = encodeURIComponent(path);
  //  console.log('path:', path);

  const deferred = Q.defer();    

  http.get({
    hostname: config.domain,
    port: 80,
    path: path,
    agent: false
  }, function(res){
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
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
    deferred.reject(e);
  });
  return deferred.promise;
}

module.exports = fetchData;