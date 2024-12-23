// Initialize Default Database on Installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get("database", (data) => {
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
      });
    });
  
    // Search for Site Settings
    document.getElementById("searchBtn").addEventListener("click", () => {
      const searchValue = document.getElementById("searchInput").value.toLowerCase();
      chrome.storage.local.get(["database", "siteData"], (data) => {
        console.log("Data retrieved for search:", data);
  
        const database = data.database || [];
        const siteData = data.siteData || [];
        const combinedData = [...siteData, ...database];
  
        console.log("Combined Data:", combinedData);
  
        const filtered = combinedData.filter((entry) =>
          entry.site_url.toLowerCase().includes(searchValue)
        );
  
        console.log("Filtered Results:", filtered);
  
        const chatResults = document.getElementById("chatResults");
        chatResults.innerHTML = "";
  
        if (filtered.length) {
          addMessageToChat("user", `Searching for: ${searchValue}`);
          filtered.forEach((entry) => {
            addMessageToChat("bot", `Site: ${entry.site_url}\nSettings: ${entry.settings}\nNotes: ${entry.notes}`);
          });
        } else {
          addMessageToChat("user", `Searching for: ${searchValue}`);
          addMessageToChat("bot", "No results found.");
        }
      });
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
  });
  
  function addMessageToChat(sender, content) {
    const chatResults = document.getElementById("chatResults");
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", `${sender}-message`);
    messageElement.textContent = content;
    chatResults.appendChild(messageElement);
    chatResults.scrollTop = chatResults.scrollHeight;
  }