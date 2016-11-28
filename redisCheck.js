var redis = require('./modules/Redis');

var r = new redis();

// console.log('Flushing Redis');
//r.del();

r.get().then(function(data){
  console.log(data);
});
