let blockedSites = [];
let enabled = false;

chrome.storage.sync.get("blockedSites", (data) => {
  if (data?.blockedSites) {
    blockedSites = data.blockedSites;
  }
});

chrome.storage.sync.get("enabled", (data) => {
  enabled = data.enabled;
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.blockedSites) {
    blockedSites = changes.blockedSites.newValue;
  }
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo?.url && enabled) {
    const hasBlockedSite = blockedSites.some((site) => {
      return changeInfo.url.includes(site);
    });

    if (hasBlockedSite) {
      chrome.tabs.update(tab.id, { url: "images/saidaqui.png" });
    }
  }
});
