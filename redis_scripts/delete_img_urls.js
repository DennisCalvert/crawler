const redis = require('../lib/Redis');

const cache = new redis();

cache.imgLinks.delete().then(console.log);