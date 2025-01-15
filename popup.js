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
      if (button.dataset.tab === "todo") {
        loadTodos();
        updateTodoStats();
      }
    });
  });

  // Search Functionality

  async function performSearch(searchValue) {
    searchValue = searchValue || searchInput.value.trim();

    if (!searchValue) {
      addMessageToChat("bot", "Please enter a search query or command.");
      return;
    }

    // Add the user message to the chat
    addMessageToChat("user", searchValue);

    // Handle commands starting with '!'
    if (searchValue.startsWith('!')) {
      handleCommand(searchValue);
      searchBtn.disabled = false;
      searchInput.value = "";
      searchInput.focus();
      return; // Return early to prevent further processing
    }

    searchBtn.disabled = true;

    try {
      const [storageData, databaseJson] = await Promise.all([
        new Promise((resolve) => chrome.storage.local.get(["database", "siteData"], resolve)),
        fetch(chrome.runtime.getURL("data/database.json")).then(response => response.json())
      ]);

      const database = storageData.database || [];
      const siteData = storageData.siteData || [];
      const combinedData = [...siteData, ...database, ...databaseJson];

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
    } catch (error) {
      addMessageToChat("bot", "An error occurred while searching.");
    } finally {
      searchBtn.disabled = false;
      searchInput.value = "";
      searchInput.focus();
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
          addMessageToChat("bot", `✓ Name saved! Welcome, ${username}! 😊`);
          const alertMessage = document.createElement("div");
          alertMessage.className = "alert-message";
          alertMessage.textContent = `Name updated to: ${username}`;
          document.body.appendChild(alertMessage);
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
  • !all - Show all saved sites
  • !joke - Listen a joke
  • !gyaan - Get a random advice
  
  Type any command to try it out!`);
        break;

      case 'all':
        chrome.storage.local.get(["database", "siteData"], async (storageData) => {
          const database = storageData.database || [];
          const siteData = storageData.siteData || [];
          const response = await fetch(chrome.runtime.getURL("data/database.json"));
          const databaseJson = await response.json();
          const combinedData = [...siteData, ...database, ...databaseJson];

          if (combinedData.length) {
            addMessageToChat("bot", "All saved sites:");
            combinedData.forEach(entry => {
              addMessageToChat("bot", entry);
            });
          } else {
            addMessageToChat("bot", "No sites found in the database.");
          }
        });

        break;

      case 'joke':
        // New 'joke' command logic
        fetch('https://icanhazdadjoke.com/', {
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(response => response.json())
          .then(data => {
            addMessageToChat("bot", data.joke);
          })
          .catch(error => {
            addMessageToChat("bot", "Sorry, I couldn't fetch a joke right now. Try again later!");
          });
        break;

      
        case 'gyaan':
          // New 'advice' command logic
          fetch('https://api.adviceslip.com/advice', {
            method: 'GET',
          })
            .then(response => response.json())
            .then(data => {
              addMessageToChat("bot", data.slip.advice);  // data.slip.advice contains the advice
            })
            .catch(error => {
              addMessageToChat("bot", "Sorry, I couldn't fetch advice right now. Try again later!");
            });
          break;

      default:
        addMessageToChat("bot", `Unknown command. Type !help to see available commands.`);
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



  // Initial greeting
  chrome.storage.local.get("username", (data) => {
    const greeting = data.username ?
      `Welcome back, ${data.username}! Aaj konsi site ki setting karni hai? ;)` :
      "Welcome! Type 'all' to see saved sites.";
    addMessageToChat("bot", greeting);
  });


  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoList = document.getElementById("todoList");
  const filterButtons = document.querySelectorAll(".filter-btn");
  let currentFilter = "all";

  // Load todos when the todo tab is shown
  document.querySelector('[data-tab="todo"]').addEventListener('click', () => {
    loadTodos();
    updateTodoStats();
  });

  // Handle filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.dataset.filter;
      loadTodos();
    });
  });

  // Handle todo form submission
  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const task = todoInput.value;
    const priority = document.getElementById("todoPriority").value;
    
    chrome.storage.local.get("todos", (data) => {
      const todos = data.todos || [];
      todos.push({
        id: Date.now(),
        task,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
      });
      
      chrome.storage.local.set({ todos }, () => {
        todoForm.reset();
        loadTodos();
        updateTodoStats();
        addMessageToChat("bot", "✓ Task added successfully");
      });
    });
  });

  // Function to load and display todos
  function loadTodos() {
    chrome.storage.local.get("todos", (data) => {
      const todos = data.todos || [];
      todoList.innerHTML = "";
      
      const filteredTodos = todos.filter(todo => {
        if (currentFilter === "completed") return todo.completed;
        if (currentFilter === "pending") return !todo.completed;
        return true;
      });

      // Sort by priority (high → medium → low) and then by creation date
      filteredTodos.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      filteredTodos.forEach(todo => {
        const todoItem = document.createElement("div");
        todoItem.className = `todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`;
        
        todoItem.innerHTML = `
          <div class="todo-checkbox">
            <input 
              type="checkbox" 
              id="todo-${todo.id}" 
              ${todo.completed ? 'checked' : ''}
              aria-label="Mark task as ${todo.completed ? 'incomplete' : 'complete'}"
            />
            <label class="checkbox-label" for="todo-${todo.id}"></label>
          </div>
          <div class="todo-content">
            <span class="todo-text">${todo.task}</span>
            <span class="todo-priority">${todo.priority}</span>
          </div>
          <button class="delete-todo" aria-label="Delete task">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        `;
        
        // Handle checkbox change
        const checkbox = todoItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
          toggleTodoComplete(todo.id);
        });
        
        // Handle delete button
        const deleteBtn = todoItem.querySelector('.delete-todo');
        deleteBtn.addEventListener('click', () => {
          deleteTodo(todo.id);
        });
        
        todoList.appendChild(todoItem);
      });

      updateTodoStats();
    });
  }

  // Function to update todo statistics
  function updateTodoStats() {
    chrome.storage.local.get("todos", (data) => {
      const todos = data.todos || [];
      const totalTasks = todos.length;
      const completedTasks = todos.filter(todo => todo.completed).length;
      
      document.getElementById("totalTasks").textContent = totalTasks;
      document.getElementById("completedTasks").textContent = completedTasks;
    });
  }

  // Function to toggle todo completion
  function toggleTodoComplete(id) {
    chrome.storage.local.get("todos", (data) => {
      const todos = data.todos || [];
      const updatedTodos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      
      chrome.storage.local.set({ todos: updatedTodos }, () => {
        loadTodos();
        updateTodoStats();
      });
    });
  }

  // Function to delete todo
  function deleteTodo(id) {
    chrome.storage.local.get("todos", (data) => {
      const todos = data.todos || [];
      const updatedTodos = todos.filter(todo => todo.id !== id);
      
      chrome.storage.local.set({ todos: updatedTodos }, () => {
        loadTodos();
        updateTodoStats();
        addMessageToChat("bot", "✓ Task deleted successfully");
      });
    });
  }



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
  reader.onload = function (e) {
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

