const path=require('path')

let config={
    //是否启用本地调试
    debug:true,
    //日志目录
    log_dir:path.join('./','logs'),
    //程序运行端口
    port:8888,
    //系统域名
    host:'localhost',
}

module.exports=config