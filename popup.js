const MAX_CHAT_HISTORY = 20; // Maximum number of messages to keep
const CHAT_HISTORY_KEY = 'chatHistory';

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
    if (searchValue.startsWith('!')) {

    }
    else {
      addMessageToChat("user", searchValue);
    }

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
          
          addMessageToChat("bot", `Site: ${entry.site_url}\nCertificate: ${entry.settings}\nNotes: ${entry.notes}`);
        });
      } else {
        addMessageToChat("bot", "Hein ji?");
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
          addMessageToChat("user", "!name");
          addMessageToChat("bot", "Tusi apna naam toh batao ji. Aise: !name aapka_name");
          return;
        }
        const username = args.join(' ');
        const welcomeMessages = [
          `Ohoo ${username}, kya baat hai! Kitna pyaara naam hai. Welcome ji, welcome! ❤️`,
          `Arre wah, ${username}, yeh naam toh bilkul stylish hai! Welcome ji, welcome! ❤️`,
          `Wah, ${username}, aapka naam bilkul Bollywood style lag raha hai! Kya baat hai! ❤️`,
          `Oho, ${username}, kitna pyaara naam hai! Dil se welcome! ❤️`,
          `${username}, kya naam chhupa ke rakha tha! Welcome ji, welcome! ❤️`,
          `${username}, aapka naam sunke lagta hai zindagi set ho gayi! Welcome ji! ❤️`,
          `Kya baat hai ${username}, yeh naam toh ekdum classy hai! Welcome ji! ❤️`,
          `Wah ${username}, aapka naam sunke toh dil khush ho gaya! Welcome ji! ❤️`
        ];
        chrome.storage.local.set({ username }, () => {
          addMessageToChat("user", `!name ${username}`)
          const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
          addMessageToChat("bot", randomMessage);
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

        const helpMessages = ["I’m a bit lost, can you help me out?",
          "What can I do here? Show me the commands!",
          "Help me explore all the features!",
          "I need some guidance. What commands do you have?",
          "I’m looking for some instructions, please!"];


        const randomHelpMessage = helpMessages[Math.floor(Math.random() * helpMessages.length)];


        addMessageToChat("user", randomHelpMessage);
        addMessageToChat("bot",
          `Available Commands:

 • !name - Set your name and personalize your experience
 • !help - Display this helpful guide (you’re here right now!)
 • !all - Show all saved sites
 • !joke - Hear a funny joke to brighten your day!
 • !gyaan - Get a random piece of advice to ponder on
 • !cat - Receive a random cat fact (because who doesn’t love cats?)
 • !poke - Learn a random Pokémon fact!
 • !quiz - Test your knowledge with a tech quiz question
 • !bored - Find an activity suggestion to combat boredom

Type any of the above commands to try them out and have some fun! 🎉`);
        break;

      case 'all':


        const allMessages = ["Show me all the cool sites I’ve saved!",
          "Let’s check out all my saved websites.",
          "I want to see all the sites I’ve saved!",
          "What websites do I have in my collection?",
          "Can you list all the sites I’ve saved till now?"];

        const randomAllMessage = allMessages[Math.floor(Math.random() * allMessages.length)];

        addMessageToChat("user", randomAllMessage);
        chrome.storage.local.get(["database", "siteData"], async (storageData) => {
          const database = storageData.database || [];
          const siteData = storageData.siteData || [];
          const response = await fetch(chrome.runtime.getURL("data/database.json"));
          const databaseJson = await response.json();
          const combinedData = [...siteData, ...database, ...databaseJson];

          if (combinedData.length) {
            addMessageToChat("bot", "Ye lo ji");
            combinedData.forEach(entry => {
              addMessageToChat("bot", `Site: ${entry.site_url}\nCertificate: ${entry.settings}\nNotes: ${entry.notes}`);
            });
          } else {
            addMessageToChat("bot", "No sites found in the database.");
          }
        });

        break;

      case 'joke':

        const jokeMessages = ["Tell me a joke, make me laugh!",
          "I need a good laugh, can you crack a joke?",
          "Hit me with your best joke!",
          "I’m ready for some humor, bring on the jokes!",
          "Make me smile with a funny joke!"];
        const randomJokeMessage = jokeMessages[Math.floor(Math.random() * jokeMessages.length)];

        addMessageToChat("user", randomJokeMessage);

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
            addMessageToChat("bot", "Mood off hai mera, no jokes for now!");
          });
        break;


      case 'gyaan':


        const gyaanMessages = ["Time for some gyaan (wisdom)!",
          "Give me a piece of wisdom to ponder.",
          "I need some advice. What do you have for me?",
          "What life lesson do you have for me today?",
          "Give me some gyaan, I’m all ears!"];

        const randomGyaanMessage = gyaanMessages[Math.floor(Math.random() * gyaanMessages.length)];
        addMessageToChat("user", randomGyaanMessage);
        fetch('https://api.adviceslip.com/advice', {
          method: 'GET',
        })
          .then(response => response.json())
          .then(data => {
            addMessageToChat("bot", data.slip.advice);  // data.slip.advice contains the advice
          })
          .catch(error => {
            addMessageToChat("bot", "I'm in deep thought... and need a nap! 😴 Come back for advice soon!");
          });
        break;


      case 'cat':

        const catMessages = ["Time for a random cat fact!",
          "I want to hear a cool cat fact!",
          "Hit me with a fun cat fact, I’m all ears!",
          "Let’s hear some cat knowledge!",
          "I’m ready for a purrfect cat fact!"];

        const randomCatMessage = catMessages[Math.floor(Math.random() * catMessages.length)];

        addMessageToChat("user", randomCatMessage);
        fetch('https://catfact.ninja/fact', {
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(response => response.json())
          .then(data => {
            const fact = data.fact;
            const catFact = `Meow Meow🐾\n${fact}`;
            addMessageToChat("bot", catFact);
          })
          .catch(error => {
            addMessageToChat("bot", "Oops, the cat’s paws are too tired to fetch a fact right now! Try again later! 🐾");
          });
        break;


      case 'poke':

        const pokeMessages = ["Time to learn about Pokémon, hit me with a random fact!",
          "Give me a fun Pokémon fact!",
          "Show me a random Pokémon tidbit!",
          "What cool Pokémon fact do you have for me today?",
          "I’m all about Pokémon today, give me a random fact!"];

        const randomPokeMessage = pokeMessages[Math.floor(Math.random() * pokeMessages.length)];
        addMessageToChat("user", randomPokeMessage);

        const randomId = Math.floor(Math.random() * 898) + 1; // Random Pokémon ID between 1 and 898 (total number of Pokémon in the API)

        fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`, {
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(response => response.json())
          .then(data => {
            // Fetch additional data for flavor text (Pokémon's description)
            fetch(data.species.url)
              .then(response => response.json())
              .then(speciesData => {
                const flavorText = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text || "No description available.";

                const pokeFact = `Pika Pika! \nDid you know? ${data.name.charAt(0).toUpperCase() + data.name.slice(1)} is a ${data.types.map(type => type.type.name).join(', ')}(type) Pokémon. Here's a fun fact about ${data.name.charAt(0).toUpperCase() + data.name.slice(1)}: ${flavorText}`;
                addMessageToChat("bot", pokeFact);
              })
              .catch(error => {
                addMessageToChat("bot", "Pika Pika \nI’m buffering... and buffering... maybe try again later!");
              });
          })
          .catch(error => {
            addMessageToChat("bot", "Pika Pika \nI’m buffering... and buffering... maybe try again later!");
          });
        break;


      case 'quiz':

        const quizMessages = ["I’m ready for a tech quiz question, bring it on!",
          "Let’s see how much I know, hit me with a tech quiz!",
          "Time to put my tech knowledge to the test!",
          "Give me a challenge, let’s do a tech quiz!",
          "I’m ready to answer a tech quiz question!"];
        const randomQuizMessage = quizMessages[Math.floor(Math.random() * quizMessages.length)];
        addMessageToChat("user", randomQuizMessage);
        fetch('https://opentdb.com/api.php?amount=1&category=18', {
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(response => response.json())
          .then(data => {
            const triviaQuestion = data.results[0];
            const question = triviaQuestion.question;
            const correctAnswer = triviaQuestion.correct_answer;
            const options = [...triviaQuestion.incorrect_answers, correctAnswer];

            // Shuffle the options to randomize their order
            options.sort(() => Math.random() - 0.5);

            const triviaPrompt = `Here's an interesting question: ${question}\n\nOption A: ${options[0]}\nOption B: ${options[1]}\nOption C: ${options[2]}\nOption D: ${options[3]}\n\nThink about your answer while I reveal the correct one shortly!`;

            // Display the question and options
            addMessageToChat("bot", triviaPrompt);

            // Set a delay to reveal the correct answer
            setTimeout(() => {
              const answerReveal = `The correct answer is: ${correctAnswer}`;
              addMessageToChat("bot", answerReveal);
            }, 15000); // 15-second delay before revealing the answer
          })
          .catch(error => {
            addMessageToChat("bot", "Uh-oh! The quiz question went on strike. It will be back soon, promise!");
          });
        break;


      case 'bored':

        const boredMessages = ["I'm feeling a bit bored, can you suggest an activity?",
          "I’m bored, suggest something fun to do!",
          "Got any activity ideas? I need something to do!",
          "Bored out of my mind, what should I do?",
          "Give me an activity suggestion, I need some fun!",
          "Help, I’m bored! What should I do next?"];


        const randomBoredMessage = boredMessages[Math.floor(Math.random() * boredMessages.length)];
        addMessageToChat("user", randomBoredMessage);

        fetch('https://bored-api.appbrewery.com/random', {
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(response => response.json())
          .then(data => {
            const activity = data.activity;
            const type = data.type;
            const participants = data.participants;
            const price = data.price;
            const link = data.link || "No link available"; // Check if there's a link provided

            const activityFact = `🎉 Here's a fun activity for you 🎉\n\nActivity: ${activity}\nType: ${type}\nParticipants: ${participants} person(s)\nPrice: ${getPriceLevel(price)}\nLink: ${link}\n🎲 Feel free to give it a try and have some fun! 😊`;

            addMessageToChat("bot", activityFact);
          })
          .catch(error => {
            addMessageToChat("bot", "Uh-oh! The activity genie is on a break. While I wait for them to return, why not try something new? Take a walk, call a friend, dance like nobody's watching, or grab a snack? 😄");
          });
        break;

        // Helper function to make the price more readable
        function getPriceLevel(price) {
          switch (price) {
            case 0: return "💰 Free";
            case 1: return "💵 Low cost";
            case 2: return "💳 Medium cost";
            case 3: return "💸 High cost";
            default: return "🤔 Unknown";
          }
        }


      default:
        addMessageToChat("user", command)
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
        const alertMessage = document.createElement("div");
        alertMessage.className = "alert-message";
        alertMessage.textContent = `Yumm! Site saved successfully!`;
        document.body.appendChild(alertMessage);
        setTimeout(() => {
          alertMessage.classList.add('fade-out');
          setTimeout(() => alertMessage.remove(), 300);
        }, 3000);
      });
    });
  });



  // Load chat history instead of showing initial greeting
  loadChatHistory();

  // If there's no chat history, show the initial greeting
  chrome.storage.local.get([CHAT_HISTORY_KEY, "username"], (data) => {
    if (!data[CHAT_HISTORY_KEY] || data[CHAT_HISTORY_KEY].length === 0) {
      const greeting = data.username ?
        `Welcome back, ${data.username}! Aaj konsi site ki setting karni hai? ;)` :
        "Welcome! Type 'all' to see saved sites.";
      addMessageToChat("bot", greeting);
    }
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
        // addMessageToChat("bot", "✓ Task added successfully");
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
        // addMessageToChat("bot", "✓ Task deleted successfully");
      });
    });
  }

  // Add this in the DOMContentLoaded event listener
  // const clearChatButton = document.getElementById("clearChatButton");
  // clearChatButton.addEventListener("click", () => {
  //   chrome.storage.local.remove(CHAT_HISTORY_KEY, () => {
  //     document.getElementById("chatResults").innerHTML = '';
  //     closeHamburgerMenu();
  //     // addMessageToChat("bot", "✓ Chat history cleared");
  //   });
  // });

});

