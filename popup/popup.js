console.log("popup.js");

// In-page cache of the user's options
let blockedSites = [];

// Variables for the password system
let passwordProtected = false;
let pendingAction = null;

const TRASH_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.5 4.98341C14.725 4.70841 11.9333 4.56675 9.15 4.56675C7.5 4.56675 5.85 4.65008 4.2 4.81675L2.5 4.98341M7.08333 4.14175L7.26667 3.05008C7.4 2.25841 7.5 1.66675 8.90833 1.66675H11.0917C12.5 1.66675 12.6083 2.29175 12.7333 3.05841L12.9167 4.14175M15.7083 7.61675L15.1667 16.0084C15.075 17.3167 15 18.3334 12.675 18.3334H7.325C5 18.3334 4.925 17.3167 4.83333 16.0084L4.29167 7.61675M8.60833 13.7501H11.3833M7.91667 10.4167H12.0833" stroke="#ECF0F1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// DOM elements
const sites = document.getElementById("list");
const form = document.getElementById("form");
const textInput = document.getElementById("block-input");
const switchInput = document.getElementById("switch__input");
const loading = document.getElementById("loading");

setTimeout(() => {
  loading.remove();
}, 500);

// Get the current tab's URL
async function getCurrentUrl() {
  try {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab?.url ? new URL(tab.url).hostname : "";
  } catch (error) {
    console.error("Error getting current URL:", error);
    return "";
  }
}

// Function to create a list item with animation
function createSiteListItem(site) {
  let li = document.createElement("li");
  li.innerHTML = `<span>${site}</span><div id="list__remove" title="Remove site">${TRASH_ICON}</div>`;

  // Add style for animation (initially with opacity 0)
  li.style.opacity = "0";
  li.style.transform = "translateY(10px)";

  const removeButton = li.querySelector("#list__remove");
  removeButton.addEventListener("click", function () {
    handleSiteRemoval(site, li);
  });

  // Force reflow and animate entry
  setTimeout(() => {
    li.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    li.style.opacity = "1";
    li.style.transform = "translateY(0)";
  }, 50);

  return li;
}

// Function to handle site removal with password verification
async function handleSiteRemoval(site, listItem) {
  // Check if password protection is enabled
  if (passwordProtected) {
    // Show password dialog
    const passwordValid = await showPasswordPrompt();

    // Only remove if password is valid
    if (passwordValid) {
      removeSite(site, listItem);
    }
  } else {
    // If no password protection, remove normally
    removeSite(site, listItem);
  }
}

// Function for removal with animation
function removeSite(site, listItem) {
  // Animate exit
  listItem.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  listItem.style.opacity = "0";
  listItem.style.transform = "translateX(-10px)";

  // Remove after animation
  setTimeout(() => {
    blockedSites = blockedSites.filter((s) => s !== site);
    chrome.storage.sync.set({ blockedSites });
    listItem.remove();

    // Check if the list is empty after removal
    if (blockedSites.length === 0) {
      document.getElementById("empty-list-message").style.display = "block";
    }
  }, 300); // Animation duration
}

function isValidUrl(url) {
  try {
    return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(url);
  } catch (error) {
    return false;
  }
}

function isValidInput(input) {
  input = input.trim();

  if (!input) return false;

  if (input.length >= 2) return true;

  return false;
}

// Function for password hashing (simplified)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Check if password is correct
async function checkPassword(password) {
  const data = await chrome.storage.sync.get("passwordHash");
  const inputHash = await hashPassword(password);
  return inputHash === data.passwordHash;
}

// Show password dialog and return a Promise
function showPasswordPrompt() {
  return new Promise((resolve) => {
    const overlay = document.getElementById("password-overlay");
    const input = document.getElementById("password-input");
    const submitBtn = document.getElementById("password-submit");
    const cancelBtn = document.getElementById("password-cancel");

    // Show overlay with animation
    overlay.style.display = "flex";
    // Force reflow to ensure transition works
    overlay.offsetHeight;
    overlay.classList.add("visible");

    input.value = "";
    input.focus();

    const handleSubmit = async () => {
      const isValid = await checkPassword(input.value);
      if (isValid) {
        // Hide overlay with animation
        overlay.classList.remove("visible");
        setTimeout(() => {
          overlay.style.display = "none";
        }, 300); // Animation duration
        resolve(true);
      } else {
        // Animate error feedback
        const container = document.getElementById("password-container");
        container.classList.add("shake");
        setTimeout(() => {
          container.classList.remove("shake");
        }, 500);

        alert("Incorrect password");
        input.value = "";
        input.focus();
      }
    };

    const handleCancel = () => {
      // Hide overlay with animation
      overlay.classList.remove("visible");
      setTimeout(() => {
        overlay.style.display = "none";
      }, 300); // Animation duration
      resolve(false);
    };

    // Configure temporary event listeners
    submitBtn.addEventListener("click", handleSubmit);
    cancelBtn.addEventListener("click", handleCancel);
    input.addEventListener("keyup", (e) => {
      if (e.key === "Enter") handleSubmit();
      if (e.key === "Escape") handleCancel();
    });

    // Clear event listeners when dialog is closed
    overlay.addEventListener("transitionend", () => {
      if (!overlay.classList.contains("visible")) {
        submitBtn.removeEventListener("click", handleSubmit);
        cancelBtn.removeEventListener("click", handleCancel);
        input.removeEventListener("keyup", handleSubmit);
      }
    });
  });
}

