console.log("popup.js");

// In-page cache of the user's options
let blockedSites = [];

// DOM elements
const sites = document.getElementById("sites");
const form = document.getElementById("form");
const textInput = document.getElementById("text__input");
const switchInput = document.getElementById("switch__input");
const loading = document.getElementById("loading");

setTimeout(() => {
  loading.remove();
}, 500);

// Get the current tab's URL
async function getCurrentUrl() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`
  let [tab] = await chrome.tabs.query(queryOptions);

  return tab?.url ? new URL(tab.url).hostname : "";
  ƒ;
}

// Remove a site from the list by clicking on remove button
function removeSite(e) {
  const site = e.target.previousSibling.innerText;

  blockedSites = blockedSites.filter((s) => s !== site);
  chrome.storage.sync.set({ blockedSites });

  e.target.parentNode.remove();
}

// Open the popup's with current tab's URL
textInput.value = await getCurrentUrl();

// Update the user's option settings
switchInput.addEventListener("change", function (e) {
  chrome.storage.sync.set({ enabled: e.target.checked });
});

// Initialize the form with the user's option settings
chrome.storage.sync.get("blockedSites", (data) => {
  console.log(data);
  blockedSites = [...(data?.blockedSites || [])];

  blockedSites.forEach((site) => {
    let li = document.createElement("li");
    li.innerHTML += `<span>${site}</span><div id="sites__remove">Remove</div>`;
    li.addEventListener("click", removeSite);
    sites.appendChild(li);
  });
});

chrome.storage.sync.get("enabled", (data) => {
  switchInput.checked = data.enabled;
});

form.addEventListener("reset", function (e) {
  chrome.storage.sync.set({ blockedSites: [] });
  sites.innerHTML = "";
});

form.addEventListener("submit", function (e) {
  // Send the query from the form to the background page.
  if (!textInput.value) return;

  blockedSites = [...blockedSites, textInput.value];
  chrome.storage.sync.set({ blockedSites });

  // Add the site to the list
  let li = document.createElement("li");
  li.innerHTML += `<span>${textInput.value}</span><div id="sites__remove">Remove</div>`;
  li.addEventListener("click", removeSite);

  textInput.value = "";

  sites.appendChild(li);

  e.preventDefault();
});
