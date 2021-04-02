const redis = require('redis');
const config = require('../config');
const bluebird = require('bluebird');
const Q = require('Q');
const log = require('./log');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

// function RedisClient() {

  function factory(client, setName){
    const tempSetName = setName + ':temp';

    return {
      get(){
        log.info('redis:getting:',setName);
        return client.smembersAsync(setName);
      },

      cache(data){
        log.debug('caching: ', data);
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

  function init(linkSetName){
    // Redis set names
    const	pageLinkSet = linkSetName + ':pageLinks';
    const imgLinkSet = linkSetName + ':imgLinks';
    const imgLinkSetFailed = linkSetName + ':imgfailed';

    const coonectionOptions = {
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
              log.error('failed to connect to redis');
              return undefined;
          }
          // reconnect after
          return Math.max(options.attempt * 100, 3000);
      },
      password: 'fuck',
  };

    const client = redis.createClient(config.redis.port, config.redis.host, coonectionOptions); //creates a new client
    if(config.redis.authKey) {
      client.auth(config.redis.authKey);
    } else {
      console.warn('Connecting to instance with no AUTH');
    }

    client.on('error', function(err){
      log.error('redis client error', err);
    });

    client.on('connect', function(e){
      log.info('connected to redis');
    });

    return {
      client,
      pageLinks: factory(client, pageLinkSet),
      imgLinks: factory(client, imgLinkSet),
      addFailed: function(link){
        client.sadd(imgLinkSetFailed, link);
      } 
    }
  }
// }

module.exports = init;
