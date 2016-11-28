var redis = require('redis');
//var config = require('../config');
var http = require('http');
var bluebird = require('bluebird');
var Q = require('Q');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const prefix = '205';
const tempPageLinkSet =  prefix + ':tempPageLinks';
const imgLinkSet = '205:imgLinks';
const pageLinkSet = '205:pageLinks';
const failedSet = '205:failedImgCopy';
const redisHost = 'dc.redis.cache.windows.net';
const redisAuthKey = '3yAjvfyBEAu7CxN5W7F4udrBriSBU4Jw7t4toUsIC38=';

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

var host = redisHost;
var port = 6379;

  var client = redis.createClient(port, host, coonectionOptions); //creates a new client
  client.auth(redisAuthKey);

  client.on('error', function(err){
    console.log('redis client error -------------------');
    console.log(err);
  });

function RedisClient() {


  function redisCallback(err, res){
    if(err){
      console.log(err);
    } else {
      //console.log(res);
    }
    client.end(true);
  }

  function getImg(url){
    console.log(url);
  }

  return {

		get: function(){
      console.log('fetching redis set');
			return client.smembersAsync(imgLinkSet);
		},

		cache: function(data){
			client.rpush(['205Scrape', JSON.stringify(data)], function(err, res){
				console.log(res);
			});
		},

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
      //console.log('attempting to cache: ', link);
      client.sadd(imgLinkSet, link, function(err, res){
        //console.log(err, res, link);
      });
    },

    addFailed: function(link){
      client.sadd(failedSet, link, redisCallback);
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
    }
    // flushAll: function(){
    //   return client.flushall();
    // }
  }
}

module.exports = RedisClient;
