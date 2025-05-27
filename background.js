// 全局配置
const host = '127.0.0.1';
const port = 2334;
// 远程共享规则
const url = 'https://i.alal.site/js/bypass.json';

//默认绕过规则
let defaultBypass = [
    "192.168.0.0/16",
    "194.1.0.0/16",
    "10.0.0.0/8",
    "100.64.0.0/16",
    "127.16.0.0/16"
];

// 异步函数用于获取 bypass 的规则数据
async function loadBypassList() {
    try {
        const response = await fetch(url);
        const bypass = await response.json();
        chrome.storage.local.set({ 'bypass': bypass });
    } catch (error) {
        console.error('使用默认bypass列表', error);
        chrome.storage.local.set({ 'bypass': defaultBypass });
    }
}

// 封装异步获取 bypass 列表
function getBypassList() {
    return new Promise((resolve) => {
        chrome.storage.local.get('bypass', ({ bypass = [] }) => {
            resolve(bypass);
        });
    });
}

// 创建连接
async function connectToProxy() {
    const bypass = await getBypassList();
    const config = {
        mode: 'fixed_servers',
        rules: {
            singleProxy: {
                scheme: 'http',
                host: host,
                port: port
            },
            bypassList: bypass
        }
    };

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

// 取消代理连接
function disconnectFromProxy() {
    chrome.proxy.settings.clear(
        { scope: 'regular' },
        () => {
            if (chrome.runtime.lastError) {
                console.error('clear config error->>>>>>>> ', chrome.runtime.lastError.message);
            } else {
                console.log('proxy cleared!');
            }
        }
    );
}

// 创建右键菜单项 开启代理
chrome.contextMenus.create({
    id: 'enablePlugin',
    title: 'open',
    contexts: ['all']
});

// 创建右键菜单项 关闭代理
chrome.contextMenus.create({
    id: 'disablePlugin',
    title: 'close',
    contexts: ['all']
});

// 创建右键菜单项 设置代理
chrome.contextMenus.create({
    id: 'setCustomProxy',
    title: 'setting',
    contexts: ['all']
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'enablePlugin') {
        connectToProxy();
    } else if (info.menuItemId === 'disablePlugin') {
        disconnectFromProxy();
    } else if (info.menuItemId === 'setCustomProxy') {
        // 你可以在这里添加自定义代理设置逻辑
    }
});

// 扩展启动时加载 bypass 列表
loadBypassList();
setInterval(loadBypassList, 3600000); // 每小时更新
