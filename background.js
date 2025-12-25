// set the proxy settings for Chrome extension
const host = '127.0.0.1';
const port = 2334;
const scheme = 'http'; // 'http', 'https', 'socks4', 'socks5'

// bypass and block list
let cachedBypassList = [
    "10.0.0.0/8"
    ,"100.64.0.0/16"
    ,"127.16.0.0/16"
    ,"192.168.0.0/16"
    ,"194.1.0.0/16"
    ,"*163.com"
    ,"*360.com"
    ,"*4399.com"
    ,"*51.net"
    ,"*51cto.com"
    ,"*51job.com"
    ,"*58.com"
    ,"*7k7k.com"
    ,"*alibaba.com"
    ,"*alibabacloud.com"
    ,"*alicdn.com"
    ,"*alipan.com"
    ,"*alipay.com"
    ,"*aliyun.com"
    ,"*baidu.com"
    ,"*bilibili.com"
    ,"*cn"
    ,"*cnblogs.com"
    ,"*csdn.net"
    ,"*deepseek.com"
    ,"*douyin.com"
    ,"*douyu.com"
    ,"*gitee.com"
    ,"*hutool.cn"
    ,"*huya.com"
    ,"*iqiyi.com"
    ,"*ixigua.com"
    ,"*jianshu.*"
    ,"*jd.com"
    ,"*kuaishou.com"
    ,"*layui.com"
    ,"*postman.co"
    ,"*qq.com"
    ,"*qzone.qq.com"
    ,"*sina.com"
    ,"*sogou.com"
    ,"*sohu.com"
    ,"*taobao.com"
    ,"*tencent.com"
    ,"*tmall.com"
    ,"*toutiao.com"
    ,"*weibo.com"
    ,"*wechat.com"
    ,"*weixin.qq.com"
    ,"*xiaomi.com"
    ,"*xunlei.com"
    ,"*youku.com"
    ,"*zhihu.com"
    ,"*alal.site"
];
let cachedBlockList = [
    "*pornhub.com"
    ,"*xvideos.com"
    ,"*xhamster.com"
    ,"*xnxx.com"
    ,"*redtube.com"
    ,"*youporn.com"
    ,"*youjizz.com"
    ,"*tube8.com"
    ,"*spankbang.com"
    ,"*tnaflix.com"
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
    ['open(Ctrl+Shift+Space)', 'close(Ctrl+Space)','clearHistory'].forEach(id => {
        chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
    });
});

// listener for context menu clicks
chrome.contextMenus.onClicked.addListener(info => {
    switch (info.menuItemId) {
        case 'open(Ctrl+Shift+Space)': applyProxy(); break;
        case 'close(Ctrl+Space)': clearProxy(); break;
        case 'clearHistory': clearHistory(); break;
    }
});

// check if the hostname matches the domain
function isMatchDomain(hostname, domain) {
    // 支持 *.example.com
    if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
    }

    // 支持 *example.com（你的写法）
    if (domain.startsWith('*')) {
        const baseDomain = domain.slice(1);
        return hostname === baseDomain || hostname.endsWith(baseDomain);
    }

    // 完全匹配
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

            // filter and delete match url
            const deletions = results.map(item => {
                try {
                    return isMatchDomain(new URL(item.url).hostname, domain) ? chrome.history.deleteUrl({url: item.url}) : null;
                } catch (e) {
                    //ignore can't match url
                }
            }).filter(Boolean);

            await Promise.all(deletions);
            console.log(`✅ Cleared history for domain: ${domain}`);
        } catch (err) {
            console.error(`❌ Error clearing history for domain ${domain}:`, err);
        }
    }
}
// command
chrome.commands.onCommand.addListener((command) => {
    if (command === "open-proxy") {
        applyProxy();
    } else if (command === "close-proxy") {
        clearProxy();
    } else {
        clearHistory();
    }
});

