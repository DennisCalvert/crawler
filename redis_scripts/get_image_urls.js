const redis = require('../modules/Redis');

const cache = new redis();

cache.imgLinks.get().then(console.log);