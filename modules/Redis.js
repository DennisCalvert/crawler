var redis = require('redis');
var config = require('../config');
var bluebird = require('bluebird');
var Q = require('Q');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const imgLinkSet = config.imgLinkSet;
const imgLinkSetFailed = config.imgLinkSet + ':failed';
const pageLinkSet = config.pageLinkSet;
const tempPageLinkSet =  pageLinkSet + ':temp';

var coonectionOptions = {
    retry_strategy: function (options) {
        if (options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.times_connected > 10) {
            // End reconnecting with built in error
            console.log('failed to connect to redis');
            return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 3000);
    }
};

console.log(config.redis.port, config.redis.host);

var client = redis.createClient(config.redis.port, config.redis.host, coonectionOptions); //creates a new client

client.auth(config.redis.authKey);

client.on('error', function(err){
  console.log('redis client error -------------------');
  console.log(err);
});

client.on('connect', function(e){
  console.log('connected to redis');
});
  

function RedisClient() {

  function redisCallback(err, res){
    if(err){
      console.log(err);
    } else {
      //console.log(res);
    }
    //client.end(true);
  }

  return {

		get: function(){
      console.log('fetching redis set');
			return client.smembersAsync(imgLinkSet);
		},

		// cache: function(data){
		// 	client.rpush(['205Scrape', JSON.stringify(data)], function(err, res){
		// 		console.log(res);
		// 	});
		// },

    getPageLinks: function(){
      return client.smembersAsync(pageLinkSet);
    },

    pageLinksCopySet: function(){
      return client.sunionstoreAsync(tempPageLinkSet, pageLinkSet);
    },

    popPageLink: function(){
      return client.spopAsync(tempPageLinkSet);
    },

    addPageLink: function(link){
      console.log('caching: ', link);
      const deferred = new Q.defer();
      client.sadd(pageLinkSet, link, function(err, res){
        if(err){
          deferred.reject(err);
        } else {
          deferred.resolve(res);
        }
      });
      //client.quit();
      return deferred.promise;
    },

    addImgLink: function(link){
      console.log('attempting to cache: ', link);
      return client.sadd(imgLinkSet, link, function(err, res){
        console.log(err, res, link);
      });
    },

    addFailed: function(link){
      client.sadd(imgLinkSetFailed, link, redisCallback);
    },

    del: function(){
      client.del(imgLinkSet, function(s){
        console.log(s);
      });
    },

    delPageLinks: function(){
      client.del(pageLinkSet, function(e){
        console.log(e);
      });
    },

    client: client
    // flushAll: function(){
    //   return client.flushall();
    // }
  }
}

module.exports = RedisClient;
