var enabled = false;

// 监听浏览器启动事件，确保代理连接
chrome.runtime.onStartup.addListener(() => {
    if (enabled) {
        connectToProxy();
    }
});

// 监听浏览器打开新窗口时的事件，确保代理连接
chrome.windows.onCreated.addListener(() => {
    if (enabled) {
        connectToProxy();
    }
});

// 定义连接代理的函数
function connectToProxy() {
    const updatedProxyConfig = {
        mode: "fixed_servers",
        rules: {
            singleProxy: {
                scheme: "http",
                host: '127.0.0.1',
                port: 2334
            },
            bypassList: ["localhost", "127.0.0.1", "194.1.1.240", "gitee.com"]
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
