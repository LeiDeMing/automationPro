const path=require('path');
const log4js=require('log4js');

let config=require('../config');

let env=process.env.NODE_ENV;

log4js.configure({
    appenders: { cheese: { type: 'file', filename: path.join(config.log_dir,'cheese.log') } },
    categories: { default: { appenders: ['cheese'], level: 'debug' } }
  });

let logger=log4js.getLogger('cheese');
logger.level ='debug'

module.exports=logger;

