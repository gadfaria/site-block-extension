let blockedSites = [];

chrome.storage.sync.get("blockedSites", (data) => {
  if (data?.blockedSites) {
    blockedSites = data.blockedSites;
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.blockedSites) {
    blockedSites = changes.blockedSites.newValue;
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo?.url) {
    const hasBlockedSite = blockedSites.some((site) => {
      return changeInfo.url.includes(site);
    });

    if (hasBlockedSite) {
      chrome.tabs.update(tab.id, { url: "images/saidaqui.png" });
    }
  }
});
