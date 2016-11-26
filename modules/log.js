const winston = require('winston');

/*
 *
 * 
 * This module will allow easy configuration of logging. 
 * 
 * 
 */

winston.add(winston.transports.File, { filename: 'log.log' });


module.exports = winston;