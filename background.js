// set the proxy settings for Chrome extension
const host = '127.0.0.1';
const port = 2334;

// bypass and block list
let cachedBypassList = [
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
    ,"gitee.com"
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
    ,"*.alal.site"
    ,"*.douyin.com"
    ,"*.deepseek.com"
    ,"*.xunlei.com"
    ,"*.weibo.com"
    ,"*.cn"
    ,"*.postman.co"
];
let cachedBlockList = [
    "*.baidu.com"
];

// apply the proxy settings
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
    ['open', 'close'].forEach(id => {
        chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
    });
});

// listener for context menu clicks
chrome.contextMenus.onClicked.addListener(info => {
    switch (info.menuItemId) {
        case 'open': applyProxy(); break;
        case 'close': clearProxy(); break;
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

// when windows closed, clear history
chrome.windows.onRemoved.addListener(async windowId => {
    console.log(`windows ${windowId} hasten closed`);

    for (const domain of cachedBlockList) {
        try {
            const results = await chrome.history.search({
                text: domain.startsWith('*.') ? domain.slice(2) : domain,
                maxResults: 1000
            });

            await Promise.all(
                results
                    .filter(item => isMatchDomain(new URL(item.url).hostname, domain))
                    .map(item => chrome.history.deleteUrl({ url: item.url }))
            );

            console.log(`Cleared history for domain: ${domain}`);
        } catch (err) {
            console.error(`Error clearing history for domain ${domain}:`, err);
        }
    }
});