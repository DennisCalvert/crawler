var winston = require('winston');


(function() {
  var evalResults = [];
  let i = 10;

  while (i--) {
    evalResults.push('[REDIS_SET_BUILDER] Adding batch of ' + i + ' of 10');
  }

  console.log(evalResults);
}());