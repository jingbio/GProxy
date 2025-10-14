// set the proxy settings for Chrome extension
const host = '127.0.0.1';
const port = 2336;
const scheme = 'socks5'; // 'http', 'https', 'socks4', 'socks5'

// bypass and block list
let cachedBypassList = [
    "192.168.0.0/16"
    ,"194.1.0.0/16"
    ,"10.0.0.0/8"
    ,"100.64.0.0/16"
    ,"127.16.0.0/16"
    ,"*baidu.com"
    ,"*163.com"
    ,"*qq.com"
    ,"*jd.com"
    ,"*360.com"
    ,"*hutool.cn"
    ,"*taobao.com"
    ,"*cnblogs.com"
    ,"*csdn.net"
    ,"*gitee.com"
    ,"*bilibili.com"
    ,"*cn"
    ,"*4399.com"
    ,"*51.net"
    ,"*51cto.com"
    ,"*51job.com"
    ,"*58.com"
    ,"*7k7k.com"
    ,"*91.com"
    ,"*alipan.com"
    ,"*alicdn.com"
    ,"*alibaba.com"
    ,"*alibabacloud.com"
    ,"*alipay.com"
    ,"*aliyun.com"
    ,"*biliapi.com"
    ,"*biliapi.net"
    ,"*bilibili.com"
    ,"*bilibili.tv"
    ,"*bilicomic.com"
    ,"*biligame.com"
    ,"*biligame.net"
    ,"*bilivideo.com"
    ,"*douyu.com"
    ,"*hao123.com"
    ,"*huya.com"
    ,"*iqiyi.com"
    ,"*jianshu.*"
    ,"*kuaishou.com"
    ,"*layui.com"
    ,"*qqmail.com"
    ,"*sina.com"
    ,"*sogou.com"
    ,"*taobao.com"
    ,"*tencent-cloud.com"
    ,"*tencent.com"
    ,"*xiaomi.com"
    ,"*zhihu.com"
    ,"*douyin.com"
    ,"*deepseek.com"
    ,"*xunlei.com"
    ,"*weibo.com"
    ,"*postman.co"
    ,"gtool.alal.site"
];
let cachedBlockList = [
    "*pornhub.com"
    ,"*xvideos.com"
];

// apply the proxy settings
async function applyProxy() {
    try {
        const config = {
            mode: 'fixed_servers',
            rules: {
                singleProxy: { scheme: scheme, host, port },
                bypassList: cachedBypassList
            }
        };
        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            if (chrome.runtime.lastError) {
                console.error('set proxy error:', chrome.runtime.lastError.message);
            } else {
                console.info('proxy applied successfully');
            }
        });
    } catch (err) {
        console.error('apply proxy error:', err);
    }
}

// clear the proxy settings
function clearProxy() {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
        if (chrome.runtime.lastError) {
            console.error('clear proxy error:', chrome.runtime.lastError.message);
        } else {
            console.info('clear proxy successfully');
        }
    });
}

chrome.contextMenus.removeAll(() => {
    ['open', 'close','clearHistory'].forEach(id => {
        chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
    });
});

// listener for context menu clicks
chrome.contextMenus.onClicked.addListener(info => {
    switch (info.menuItemId) {
        case 'open': applyProxy(); break;
        case 'close': clearProxy(); break;
        case 'clearHistory': clearHistory(); break;
    }
});

// check if the hostname matches the domain
function isMatchDomain(hostname, domain) {
    if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
    }
    return hostname === domain;
}

// clear history
async function clearHistory() {
    for (const domain of cachedBlockList) {
        try {
            // results in broader search
            const searchText = domain.startsWith('*.') ? domain.slice(2) : domain;

            // async query history
            const results = await chrome.history.search({
                text: searchText,
                maxResults: 1000
            });

            // fillter and delete match url
            const deletions = results.map(item => {
                try {
                    const hostname = new URL(item.url).hostname;
                    if (isMatchDomain(hostname, domain)) {
                        return chrome.history.deleteUrl({ url: item.url });
                    }
                } catch (e) {
                    //ignore can't match url
                }
                return null;
            }).filter(Boolean);

            await Promise.all(deletions);
            console.log(`✅ Cleared history for domain: ${domain}`);
        } catch (err) {
            console.error(`❌ Error clearing history for domain ${domain}:`, err);
        }
    }
}
