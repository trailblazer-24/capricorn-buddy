document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  const themeSelect = document.getElementById("themeSelect");

  const exportButton = document.getElementById("exportButton");
  const importButton = document.getElementById("importButton");
  const importFile = document.getElementById("importFile");

  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const closeHamburgerBtn = document.getElementById("closeHamburgerBtn");
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const hamburgerOverlay = document.querySelector(".hamburger-overlay");

  exportButton.addEventListener("click", exportSettings);
  importButton.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", importSettings);

  // Hamburger menu toggle
  hamburgerBtn.addEventListener("click", () => {
    hamburgerMenu.classList.add("open");
    document.body.style.overflow = "hidden";
  });

  closeHamburgerBtn.addEventListener("click", closeHamburgerMenu);
  hamburgerOverlay.addEventListener("click", closeHamburgerMenu);

  function closeHamburgerMenu() {
    hamburgerMenu.classList.remove("open");
    document.body.style.overflow = "";
  }


  // Theme Management
  function applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme');
    document.body.classList.add(`${theme}-theme`);
    if (themeSelect) {
      themeSelect.value = theme;
    }
    chrome.storage.local.set({ theme });
  }

  // Load saved theme
  chrome.storage.local.get("theme", (data) => {
    const savedTheme = data.theme || "light";
    applyTheme(savedTheme);
  });

  // Theme change handler
  themeSelect.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });

  // Tab Switching Logic
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));
      
      button.classList.add("active");
      document.getElementById(button.dataset.tab + "Tab").classList.add("active");
      
      if (button.dataset.tab === "search") {
        searchInput.focus();
      }
    });
  });

  // Search Functionality
  async function performSearch() {
    const searchValue = searchInput.value.trim();
    
    if (!searchValue) {
      addMessageToChat("bot", "Please enter a search query or command.");
      return;
    }

    addMessageToChat("user", searchValue);
    searchBtn.disabled = true;

    // Handle commands
    if (searchValue.startsWith('!')) {
      handleCommand(searchValue);
      searchBtn.disabled = false;
      searchInput.value = "";
      searchInput.focus();
      return;
    }

    try {
      const [storageData, databaseJson] = await Promise.all([
        new Promise((resolve) => chrome.storage.local.get(["database", "siteData"], resolve)),
        fetch(chrome.runtime.getURL("data/database.json")).then(response => response.json())
      ]);

      const database = storageData.database || [];
      const siteData = storageData.siteData || [];
      const combinedData = [...siteData, ...database, ...databaseJson];

      if (searchValue === 'all') {
        if (combinedData.length) {
          addMessageToChat("bot", "All saved sites:");
          combinedData.forEach(entry => {
            addMessageToChat("bot", entry);
          });
        } else {
          addMessageToChat("bot", "No sites found in the database.");
        }
      } else {
        const filtered = combinedData.filter((entry) =>
          entry.site_url.toLowerCase().includes(searchValue)
        );

        if (filtered.length) {
          filtered.forEach(entry => {
            addMessageToChat("bot", entry);
          });
        } else {
          addMessageToChat("bot", "No results found. Type 'all' to see all entries.");
        }
      }
    } catch (error) {
      addMessageToChat("bot", "An error occurred while searching.");
    } finally {
      searchBtn.disabled = false;
      searchInput.value = "";
      searchInput.focus();
    }
  }

  searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  // Form Handlers
  document.getElementById("saveSiteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const submitBtn = event.target.querySelector("button");
    submitBtn.disabled = true;

    const newSite = {
      site_url: document.getElementById("siteUrl").value,
      settings: document.getElementById("siteSettings").value,
      notes: document.getElementById("siteNotes").value
    };

    chrome.storage.local.get("siteData", (data) => {
      const siteData = data.siteData || [];
      siteData.push(newSite);
      chrome.storage.local.set({ siteData }, () => {
        event.target.reset();
        submitBtn.disabled = false;
        addMessageToChat("bot", "✓ Site saved successfully");
      });
    });
  });

  document.getElementById("settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const submitBtn = event.target.querySelector("button");
    submitBtn.disabled = true;

    const username = document.getElementById("username").value;

    chrome.storage.local.set({ username }, () => {
      submitBtn.disabled = false;
      addMessageToChat("bot", "✓ Settings saved");
    });
  });

  // Initial greeting
  chrome.storage.local.get("username", (data) => {
    const greeting = data.username ? 
      `Welcome back, ${data.username}! Aaj konsi site ki setting karni hai? ;)` : 
      "Welcome! Type 'all' to see saved sites.";
    addMessageToChat("bot", greeting);
  });

  // Todo functionality
  const todoForm = document.getElementById("todoForm");
  const todoList = document.getElementById("todoList");

  // Load todos
  loadTodos();

  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.getElementById("todoTitle").value;
    const date = document.getElementById("todoDate").value;
    
    addTodo(title, date);
    todoForm.reset();
  });

  // Check for due todos every minute
  setInterval(checkDueTodos, 60000);
});

function exportSettings() {
  chrome.storage.local.get("siteData", (data) => {
    const siteData = data.siteData || [];
    
    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(siteData);
    
    // Create a workbook and add the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sites");
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: 'capricorn_buddy_settings.xlsx',
      saveAs: true
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        addMessageToChat("bot", "Error exporting settings. Please try again.");
      } else {
        addMessageToChat("bot", "✓ Settings exported successfully");
      }
    });
  });
}

