// Initialize Default Database on Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["database", "username", "theme"], (data) => {
    if (!data.database) {
      fetch(chrome.runtime.getURL("data/database.json"))
        .then((response) => response.json())
        .then((defaultDatabase) => {
          chrome.storage.local.set({ database: defaultDatabase }, () => {
            console.log("Default database loaded into chrome.storage.local:", defaultDatabase);
          });
        })
        .catch((error) => console.error("Error loading default database:", error));
    } else {
      console.log("Database already initialized in chrome.storage.local:", data.database);
    }

    if (!data.username) {
      chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
    }

    if (!data.theme) {
      chrome.storage.local.set({ theme: "light" });
    }
  });
});

// Tab Switching Logic
document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(button.dataset.tab + "Tab").classList.add("active");
      if (button.textContent === "Chat") {
        document.getElementById("searchInput").focus();
      }
    });
  });

  // Load and apply saved theme
  chrome.storage.local.get("theme", (data) => {
    const theme = data.theme || "light";
    document.body.className = `${theme}-theme`;
    document.getElementById("themeSelect").value = theme;
  });

  // Greet the user
  chrome.storage.local.get("username", (data) => {
    if (data.username) {
      addMessageToChat("bot", `Greetings, ${data.username}! How can I assist you today?`);
    } else {
      addMessageToChat("bot", "Welcome! How can I assist you today?");
    }
  });

  // Search for Site Settings
  document.getElementById("searchBtn").addEventListener("click", () => {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    
    // Fetch data from both chrome.storage.local and database.json
    Promise.all([
      new Promise((resolve) => chrome.storage.local.get(["database", "siteData"], resolve)),
      fetch(chrome.runtime.getURL("data/database.json")).then(response => response.json())
    ]).then(([storageData, databaseJson]) => {
      console.log("Data retrieved from storage:", storageData);
      console.log("Data retrieved from database.json:", databaseJson);

      const database = storageData.database || [];
      const siteData = storageData.siteData || [];
      const combinedData = [...siteData, ...database, ...databaseJson];

      console.log("Combined Data:", combinedData);

      const filtered = combinedData.filter((entry) =>
        entry.site_url.toLowerCase().includes(searchValue)
      );

      console.log("Filtered Results:", filtered);

      addMessageToChat("user", searchValue);

      if (filtered.length) {
        filtered.forEach((entry) => {
          addMessageToChat("bot", `Site: ${entry.site_url}\nSettings: ${entry.settings}\nNotes: ${entry.notes}`);
        });
      } else {
        addMessageToChat("bot", "No results found.");
      }
    });

    document.getElementById("searchInput").value = "";
  });

  // Save New Site Settings
  document.getElementById("saveBtn").addEventListener("click", () => {
    const newSite = {
      site_url: document.getElementById("siteUrl").value,
      settings: document.getElementById("siteSettings").value,
      notes: document.getElementById("siteNotes").value
    };

    chrome.storage.local.get("siteData", (data) => {
      const siteData = data.siteData || [];
      siteData.push(newSite);
      chrome.storage.local.set({ siteData }, () => {
        alert("Site settings saved!");
        // Clear input fields
        document.getElementById("siteUrl").value = "";
        document.getElementById("siteSettings").value = "";
        document.getElementById("siteNotes").value = "";
      });
    });
  });

  // Save Username
  document.getElementById("saveUsername").addEventListener("click", () => {
    const username = document.getElementById("username").value;
    chrome.storage.local.set({ username }, () => {
      alert("Username saved!");
    });
  });

  // Theme Selection
  document.getElementById("themeSelect").addEventListener("change", (event) => {
    const theme = event.target.value;
    document.body.className = `${theme}-theme`;
    chrome.storage.local.set({ theme });
  });

  document.getElementById("searchInput").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("searchBtn").click();
    }
  });
});

function addMessageToChat(sender, content) {
  const chatResults = document.getElementById("chatResults");
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", `${sender}-message`);
  messageElement.textContent = content;
  chatResults.appendChild(messageElement);
  chatResults.scrollTop = chatResults.scrollHeight;
}

