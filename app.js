const express = require('express');
const router = express.Router();
const app = express();
const favicon = require('serve-favicon');
const path = require('path');
const fs = require('fs');
const errorhandler = require('errorhandler');
let Client = require('ssh2-sftp-client');
require('events').EventEmitter.prototype._maxListeners = 50;

let config = require('./config');
const logger = require('./common/logger');
const webRouter = require('./web_router');
import {localPath,remotePath,sfpOptions} from './config/huada'

const staticDir = path.join(__dirname, 'public')

app.set('view engine', 'ejs')

app.use(favicon(`${__dirname}/favicon.ico`))
app.use('/public', express.static(staticDir))


// app.use('/',webRouter)
// if(config.debug){
//     app.use(errorhandler())
// }else{
//     app.use((err,req,res,next)=>{
//         logger.error(err)
//         res.status(500).send('500 status')
//     })
// }
app.listen(config.port)
// app.listen(config.port,()=>{
//     logger.info('automation listening on port ',config.port);
//     logger.info(`You can debug your app with http://${config.host}:${config.port}`)
// });


//sftp 上传服务
let sftp = new Client();

let fsOptions = {
    presistent: true,
    interval: 2000
}
const stataicPath = {
    js: {
        local: `${localPath}/js`,
        remote: `${remotePath}/static/js`
    },
    css: {
        local: `${localPath}/css`,
        remote: `${remotePath}/static/css`
    },
    data: {
        local: `${localPath}/data`,
        remote: `${remotePath}/static/data`
    }
}


const handleFilesPath = function (pathObj, kind) {
    let {
        local,
        remote
    } = pathObj;
    const filesArr = fs.readdirSync(local, 'utf8');
    return newPath = filesArr.map((val, key) => {
        let completeLocalPath = `${local}/${val}`;
        return {
            type: kind,
            localPath: completeLocalPath,
            remotePath: `${remote}/${val}`
        }
    })
}

const uploadFile = function () {
    let files = []
    Object.keys(stataicPath).forEach(key => {
        files = files.concat(handleFilesPath(stataicPath[key], key))
    })
    const splitArr=files.slice(0,10)
    const splitArr2=files.slice(10,20)
    const task = splitArr.map((file,iIndex) => {
        sftp.connect(sfpOptions)
        .then(() => {
            sftp.fastPut(file.localPath, file.remotePath)
                .then(() => {
                    if(iIndex===9){
                        setTimeout(()=>{
                            splitArr2.map((file,iIndex) => {
                                sftp.connect(sfpOptions)
                                .then(() => {
                                    sftp.fastPut(file.localPath, file.remotePath)
                                        .then(() => {
                                            console.log('上传成功',iIndex)
                                        })
                                        .catch((err) => {
                                            // console.log(err, '上传失败')
                                        })
                                })
                            })
                        },1000)
                    }
                    console.log('上传成功',iIndex)
                })
                .catch((err) => {
                    // console.log(err, '上传失败')
                })
        })
    })
    
    // Promise.all(first)
}

uploadFile()
// fs.watchFile(localPath,(curr,prev)=>{
//     console.log(curr)
//     sftp.connect(sfpOptions).then(() => {
//         sftp.fastPut(`${localPath}/js/common.js`, `${remotePath}/demo.js`,(msg=>{
//             console.log(msg)
//         }));
//         // return sftp.list(remotePath);
//     }).then((data) => {
//         // console.log(data, 'the data info');
//     }).catch((err) => {
//         console.log(err, 'catch error');
//     });
// })