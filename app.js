const express = require('express');
const router = express.Router();
const app = express();
const favicon=require('serve-favicon');
const path = require('path');
const fs=require('fs');
const errorhandler=require('errorhandler');

let config=require('./config');
const logger=require('./common/logger');
const webRouter=require('./web_router')

const staticDir=path.join(__dirname,'public')

app.set('view engine','ejs')

app.use(favicon(`${__dirname}/favicon.ico`))
app.use('/public',express.static(staticDir))


app.use('/',webRouter)
if(config.debug){
    app.use(errorhandler())
}else{
    app.use((err,req,res,next)=>{
        logger.error(err)
        res.status(500).send('500 status')
    })
}
app.listen(config.port)
// app.listen(config.port,()=>{
//     logger.info('automation listening on port ',config.port);
//     logger.info(`You can debug your app with http://${config.host}:${config.port}`)
// });

