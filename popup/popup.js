console.log("popup.js");

// In-page cache of the user's options
let blockedSites = [];

// DOM elements
const sites = document.getElementById("sites");
const form = document.getElementById("form");
const input = document.getElementById("field__input");

// Get the current tab's URL
async function getCurrentUrl() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`
  let [tab] = await chrome.tabs.query(queryOptions);

  return new URL(tab.url).hostname;
}

// Remove a site from the list by clicking on remove button
function removeSite(e) {
  const site = e.target.previousSibling.innerText;

  blockedSites = blockedSites.filter((s) => s !== site);
  chrome.storage.sync.set({ blockedSites });

  e.target.parentNode.remove();
}

// Open the popup's with current tab's URL
input.value = (await getCurrentUrl()) || "";

// Initialize the form with the user's option settings
chrome.storage.sync.get("blockedSites", (data) => {
  blockedSites = [...(data?.blockedSites || [])];

  blockedSites.forEach((site) => {
    let li = document.createElement("li");
    li.innerHTML += `<span>${site}</span><div id="sites__remove">Remove</div>`;
    li.addEventListener("click", removeSite);
    sites.appendChild(li);
  });
});

form.addEventListener("reset", function (e) {
  chrome.storage.sync.set({ blockedSites: [] });
  sites.innerHTML = "";
});

form.addEventListener("submit", function (e) {
  // Send the query from the form to the background page.
  if (!input.value) return;

  blockedSites = [...blockedSites, input.value];
  chrome.storage.sync.set({ blockedSites });

  // Add the site to the list
  let li = document.createElement("li");
  li.innerHTML += `<span>${input.value}</span><div id="sites__remove">Remove</div>`;
  li.addEventListener("click", removeSite);

  input.value = "";

  sites.appendChild(li);

  e.preventDefault();
});
