// 配置常量
const host = '127.0.0.1';
const port = 2334;
const url = 'https://alal.site/bypass.json';
const blockUrl = 'https://alal.site/block.json';

const defaultBypass = [
    '192.168.0.0/16',
    '194.1.0.0/16',
    '10.0.0.0/8',
    '100.64.0.0/16',
    '127.16.0.0/16'
];

// 缓存 bypass 和 block 列表
let cachedBypassList = [];
let cachedBlockList = [];

// 加载 bypass 列表
async function loadBypassList() {
    try {
        const res = await fetch(url);
        const data = await res.json();
        cachedBypassList = data;
        await chrome.storage.local.set({ bypass: data });
        console.log('bypass列表已更新:', data);
    } catch (error) {
        console.error('加载 bypass 出错，使用默认列表', error);
        cachedBypassList = defaultBypass;
        await chrome.storage.local.set({ bypass: defaultBypass });
    }
}

// 加载 block 列表
async function loadBlockList() {
    try {
        const res = await fetch(blockUrl);
        const data = await res.json();
        cachedBlockList = data;
        await chrome.storage.local.set({ block: data });
        console.log('block列表已更新:', data);
    } catch (error) {
        console.error('加载 block 出错，使用空列表', error);
        cachedBlockList = [];
        await chrome.storage.local.set({ block: [] });
    }
}

// 统一加载并定时刷新
async function loadBypassAndBlockList() {
    await Promise.all([loadBypassList(), loadBlockList()]);
}
loadBypassAndBlockList();
setInterval(loadBypassAndBlockList, 3600000); // 每小时刷新一次

// 获取本地存储数据（用于首次启动）
async function initCachedLists() {
    const { bypass = defaultBypass, block = [] } = await chrome.storage.local.get(['bypass', 'block']);
    cachedBypassList = bypass;
    cachedBlockList = block;
}
initCachedLists();

// 设置代理
async function applyProxy() {
    try {
        const config = {
            mode: 'fixed_servers',
            rules: {
                singleProxy: { scheme: 'http', host, port },
                bypassList: cachedBypassList
            }
        };
        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            if (chrome.runtime.lastError) {
                console.error('设置代理失败:', chrome.runtime.lastError.message);
            } else {
                console.info('代理已启用');
            }
        });
    } catch (err) {
        console.error('设置代理出错:', err);
    }
}

// 清除代理
function clearProxy() {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
        if (chrome.runtime.lastError) {
            console.error('清除代理失败:', chrome.runtime.lastError.message);
        } else {
            console.info('代理已清除');
        }
    });
}

// 创建右键菜单
['open', 'close'].forEach(id => {
    chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
});

// 右键菜单事件处理
chrome.contextMenus.onClicked.addListener(info => {
    switch (info.menuItemId) {
        case 'open': applyProxy(); break;
        case 'close': clearProxy(); break;
    }
});

// 判断是否匹配黑名单域名
function isMatchDomain(hostname, domain) {
    if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
    }
    return hostname === domain;
}

// 窗口关闭时清理历史记录
chrome.windows.onRemoved.addListener(async windowId => {
    console.log(`窗口 ${windowId} 已关闭`);
    const blockList = cachedBlockList.length > 0 ? cachedBlockList : await getBlockListFromStorage();

    for (const domain of blockList) {
        const query = domain.startsWith('*.') ? domain.slice(2) : domain;
        try {
            const results = await chrome.history.search({ text: query, maxResults: 1000 });
            for (const item of results) {
                const { hostname } = new URL(item.url);
                if (isMatchDomain(hostname, domain)) {
                    await chrome.history.deleteUrl({ url: item.url });
                    console.log(`已删除历史记录：${item.url}`);
                }
            }
        } catch (err) {
            console.error('删除历史记录出错:', err);
        }
    }

    removeLocalData();
});

// 辅助方法：从 storage 获取 block 列表
async function getBlockListFromStorage() {
    const data = await chrome.storage.local.get('block');
    return data.block || [];
}

// 清除本地数据
function removeLocalData() {
    chrome.storage.local.remove(['bypass', 'block']);
}
