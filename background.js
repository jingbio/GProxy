// 配置常量
const host = '127.0.0.1';
const port = 2334;

// 缓存 bypass 和 block 列表
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
];
let cachedBlockList = [
    "*.xvideos.com"
    ,"*.pornhub.com"
    ,"*.xhamster.com"
    ,"*.redtube.com"
    ,"*.youjizz.com"
    ,"*.tnaflix.com"
    ,"*.tube8.com"
    ,"*.youporn.com"
    ,"*.spankwire.com"
    ,"*.hentaihaven.com"
    ,"*.baidu.com"
];

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
chrome.contextMenus.removeAll(() => {
    ['open', 'close'].forEach(id => {
        chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
    });
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

    for (const domain of cachedBlockList) {
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
});