const redis = require('../lib/Redis');

const cache = new redis();

cache.imgLinks.get().then(console.log);