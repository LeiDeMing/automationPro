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
let upCountSize = 0
let dirPath = []
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
    },
    img: {
        local: `${localPath}/img`,
        remote: `${remotePath}/static/img`
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
const isDir = function (dir, remote, kind, morePath) {
    const fileArr = fs.readdirSync(dir)
    let newfileArr = fileArr.map((d, k) => {
        let filePath = path.resolve(dir, d)
        let recursizeDir = `${morePath}/${d}`
        if (fs.statSync(filePath).isDirectory()) {
            checkDir({
                dir:{
                    remote:remote+recursizeDir
                }
            })

            isDir(`${dir}/${d}`, remote, kind, recursizeDir)
        }
        let completeLocalPath = `${dir}/${d}`;
        let pathPath = path.resolve(dir, d);
        return {
            type: kind,
            // localPath: kind !== 'img' ? completeLocalPath : !fs.statSync(pathPath).isDirectory() ? fs.readFileSync(pathPath) : null,
            localPath: !fs.statSync(pathPath).isDirectory() ? pathPath : null,
            remotePath: morePath ? `${remote}${morePath}/${d}` : `${remote}/${d}`
        }
    })

    dirPath = dirPath.concat(newfileArr)
    return dirPath
}

const handleFilesPath = function (pathObj, kind) {
    let {
        local,
        remote
    } = pathObj;
    if (fsExistsSync(local)) {
        const filesArr = isDir(local, remote, kind, '')
        return filesArr
    }
    return null;
}

const upLoadCore = function (files, index = 0) {
    if(!files){
        logger.warn('----本地目录为空----')
    }
    const splitArr = files.slice(index, index + 10)
    if (splitArr.length >= 10) {
        upLoadCore(files, index + 10)
    }
    const promiseArr = splitArr.map((f, k) => {
        new Promise((resolve, reject) => {
            if (f.localPath) {
                // let reg=new RegExp(/\.(png|jpe?g|gif|svg|css|js|map)(\?.*)?$/,'gi')

                sftp.fastPut(f.localPath, f.remotePath)
                    .then(() => {
                        logger.info('上传成功', index + k)
                        ++upCountSize && upCountSize === files.length && console.log('-----上传总数----', upCountSize) && process.exit();
                        resolve()
                    })
                    .catch((err) => {
                        logger.info('上传失败', index + k, err)
                        reject()
                    })
            }

        })
    })
    Promise.all(promiseArr)
}

const checkDir = function (pathObj) {
    Object.keys(pathObj).forEach((type, index) => {
        const {
            remote
        } = pathObj[type]
        sftp.stat(remote)
            .then(() => {
                logger.info(`-${remote}　-　目录已存在\n`)
            })
            .catch((err) => {
                sftp.mkdir(remote)
                logger.info(`-${remote}　-　新建目录成功\n`)
            })
    })
}

const uploadFile = function () {
    sftp.end()
    let files = []
    sftp.connect(sfpOptions)
        .then(() => {
            logger.info('------------sftp连接成功！！！-----------\n')
            checkDir(stataicPath);
            Object.keys(stataicPath).forEach(key => {
                let fileArr = handleFilesPath(stataicPath[key], key)
                fileArr && (files = files.concat(fileArr))
            })
            upLoadCore(files)
        })
        .catch(err => {
            logger.error('------sftp连接错误------', err)
        })
}

// fs.watch(localPath.replace('/static',''), (event, filename) => {
//     console.log(filename)
//     uploadFile()
// })
uploadFile()
