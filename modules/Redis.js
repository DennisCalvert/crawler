var redis = require('redis');
var config = require('../config');
var bluebird = require('bluebird');
var Q = require('Q');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const domain = config.target.domain;

// Redis set names
const imgLinkSet = domain + ':imgLinks';
const	pageLinkSet = domain + ':pageLinks';
const imgLinkSetFailed = imgLinkSet + ':failed';
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

var client = redis.createClient(config.redis.port, config.redis.host, coonectionOptions); //creates a new client

client.auth(config.redis.authKey);

client.on('error', function(err){
  console.log('redis client error', err);
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

  // function cache(data, dataSet){
  //   console.log('caching: ', data);
  //   const deferred = new Q.defer();
  //   client.sadd(dataSet, data, function(err, res){
  //     if(err){
  //       deferred.reject(err);
  //     } else {
  //       deferred.resolve(res);
  //     }
  //   });
  //   //client.quit();
  //   return deferred.promise;
  // }  

  function factory(setName){
    const tempSetName = setName + ':temp';

    return {
      get(){
        return client.smembersAsync(setName);
      },

      cache(data){
        // console.log('caching: ', data);
        const deferred = new Q.defer();
        client.sadd(setName, data, function(err, res){
          if(err){
            deferred.reject(err);
          } else {
            deferred.resolve(res);
          }
        });
        //client.quit();
        return deferred.promise;
      },

      delete(){
        const deferred = new Q.defer();
        client.del(setName, function(err, res){
          if(err){
            deferred.reject(err);
          } else {
            deferred.resolve(res);
          }
        });
        //client.quit();
        return deferred.promise;
      },

      copy(){
        return client.sunionstoreAsync(tempSetName, setName);
      },

      popCopy(){
        return client.spopAsync(tempSetName);
      }

    }
  }

  return {

    pageLinks: factory(pageLinkSet),
    imgLinks: factory(imgLinkSet),
    // {
    //   get(){ return client.smembersAsync(imgLinkSet) },
    //   put(link) { return cache(link, imgLinkSet) },
    //   delete() { return deleteCache(imgLinkSet) }
    // },

		get: function(){
      console.log('fetching redis set');
			return client.smembersAsync(imgLinkSet);
		},

    getPageLinks: function(){
      return client.smembersAsync(pageLinkSet);
    },

    // pageLinksCopySet: function(){
    //   return client.sunionstoreAsync(tempPageLinkSet, pageLinkSet);
    // },

    popPageLink: function(){
      return client.spopAsync(tempPageLinkSet);
    },

    addPageLink: function(link){
      // console.log('caching: ', link);
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
