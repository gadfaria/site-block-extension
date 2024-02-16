let blockedSites = [];
let enabled = false;

chrome.runtime.onInstalled.addListener(async () => {
  renderContextMenu();
});

chrome.contextMenus.onClicked.addListener((item, tab) => {
  switch (item.menuItemId) {
    case "enable/disable":
      enabled = !enabled;
      chrome.storage.sync.set({ enabled });
      return;
    case "block":
      const url = new URL(tab.url).hostname;
      chrome.storage.sync.set({ blockedSites: [...blockedSites, url] });
      return;
  }
});

chrome.storage.sync.get("blockedSites", (data) => {
  if (data.blockedSites) blockedSites = data.blockedSites;
});

chrome.storage.sync.get("enabled", (data) => {
  enabled = data.enabled;
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.blockedSites) {
    const uniqueBlockedSites = [...new Set(changes.blockedSites.newValue)];
    blockedSites = uniqueBlockedSites;
    checkAllTabsURL();
  }

  if (changes.enabled) {
    enabled = changes.enabled.newValue;
    renderContextMenu();
    checkAllTabsURL();
  }
});

chrome.tabs.onUpdated.addListener(function (_, changeInfo, tab) {
  if (!changeInfo?.url || !enabled) return;

  const hasBlockedSite = blockedSites.some((site) => {
    return changeInfo.url.includes(site);
  });

  if (hasBlockedSite)
    chrome.tabs.update(tab.id, { url: "https://not-today.gadfaria.com/" });
});

function renderContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "site-block",
      title: "SiteBlock",
      type: "normal",
    });

    chrome.contextMenus.create({
      parentId: "site-block",
      id: "enable/disable",
      title: enabled ? "Disable" : "Enable",
      type: "normal",
    });

    chrome.contextMenus.create({
      parentId: "site-block",
      id: "block",
      title: "Block this site",
      type: "normal",
    });
  });
}

function checkAllTabsURL() {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) => {
      if (!enabled || !blockedSites.length || !tab.url) return;

      const hasBlockedSite = blockedSites.some((site) => {
        return tab.url.includes(site);
      });

      if (hasBlockedSite)
        chrome.tabs.update(tab.id, {
          url: "https://not-today.gadfaria.com/",
        });
    });
  });
}
