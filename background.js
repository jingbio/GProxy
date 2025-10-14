// set the proxy settings for Chrome extension
const host = '127.0.0.1';
const port = 2334;
const scheme = 'socks5';
const username = 'admin';
const password = 'admin';

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

// background.js（或 service worker）
// 全局保存认证信息
let proxyAuth = null;

/**
 * 处理代理认证回调，只对 proxy 验证生效
 * 注意：必须在 manifest.json 中声明 "webRequest" 与 "webRequestAuthProvider" 等权限
 */
function handleAuthRequired(details) {
    // 如果没有认证信息，直接不处理
    if (!proxyAuth) return;

    // 仅处理 proxy 验证（如果浏览器提供 isProxy 字段）
    if (typeof details.isProxy !== 'undefined' && !details.isProxy) {
        return;
    }

    // 返回认证凭据（blocking 模式下有效）
    return { authCredentials: { username: proxyAuth.username, password: proxyAuth.password } };
}

/**
 * 应用代理设置（更安全，参数校验，返回 Promise）
 * @param {Object} opts
 * @param {"http"|"https"|"socks4"|"socks5"} opts.scheme
 * @param {string} opts.host
 * @param {number|string} opts.port
 * @param {Array<string>} [opts.bypassList]
 * @param {string} [opts.username]
 * @param {string} [opts.password]
 */
async function applyProxy() {
    try {
        //const { scheme, host, port, bypassList = [], username, password } = opts;

        // 基本校验
        const allowedSchemes = ['http', 'https', 'socks4', 'socks5'];
        if (!scheme || !allowedSchemes.includes(String(scheme))) {
            throw new Error(`invalid scheme, must be one of: ${allowedSchemes.join(', ')}`);
        }
        if (!host) throw new Error('host is required');
        if (port == null || Number.isNaN(Number(port))) throw new Error('port is required and must be a number');

        // 保存认证信息（如果同时提供用户名和密码）
        proxyAuth = (username && password) ? { username: String(username), password: String(password) } : null;

        const config = {
            mode: 'fixed_servers',
            rules: {
                singleProxy: {
                    scheme: String(scheme),
                    host: String(host),
                    port: Number(port)
                },
                // 关键：必须叫 bypassList
                bypassList: Array.isArray(cachedBypassList) ? cachedBypassList : []
            }
        };

        // 使用 Promise 封装回调，方便上层 await 并捕获错误
        await new Promise((resolve, reject) => {
            chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });

        console.info(`✅ proxy applied: ${scheme}://${host}:${port}`);

        // 先安全地移除已有 listener（如果有）
        if (chrome.webRequest.onAuthRequired.hasListener(handleAuthRequired)) {
            chrome.webRequest.onAuthRequired.removeListener(handleAuthRequired);
        }

        // 如果需要认证，注册 onAuthRequired（blocking）监听
        if (proxyAuth) {
            chrome.webRequest.onAuthRequired.addListener(
                handleAuthRequired,
                { urls: ["<all_urls>"] },
                ["blocking"]
            );
        }
    } catch (err) {
        console.error('apply proxy error:', err);
        throw err; // 可选：让调用方也能捕获
    }
}

// apply the proxy settings
// async function applyProxy() {
//     try {
//         const config = {
//             mode: 'fixed_servers',
//             rules: {
//                 singleProxy: { scheme: scheme, host, port },
//                 bypassList: cachedBypassList
//             }
//         };
//         chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
//             if (chrome.runtime.lastError) {
//                 console.error('set proxy error:', chrome.runtime.lastError.message);
//             } else {
//                 console.info('proxy applied successfully');
//             }
//         });
//     } catch (err) {
//         console.error('apply proxy error:', err);
//     }
// }

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
