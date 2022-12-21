console.log("popup.js");

// In-page cache of the user's options
let blockedSites = [];

let sites = document.getElementById("list");

// Initialize the form with the user's option settings
chrome.storage.sync.get("blockedSites", (data) => {
  blockedSites = [...(data?.blockedSites || [])];

  blockedSites.forEach((site) => {
    let li = document.createElement("li");
    // li.innerText = site;
    li.innerHTML += `<span>${site}</span><div class="remove">Remove</div>`;
    li.addEventListener("click", removeSite);
    sites.appendChild(li);
  });
});

function removeSite(e) {
  const site = e.target.previousSibling.innerText;

  blockedSites = blockedSites.filter((s) => s !== site);
  chrome.storage.sync.set({ blockedSites });

  e.target.parentNode.remove();
}

const form = document.getElementById("form");

form.addEventListener("submit", function (e) {
  // Send the query from the form to the background page.
  const input = document.getElementById("input");

  if(!input.value) return;

  blockedSites = [...blockedSites, input.value];
  chrome.storage.sync.set({ blockedSites });

  let li = document.createElement("li");
  // li.innerText = input.value;

  // li.innerHTML += `${input.value}<button class="remove">Remove</button>`;
  li.innerHTML += `<span>${input.value}</span><div class="remove">Remove</div>`;
  li.addEventListener("click", removeSite);

  input.value = "";

  sites.appendChild(li);

  e.preventDefault();
});

form.addEventListener("reset", function (e) {
  chrome.storage.sync.set({ blockedSites: [] });
  sites.innerHTML = "";
});

// document.addEventListener("input", (e) => {
//   const el = e.target;

//   if (el.matches("[data-color]")) {
//     clearTimeout(timer);
//     timer = setTimeout(() => {
//       document.documentElement.style.setProperty(
//         `--color-${el.dataset.color}`,
//         el.value
//       );
//     }, 100);
//   }
// });
