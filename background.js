importScripts('bypassList.js');
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
            bypassList: proxyBypassList
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