// Initialization
(async function init() {
  textInput.value = await getCurrentUrl();

  chrome.storage.sync.get("blockedSites", (data) => {
    blockedSites = [...(data?.blockedSites || [])];

    // Check if the list is empty and show the appropriate message
    if (blockedSites.length === 0) {
      document.getElementById("empty-list-message").style.display = "block";
    } else {
      blockedSites.forEach((site) => {
        sites.appendChild(createSiteListItem(site));
      });
    }
  });

  chrome.storage.sync.get("enabled", (data) => {
    switchInput.checked = data.enabled || false;
  });

  // Check if a password is set
  chrome.storage.sync.get("passwordHash", (data) => {
    passwordProtected = !!data.passwordHash;

    // Update UI based on password protection
    updatePasswordUI();
  });
})();

// Function to update password UI - modified to also update lock icon
function updatePasswordUI() {
  const setPasswordBtn = document.getElementById("set-password-btn");
  const removePasswordBtn = document.getElementById("remove-password-btn");
  const unlockedIcon = document.getElementById("unlocked-icon");
  const lockedIcon = document.getElementById("locked-icon");

  if (passwordProtected) {
    // Update password settings buttons
    setPasswordBtn.textContent = "Change Password";
    removePasswordBtn.style.display = "block"; // Show remove button

    // Show locked icon, hide unlocked icon
    unlockedIcon.style.display = "none";
    lockedIcon.style.display = "block";
  } else {
    // Update password settings buttons
    setPasswordBtn.textContent = "Set Password";
    removePasswordBtn.style.display = "none"; // Hide remove button

    // Show unlocked icon, hide locked icon
    unlockedIcon.style.display = "block";
    lockedIcon.style.display = "none";
  }
}

// Modify switch event listener to verify password
switchInput.addEventListener("change", async function (e) {
  if (passwordProtected && e.target.checked === false) {
    // If disabling and password-protected, request password
    e.preventDefault();

    // Restore switch state until password verification
    switchInput.checked = true;

    // Show password dialog
    const passwordValid = await showPasswordPrompt();

    if (passwordValid) {
      switchInput.checked = false;
      chrome.storage.sync.set({ enabled: false });
    }
  } else {
    // Normal behavior
    chrome.storage.sync.set({ enabled: e.target.checked });
  }
});

// Modify form reset to verify password
form.addEventListener("reset", async function (e) {
  if (passwordProtected) {
    e.preventDefault();

    const passwordValid = await showPasswordPrompt();

    if (passwordValid) {
      chrome.storage.sync.set({ blockedSites: [] });
      sites.innerHTML = "";
      document.getElementById("empty-list-message").style.display = "block";
    }
  } else {
    chrome.storage.sync.set({ blockedSites: [] });
    sites.innerHTML = "";
    document.getElementById("empty-list-message").style.display = "block";
  }
});

// Add event listeners for password configuration
document.addEventListener("DOMContentLoaded", () => {
  const setPasswordBtn = document.getElementById("set-password-btn");
  const removePasswordBtn = document.getElementById("remove-password-btn");

  // Password buttons and modal
  const lockButton = document.getElementById("lock-button");
  const passwordModal = document.getElementById("password-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");

  // Open password modal
  lockButton.addEventListener("click", () => {
    passwordModal.style.display = "flex";
    // Force reflow to ensure transition works
    passwordModal.offsetHeight;
    passwordModal.classList.add("visible");
  });

  // Close password modal
  closeModalBtn.addEventListener("click", () => {
    passwordModal.classList.remove("visible");
    setTimeout(() => {
      passwordModal.style.display = "none";
      // Clear fields
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";
    }, 300); // Animation duration
  });

  // Close when clicking outside the modal
  passwordModal.addEventListener("click", (e) => {
    if (e.target === passwordModal) {
      passwordModal.classList.remove("visible");
      setTimeout(() => {
        passwordModal.style.display = "none";
        // Clear fields
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";
      }, 300); // Animation duration
    }
  });

  // Set/change password button
  setPasswordBtn.addEventListener("click", async () => {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword || !confirmPassword) {
      alert("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    // If already password-protected, ask for current password first
    if (passwordProtected) {
      const validPassword = await showPasswordPrompt();
      if (!validPassword) return;
    }

    // Hash and save the password
    const passwordHash = await hashPassword(newPassword);
    await chrome.storage.sync.set({ passwordHash });

    passwordProtected = true;
    updatePasswordUI();

    alert("Password set successfully!");
    // Close modal and clear fields
    passwordModal.style.display = "none";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
  });

  // Remove password button
  removePasswordBtn.addEventListener("click", async () => {
    if (!passwordProtected) return;

    const validPassword = await showPasswordPrompt();
    if (!validPassword) return;

    // Remove the password
    await chrome.storage.sync.remove("passwordHash");

    passwordProtected = false;
    updatePasswordUI();

    alert("Password removed successfully!");
    // Close the modal
    passwordModal.style.display = "none";
  });
});

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const input = textInput.value.trim();
  if (!input) return;

  if (!isValidInput(input)) {
    alert("Please enter a valid domain or keyword (at least 2 characters)");
    return;
  }

  if (blockedSites.includes(input)) {
    alert("This site or keyword is already blocked");
    return;
  }

  // Hide the empty list message when adding the first item
  if (blockedSites.length === 0) {
    document.getElementById("empty-list-message").style.display = "none";
  }

  blockedSites = [...blockedSites, input];
  chrome.storage.sync.set({ blockedSites });

  // Add the site to the list
  sites.appendChild(createSiteListItem(input));

  textInput.value = "";
});
