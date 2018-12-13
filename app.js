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
const huada = require('./config/huada')
let {
    localPath,
    remotePath,
    sfpOptions
} = huada
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
let upCountSize=0
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

const fsExistsSync = function (path) {
    try {
        fs.accessSync(path, fs.F_OK)
    } catch (e) {
        return false
    }
    return true
}

const handleFilesPath = function (pathObj, kind) {
    let {
        local,
        remote
    } = pathObj;
    if (fsExistsSync(local)) {
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
    return null;
}

const upLoadCore = function (files, index = 0) {
    const splitArr = files.slice(index, index + 10)
    if (splitArr.length >= 10) {
        upLoadCore(files, index + 10)
    }
    const promiseArr = splitArr.map((f, k) => {
        new Promise((resolve, reject) => {
            sftp.fastPut(f.localPath, f.remotePath)
                .then(() => {
                    console.log('上传成功', index + k);
                    resolve()
                    ++upCountSize && upCountSize===files.length && process.exit();
                    
                })
                .catch(() => {
                    console.warn('上传失败', index + k)
                    reject()
                })
        })
    })
    Promise.all(promiseArr)
}

const uploadFile = function () {
    sftp.end()
    let files = []
    Object.keys(stataicPath).forEach(key => {
        let fileArr=handleFilesPath(stataicPath[key], key)
        fileArr && (files = files.concat(fileArr))
    })
    sftp.connect(sfpOptions)
        .then(() => {
            upLoadCore(files)
        })
}
// fs.watch(localPath.replace('/static',''), (event, filename) => {
//     console.log(filename)
//     uploadFile()
// })
uploadFile()