let blockedSites = [];
let enabled = false;

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.sync.get(["blockedSites", "enabled"]);
  blockedSites = data.blockedSites || [];
  enabled = data.enabled !== undefined ? data.enabled : false;

  renderContextMenu();
});

// Add password verification in context menu
chrome.contextMenus.onClicked.addListener((item, tab) => {
  switch (item.menuItemId) {
    case "enable/disable":
      // If disabling, check if password protected
      if (enabled) {
        chrome.storage.sync.get("passwordHash", (data) => {
          if (data.passwordHash) {
            // If password protected, open popup for verification
            chrome.action.openPopup();
            return;
          }
          
          // If no password, disable normally
          enabled = false;
          chrome.storage.sync.set({ enabled });
        });
      } else {
        // Enabling always works without password
        enabled = true;
        chrome.storage.sync.set({ enabled });
      }
      break;
    case "block":
      try {
        const url = new URL(tab.url);
        const domain = url.hostname;

        if (!blockedSites.includes(domain)) {
          chrome.storage.sync.set({ blockedSites: [...blockedSites, domain] });
        }
      } catch (error) {
        console.error("Invalid URL:", error);
      }
      break;
  }
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

chrome.storage.sync.get(["blockedSites", "enabled"], (data) => {
  if (data.blockedSites) blockedSites = data.blockedSites;
  if (data.enabled !== undefined) enabled = data.enabled;
});

chrome.tabs.onUpdated.addListener(function (_, changeInfo, tab) {
  if (!changeInfo?.url || !enabled) return;

  const hasBlockedSite = isBlockedURL(changeInfo.url);

  if (hasBlockedSite)
    chrome.tabs.update(tab.id, { url: "https://not-today.gadfaria.com/" });
});

function isBlockedURL(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;
    const fullUrl = urlString.toLowerCase();

    return blockedSites.some((blockedItem) => {
      const item = blockedItem.toLowerCase();

      if (hostname === item || hostname.endsWith("." + item)) {
        return true;
      }

      if (hostname.includes(item) || fullUrl.includes(item)) {
        return true;
      }

      return false;
    });
  } catch (e) {
    console.error("Error parsing URL:", e);
    return false;
  }
}

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

// These functions can still work with just host permissions
// because we have http://*/* and https://*/* in host_permissions
function checkAllTabsURL() {
  if (!enabled || !blockedSites.length) return;

  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) => {
      if (!tab.url) return;

      if (isBlockedURL(tab.url)) {
        chrome.tabs.update(tab.id, {
          url: "https://not-today.gadfaria.com/",
        });
      }
    });
  });
}
