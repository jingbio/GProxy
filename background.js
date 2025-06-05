const host = '127.0.0.1';
const port = 2334;
const url = 'https://alal.site/bypass.json';
const block = 'https://alal.site/block.json';

const defaultBypass = [
    '192.168.0.0/16',
    '194.1.0.0/16',
    '10.0.0.0/8',
    '100.64.0.0/16',
    '127.16.0.0/16'
];

// 统一获取并保存数据
async function loadBypassAndBlockList() {
    try {
        const [bypassRes, blockRes] = await Promise.all([fetch(url), fetch(block)]);
        const [bypass, blockList] = await Promise.all([bypassRes.json(), blockRes.json()]);
        await chrome.storage.local.set({ bypass, block: blockList });
        console.log('bypass列表已更新:', bypass);
        console.log('block列表已更新:', blockList);
    } catch (error) {
        console.error('使用默认bypass列表', error);
        await chrome.storage.local.set({ bypass: defaultBypass, block: [] });
    }
}

function getList(key) {
    return new Promise(resolve => {
        chrome.storage.local.get(key, data => resolve(data[key] || []));
    });
}

async function getBypassList() {
    return getList('bypass');
}

async function getBlockList() {
    return getList('block');
}

function removeLocalData() {
    chrome.storage.local.remove(['bypass', 'block']);
}

async function applyProxy() {
    try {
        const bypass = await getBypassList();
        const config = {
            mode: 'fixed_servers',
            rules: {
                singleProxy: { scheme: 'http', host, port },
                bypassList: bypass
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
['open', 'close', 'setting'].forEach(id => {
    chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
});

chrome.contextMenus.onClicked.addListener(info => {
    switch (info.menuItemId) {
        case 'open': applyProxy(); break;
        case 'close': clearProxy(); break;
        case 'setting': /* 这里可以加自定义逻辑 */ break;
    }
});

// 启动时加载列表并定时更新
loadBypassAndBlockList();
setInterval(loadBypassAndBlockList, 3600000);

// 黑名单清理逻辑
async function isBlockedDomain(hostname) {
    const bypassList = await getBypassList();
    return bypassList.some(domain => {
        if (domain.startsWith('*.')) {
            const plainDomain = domain.slice(2);
            return hostname === plainDomain || hostname.endsWith(`.${plainDomain}`);
        }
        return hostname === domain;
    });
}

chrome.windows.onRemoved.addListener(async windowId => {
    console.log(`窗口 ${windowId} 已关闭`);
    const blockList = await getBlockList();
    console.log('黑名单列表:', blockList);

    for (const domain of blockList) {
        const query = domain.startsWith('*.') ? domain.slice(2) : domain;
        try {
            const results = await chrome.history.search({ text: query, maxResults: 1000 });
            for (const item of results) {
                const { hostname } = new URL(item.url);
                if (
                    (domain.startsWith('*.') && (hostname === query || hostname.endsWith(`.${query}`))) ||
                    (!domain.startsWith('*.') && hostname === domain)
                ) {
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
