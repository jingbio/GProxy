//var enabled = false;
//创建连接
function connectToProxy() {

    //定义代理参数
    const config = {
        mode: 'fixed_servers',
        rules: {
            singleProxy: {
                scheme: 'http',
                host: '127.0.0.1',
                port: 2334
            },
            bypassList: [
                "192.168.0.0/16"
                ,"194.1.0.0/16"
                ,"10.0.0.0/8"
                ,"100.64.0.0/16"
                ,"127.16.0.0/16"
                ,"*.baidu.com"
                ,"*.163.com"
                ,"*.qq.com"
                ,"*.jd.com"
                ,"*.360.com"
                ,"*.hutool.cn"
                ,"*.taobao.com"
                ,"*.cnblogs.com"
                ,"*.csdn.net"
                ,"*.gitee.com"
                ,"*.bilibili.com"
                ,"*.douyin.com"
                ,"*.cn"
                ,"*.4399.com"
                ,"*.51.net"
                ,"*.51cto.com"
                ,"*.51job.com"
                ,"*.58.com"
                ,"*.7k7k.com"
                ,"*.91.com"
                ,"*.alipan.com"
                ,"*.alicdn.com"
                ,"*.alibaba.com"
                ,"*.alibabacloud.com"
                ,"*.alipay.com"
                ,"*.aliyun.com"
                ,"*.biliapi.com"
                ,"*.biliapi.net"
                ,"*.bilibili.com"
                ,"*.bilibili.tv"
                ,"*.bilicomic.com"
                ,"*.biligame.com"
                ,"*.biligame.net"
                ,"*.bilivideo.com"
                ,"*.douyu.com"
                ,"*.hao123.com"
                ,"*.huya.com"
                ,"*.iqiyi.com"
                ,"*.jianshu.*"
                ,"*.kuaishou.com"
                ,"*.layui.com"
                ,"*.qqmail.com"
                ,"*.sina.com"
                ,"*.sogou.com"
                ,"*.taobao.com"
                ,"*.tencent-cloud.com"
                ,"*.tencent.com"
                ,"*.xiaomi.com"
                ,"*.zhihu.com"
            ]
        }
    };

    //设置代理生效
    chrome.proxy.settings.set(
        { value: config, scope: 'regular' },
        () => {
            if (chrome.runtime.lastError) {
                console.error('error->>>>>>>> ', chrome.runtime.lastError.message);
            } else {
                console.info('success!');
            }
        }
    );
}

// 定义取消代理连接的函数
function disconnectFromProxy() {
    chrome.proxy.settings.clear(
        { scope: 'regular' },
        () => {
            if (chrome.runtime.lastError) {
                console.error('clear config error->>>>>>>> ', chrome.runtime.lastError.message);
                sendResponse({ success: false });
            } else {
                console.log('proxy cleared!');
                sendResponse({ success: true });
            }
        }
    );
}

// 创建右键菜单项
chrome.contextMenus.create({
    id: 'enablePlugin',
    title: 'open',
    contexts: ['all']
});

chrome.contextMenus.create({
    id: 'disablePlugin',
    title: 'close',
    contexts: ['all']
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'enablePlugin') {
        //enabled = true;
        connectToProxy();
    } else if (info.menuItemId === 'disablePlugin') {
        //enabled = false;
        disconnectFromProxy();
    }
});
