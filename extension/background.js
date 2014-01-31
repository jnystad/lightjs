chrome.browserAction.onClicked.addListener(function(activeTab) {
    chrome.tabs.create({ url: chrome.extension.getURL('tab.html'), selected: true });
});