function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    chrome.storage.local.set({ siteData: jsonData }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        addMessageToChat("bot", "Error importing settings. Please try again.");
      } else {
        addMessageToChat("bot", "✓ Settings imported successfully");
      }
    });
  };
  reader.readAsArrayBuffer(file);
}

function addTodo(title, date) {
  chrome.storage.local.get("todos", (data) => {
    const todos = data.todos || [];
    const newTodo = {
      id: Date.now(),
      title,
      date,
      completed: false
    };
    
    todos.push(newTodo);
    chrome.storage.local.set({ todos }, () => {
      loadTodos();
      scheduleTodoNotification(newTodo);
    });
  });
}

function loadTodos() {
  const todoList = document.getElementById("todoList");
  chrome.storage.local.get("todos", (data) => {
    const todos = data.todos || [];
    todoList.innerHTML = "";
    
    todos.sort((a, b) => new Date(a.date) - new Date(b.date))
         .forEach(todo => {
           const todoItem = createTodoElement(todo);
           todoList.appendChild(todoItem);
         });
  });
}

function createTodoElement(todo) {
  const div = document.createElement("div");
  div.className = `todo-item ${todo.completed ? 'todo-completed' : ''}`;
  
  div.innerHTML = `
    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
    <div class="todo-content">
      <div class="todo-title">${todo.title}</div>
      <div class="todo-date">${formatDate(todo.date)}</div>
    </div>
    <button class="todo-delete">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;

  const checkbox = div.querySelector(".todo-checkbox");
  checkbox.addEventListener("change", () => toggleTodo(todo.id));

  const deleteBtn = div.querySelector(".todo-delete");
  deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

  return div;
}

function toggleTodo(id) {
  chrome.storage.local.get("todos", (data) => {
    const todos = data.todos || [];
    const updatedTodos = todos.map(todo => 
      todo.id === id ? {...todo, completed: !todo.completed} : todo
    );
    chrome.storage.local.set({ todos: updatedTodos }, loadTodos);
  });
}

function deleteTodo(id) {
  chrome.storage.local.get("todos", (data) => {
    const todos = data.todos || [];
    const updatedTodos = todos.filter(todo => todo.id !== id);
    chrome.storage.local.set({ todos: updatedTodos }, loadTodos);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function checkDueTodos() {
  chrome.storage.local.get("todos", (data) => {
    const todos = data.todos || [];
    const now = new Date();
    
    todos.forEach(todo => {
      if (!todo.completed && new Date(todo.date) <= now) {
        chrome.notifications.create(`todo-${todo.id}`, {
          type: "basic",
          iconUrl: "icon.png",
          title: "Todo Reminder",
          message: todo.title,
          priority: 2
        });
      }
    });
  });
}

function scheduleTodoNotification(todo) {
  const notificationTime = new Date(todo.date).getTime();
  const now = Date.now();
  
  if (notificationTime > now) {
    setTimeout(() => {
      chrome.notifications.create(`todo-${todo.id}`, {
        type: "basic",
        iconUrl: "icon.png",
        title: "Todo Reminder",
        message: todo.title,
        priority: 2
      });
    }, notificationTime - now);
  }
}

function handleCommand(command) {
  const [cmd, ...args] = command.slice(1).split(' ');
  
  switch (cmd.toLowerCase()) {
    case 'name':
      if (args.length === 0) {
        addMessageToChat("bot", "Please provide a name. Usage: !name your_name");
        return;
      }
      const username = args.join(' ');
      chrome.storage.local.set({ username }, () => {
        // First add the success message
        addMessageToChat("bot", `✓ Name saved! Welcome, ${username}! 😊`);
        
        // Then show the alert message
        const alertMessage = document.createElement("div");
        alertMessage.className = "alert-message";
        alertMessage.textContent = `Name updated to: ${username}`;
        document.body.appendChild(alertMessage);
        
        // Remove the alert after 3 seconds
        setTimeout(() => {
          alertMessage.classList.add('fade-out');
          setTimeout(() => alertMessage.remove(), 300);
        }, 3000);
      });
      break;

    case 'help':
      addMessageToChat("bot", 
`Available commands:
• !name your_name - Set your name
• !help - Show this help message
• all - Show all saved sites

Type any command to try it out!`);
      break;

    default:
      addMessageToChat("bot", `Unknown command. Type !help to see available commands.`);
  }
}

function addMessageToChat(sender, content) {
  const chatResults = document.getElementById("chatResults");
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", `${sender}-message`);
  
  // Create message content
  if (typeof content === 'object') {
    const entryDiv = document.createElement("div");
    entryDiv.classList.add("site-entry");
    
    const urlDiv = document.createElement("div");
    urlDiv.classList.add("site-url");
    urlDiv.textContent = content.site_url;
    
    const detailsDiv = document.createElement("div");
    detailsDiv.classList.add("site-details");
    detailsDiv.textContent = `${content.settings}\n${content.notes}`;
    
    entryDiv.appendChild(urlDiv);
    entryDiv.appendChild(detailsDiv);
    messageElement.appendChild(entryDiv);
  } else {
    if (content.startsWith("✓")) {
      messageElement.classList.add("success-message");
    }
    messageElement.textContent = content;
  }
  
  // Add timestamp
  const timeDiv = document.createElement("div");
  timeDiv.classList.add("message-time");
  const now = new Date();
  timeDiv.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messageElement.appendChild(timeDiv);
  
  chatResults.appendChild(messageElement);
  setTimeout(() => {
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 100);
}

