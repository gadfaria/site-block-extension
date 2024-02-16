console.log("popup.js");

// In-page cache of the user's options
let blockedSites = [];

const TRASH_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.5 4.98341C14.725 4.70841 11.9333 4.56675 9.15 4.56675C7.5 4.56675 5.85 4.65008 4.2 4.81675L2.5 4.98341M7.08333 4.14175L7.26667 3.05008C7.4 2.25841 7.5 1.66675 8.90833 1.66675H11.0917C12.5 1.66675 12.6083 2.29175 12.7333 3.05841L12.9167 4.14175M15.7083 7.61675L15.1667 16.0084C15.075 17.3167 15 18.3334 12.675 18.3334H7.325C5 18.3334 4.925 17.3167 4.83333 16.0084L4.29167 7.61675M8.60833 13.7501H11.3833M7.91667 10.4167H12.0833" stroke="#ECF0F1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// DOM elements
const sites = document.getElementById("list");
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
  blockedSites = [...(data?.blockedSites || [])];

  blockedSites.forEach((site) => {
    let li = document.createElement("li");
    li.innerHTML += `<span>${site}</span><div id="list__remove">${TRASH_ICON}</div>`;
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
  li.innerHTML += `<span>${textInput.value}</span><div id="list__remove">${TRASH_ICON}</div>`;
  li.addEventListener("click", removeSite);

  textInput.value = "";

  sites.appendChild(li);

  e.preventDefault();
});