function exportSettings() {
  chrome.storage.local.get("siteData", (data) => {
    const siteData = data.siteData || [];

    // Check if siteData is empty
    if (siteData.length === 0) {
      addMessageToChat("bot", "No data to export. Please save some sites first.");
      return; // Exit the function if there's no data
    }

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
  let messageContent;
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
    messageContent = content;
  } else {
    if (content.startsWith("✓")) {
      messageElement.classList.add("success-message");
    }
    messageElement.textContent = content;
    messageContent = content;
  }

  // Add timestamp
  const now = new Date();
  const timeDiv = document.createElement("div");
  timeDiv.classList.add("message-time");
  timeDiv.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messageElement.appendChild(timeDiv);

  chatResults.appendChild(messageElement);

  // Save to chat history
  saveChatMessage({
    sender,
    content: messageContent,
    timestamp: now.toISOString()
  });

  setTimeout(() => {
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 100);
}

function saveChatMessage(message) {
  chrome.storage.local.get(CHAT_HISTORY_KEY, (data) => {
    let chatHistory = data[CHAT_HISTORY_KEY] || [];
    chatHistory.push(message);

    // Keep only the last MAX_CHAT_HISTORY messages
    if (chatHistory.length > MAX_CHAT_HISTORY) {
      chatHistory = chatHistory.slice(-MAX_CHAT_HISTORY);
    }

    chrome.storage.local.set({ [CHAT_HISTORY_KEY]: chatHistory }, () => {
      console.log("Chat history updated:", chatHistory); // Debug log
    });
  });
}

function loadChatHistory() {
  chrome.storage.local.get(CHAT_HISTORY_KEY, (data) => {
    const chatHistory = data[CHAT_HISTORY_KEY] || [];
    const chatResults = document.getElementById("chatResults");
    chatResults.innerHTML = ''; // Clear existing messages

    chatHistory.forEach(message => {
      const messageElement = document.createElement("div");
      messageElement.classList.add("chat-message", `${message.sender}-message`);

      if (typeof message.content === 'object') {
        const entryDiv = document.createElement("div");
        entryDiv.classList.add("site-entry");

        const urlDiv = document.createElement("div");
        urlDiv.classList.add("site-url");
        urlDiv.textContent = message.content.site_url;

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("site-details");
        detailsDiv.textContent = `${message.content.settings}\n${message.content.notes}`;

        entryDiv.appendChild(urlDiv);
        entryDiv.appendChild(detailsDiv);
        messageElement.appendChild(entryDiv);
      } else {
        if (message.content.startsWith("✓")) {
          messageElement.classList.add("success-message");
        }
        messageElement.textContent = message.content;
      }

      const timeDiv = document.createElement("div");
      timeDiv.classList.add("message-time");
      const messageDate = new Date(message.timestamp);
      timeDiv.textContent = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      messageElement.appendChild(timeDiv);

      chatResults.appendChild(messageElement);
    });

    // Scroll to bottom after loading history
    if (chatResults.lastElementChild) {
      chatResults.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  });
}




