var enabled = false;
//创建连接
function connectToProxy() {
    const updatedProxyConfig = {
        mode: "fixed_servers",
        rules: {
            singleProxy: {
                scheme: "http",
                host: '127.0.0.1',
                port: 2334
            },
            bypassList: [
                "192.168.0.0/16"
                ,"194.1.0.0/16"
                ,"10.0.0.0/8"
                ,"*.baidu.com"
                ,"*.163.com"
                ,"*.qq.com"
                ,"*.jd.com"
                ,"*.taobao.com"
                ,"*.cnblogs.com"
                ,"*.csdn.com"
                ,"*.gitee.com"
                ,"*.bilibili.com"
                ,"*.douyin.com"
            ]
        }
    };
    chrome.proxy.settings.set(
        { value: updatedProxyConfig, scope: 'regular' },
        () => {
            if (chrome.runtime.lastError) {
                console.error("代理设置错误:", chrome.runtime.lastError.message);
            } else {
                console.log("代理已连接成功！");
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
                console.error("清除代理设置错误:", chrome.runtime.lastError.message);
                sendResponse({ success: false });
            } else {
                console.log("代理已断开！");
                sendResponse({ success: true });
            }
        }
    );
}

// 创建右键菜单项
chrome.contextMenus.create({
    id: 'enablePlugin',
    title: '启用插件',
    contexts: ['all']
});

chrome.contextMenus.create({
    id: 'disablePlugin',
    title: '关闭插件',
    contexts: ['all']
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'enablePlugin') {
        enabled = true;
        connectToProxy();
    } else if (info.menuItemId === 'disablePlugin') {
        enabled = false;
        disconnectFromProxy();
    }
});
