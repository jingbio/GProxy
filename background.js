chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateProxy") {
    const { host, port } = message;
    const updatedProxyConfig = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: host,
          port: parseInt(port, 10)
        },
        bypassList: ["localhost", "127.0.0.1"]
      }
    };
    
    chrome.proxy.settings.set(
      { value: updatedProxyConfig, scope: 'regular' },
      () => {
        // Check for errors and provide feedback
        if (chrome.runtime.lastError) {
          console.error("Proxy settings error:", chrome.runtime.lastError.message);
          sendResponse({ success: false });
        } else {
          sendResponse({ success: true });
        }
      }
    );
    
    // Indicate that the response will be sent asynchronously
    return true;
  }
});
