const redis = require('../lib/Redis');

const r = new redis();

r.pageLinks.get().then(console.log);