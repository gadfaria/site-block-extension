console.log("popup.js");

// In-page cache of the user's options
let blockedSites = [];

let sites = document.getElementById("site-list");

const button = document.getElementById("clear");

// Initialize the form with the user's option settings
chrome.storage.sync.get("blockedSites", (data) => {
  blockedSites = [...(data?.blockedSites || [])];

  blockedSites.forEach((site) => {
    let li = document.createElement("li");
    li.innerText = site;
    sites.appendChild(li);
  });
});

button.addEventListener("click", async () => {
  chrome.storage.sync.set({ blockedSites: [] });
});

document
  .getElementById("add-site-form")
  .addEventListener("submit", function (e) {
    console.log("gabiruu");
    // Send the query from the form to the background page.
    const value = document.getElementById("add-site-input").value;
    blockedSites = [...blockedSites, value];
    chrome.storage.sync.set({ blockedSites });

    let li = document.createElement("li");
    li.innerText = value;
    sites.appendChild(li);

    e.preventDefault();
  });
