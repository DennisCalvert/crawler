const redis = require('../modules/Redis');

const r = new redis();

r.pageLinks.get().then(console.log);