var redis = require('redis');
//var config = require('../config');
var http = require('http');
var bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

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
            return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 3000);
    }
};

function RedisClient() {
  var host = redisHost;
  var port = 6379;
  var client = redis.createClient(port, host, coonectionOptions); //creates a new client

  client.auth(redisAuthKey);

  client.on('error', function(err){
    //console.log('redis client error -------------------');
    //console.log(err);
  });

  function saddResponseCallback(err, res){
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

    addPageLink: function(link){
      client.sadd(pageLinkSet, link, saddResponseCallback);
    },

    addImgLink: function(link){
      client.sadd(imgLinkSet, link, saddResponseCallback);
    },

    addFailed: function(link){
      client.sadd(failedSet, link, saddResponseCallback);
    },

    flushAll: function(){
      client.flushall(function(s){
        console.log(s);
      });
    }
  }
}

module.exports = RedisClient;
