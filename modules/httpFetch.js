const http = require('http');
const Q = require('q');
const config = require('../config');

function fetchData(path){

  const deferred = Q.defer();    

  console.log('path:', path);
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
    res.on("end", function(){
	  deferred.resolve(body);
    });
  });
  return deferred.promise;
}

module.exports = fetchData;