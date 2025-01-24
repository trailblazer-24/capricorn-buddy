const MAX_CHAT_HISTORY = 30; // Maximum number of messages to keep
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

  const snippetsList = document.getElementById("snippetsList");
  const addSnippetButton = document.getElementById("addSnippetButton");

  const snippetSearchInput = document.getElementById("snippetSearchInput");

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

  let commandHistory = [];
  let historyIndex = -1;

  // Load command history from storage
  chrome.storage.local.get("commandHistory", (data) => {
    commandHistory = data.commandHistory || [];
  });

  // Save command to history
  function saveCommandToHistory(command) {
    commandHistory.push(command);
    if (commandHistory.length > MAX_CHAT_HISTORY) {
      commandHistory.shift(); // Keep history within limit
    }
    chrome.storage.local.set({ commandHistory });
  }

  // Handle keypress for command history navigation
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      if (historyIndex > 0) {
        historyIndex--;
        searchInput.value = commandHistory[historyIndex];
      }
    } else if (event.key === "ArrowDown") {
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        searchInput.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        searchInput.value = '';
      }
    }
  });

  async function performSearch(searchValue) {
    searchValue = searchValue || searchInput.value.trim();

    if (!searchValue) {
      addMessageToChat("bot", "Please enter a search query or command.");
      return;
    }

    // Save command to history
    saveCommandToHistory(searchValue);
    historyIndex = commandHistory.length; // Reset index

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

    // Save the user command to chat history
    // addMessageToChat("user", command);

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

        const helpMessages = ["I'm a bit lost, can you help me out?",
          "What can I do here? Show me the commands!",
          "Help me explore all the features!",
          "I need some guidance. What commands do you have?",
          "I'm looking for some instructions, please!"];


        const randomHelpMessage = helpMessages[Math.floor(Math.random() * helpMessages.length)];


        addMessageToChat("user", randomHelpMessage);
        addMessageToChat("bot",
          `Available Commands:

• !name - Set your name and personalize your experience
• !help - Display this helpful guide (you're here right now!)
• !all - Show all saved sites
• !joke - Hear a funny joke to brighten your day!
• !gyaan - Get a random piece of advice to ponder on
• !cat - Receive a random cat fact (because who doesn't love cats?)
• !poke - Learn a random Pokémon fact!
• !quiz - Test your knowledge with a tech quiz question
• !bored - Find an activity suggestion to combat boredom
• !meal - Get a random english meal suggestion
• !clear - Clear your chat history

Type any of the above commands to try them out and have some fun! 🎉`);
        break;

      case 'all':
        const allMessages = ["Show me all the cool sites I've saved!",
          "Let's check out all my saved websites.",
          "I want to see all the sites I've saved!",
          "What websites do I have in my collection?",
          "Can you list all the sites I've saved till now?"];

        const randomAllMessage = allMessages[Math.floor(Math.random() * allMessages.length)];

        addMessageToChat("user", randomAllMessage);
        chrome.storage.local.get(["database", "siteData"], async (storageData) => {
          const database = storageData.database || [];
          const siteData = storageData.siteData || [];
          const response = await fetch(chrome.runtime.getURL("data/database.json"));
          const databaseJson = await response.json();
          const combinedData = [...siteData, ...database, ...databaseJson];

          if (combinedData.length) {
            // Prepare all entries in a single message
            const allEntries = combinedData.map(entry =>
              `Site: ${entry.site_url}\nCertificate: ${entry.settings}\nNotes: ${entry.notes}`
            ).join('\n\n');


            addMessageToChat("bot", `Ye lo ji:\n\n${allEntries}`);
          } else {
            addMessageToChat("bot", "No sites found in the database.");
          }
        });

        break;

      case 'joke':

        const jokeMessages = ["Tell me a joke, make me laugh!",
          "I need a good laugh, can you crack a joke?",
          "Hit me with your best joke!",
          "I'm ready for some humor, bring on the jokes!",
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
          "Give me some gyaan, I'm all ears!"];

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
          "Hit me with a fun cat fact, I'm all ears!",
          "Let's hear some cat knowledge!",
          "I'm ready for a purrfect cat fact!"];

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
            addMessageToChat("bot", "Oops, the cat's paws are too tired to fetch a fact right now! Try again later! 🐾");
          });
        break;


      case 'poke':

        const pokeMessages = ["Time to learn about Pokémon, hit me with a random fact!",
          "Give me a fun Pokémon fact!",
          "Show me a random Pokémon tidbit!",
          "What cool Pokémon fact do you have for me today?",
          "I'm all about Pokémon today, give me a random fact!"];

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
                addMessageToChat("bot", "Pika Pika \nI'm buffering... and buffering... maybe try again later!");
              });
          })
          .catch(error => {
            addMessageToChat("bot", "Pika Pika \nI'm buffering... and buffering... maybe try again later!");
          });
        break;


      case 'quiz':

        const quizMessages = ["I'm ready for a tech quiz question, bring it on!",
          "Let's see how much I know, hit me with a tech quiz!",
          "Time to put my tech knowledge to the test!",
          "Give me a challenge, let's do a tech quiz!",
          "I'm ready to answer a tech quiz question!"];
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
          "I'm bored, suggest something fun to do!",
          "Got any activity ideas? I need something to do!",
          "Bored out of my mind, what should I do?",
          "Give me an activity suggestion, I need some fun!",
          "Help, I'm bored! What should I do next?"];


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




      case 'meal':

      const mealMessages = ["I'm hungry, what should I eat?", "What's for dinner?", "I need a meal idea, any suggestions?", "I'm hungry, what's for dinner?", "I'm looking for a meal idea, any recommendations?", "What's the best meal to eat tonight?"];

      const randomMealMessage = mealMessages[Math.floor(Math.random() * mealMessages.length)];
      addMessageToChat("user", randomMealMessage);  
        fetch('https://www.themealdb.com/api/json/v1/1/random.php', {
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(response => response.json())
          .then(data => {
            const meal = data.meals[0]; // The random meal returned
            const mealName = meal.strMeal;
            const mealCategory = meal.strCategory;
            const mealArea = meal.strArea;
            const mealInstructions = meal.strInstructions;
            const mealFact = `Hungry? \nDid you know? ${mealName} is a delicious ${mealCategory} dish from ${mealArea}.\nHere's how to make it: ${mealInstructions}...`;

            addMessageToChat("bot", mealFact);
          })
          .catch(error => {
            addMessageToChat("bot", "Oops! Something went wrong while fetching a meal. Please try again later!");
          });
        break;


      case 'clear':
        chrome.storage.local.remove(CHAT_HISTORY_KEY, () => {
          document.getElementById("chatResults").innerHTML = '';

          // Retrieve user data to get the username
          chrome.storage.local.get(["username"], (data) => {
            const greet = data.username ?
              `Welcome back, ${data.username}! Aaj konsi site ki setting karni hai? ;)` :
              "Welcome! Type '!help' to see available commands";
            addMessageToChat("bot", greet);
          });
        });
        break;

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
        "Welcome! Type '!help' to see avaitable commands";
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

      // Show or hide the empty state based on the filteredTodos length
      const emptyState = document.querySelector('.todo-empty-state');
      if (filteredTodos.length === 0) {
        emptyState.style.display = 'flex'; // Show empty state
      } else {
        emptyState.style.display = 'none'; // Hide empty state
      }

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

  // Load snippets when the snippets tab is shown
  document.querySelector('[data-tab="snippets"]').addEventListener('click', loadSnippets);

  // Handle adding a new snippet
  addSnippetButton.addEventListener("click", () => {
    const snippetText = prompt("Enter your snippet text:");
    if (snippetText) {
      saveSnippet(snippetText);
    }
  });

  // Function to save a new snippet
  function saveSnippet(text) {
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || [];
      snippets.push({ id: Date.now(), text });
      chrome.storage.local.set({ snippets }, loadSnippets);
    });
  }

  // Function to load and display snippets
  function loadSnippets() {
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || [];
      const searchQuery = snippetSearchInput.value.toLowerCase();

      // Filter snippets based on the search query
      const filteredSnippets = snippets.filter(snippet =>
        snippet.text.toLowerCase().includes(searchQuery)
      );

      snippetsList.innerHTML = filteredSnippets.length === 0 ? getEmptyState() : "";

      filteredSnippets.forEach(snippet => {
        const snippetItem = document.createElement("div");
        snippetItem.className = "snippet-item";
        snippetItem.innerHTML = `
          <div class="snippet-content">
            <div class="snippet-text">${escapeHtml(snippet.text)}</div>
            <div class="snippet-actions">
              <button class="snippet-button copy-snippet" data-id="${snippet.id}" title="Copy to clipboard">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z" />
                  <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" />
                </svg>
                <span>Copy</span>
              </button>
              <button class="snippet-button edit-snippet" data-id="${snippet.id}" title="Edit snippet">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
              <button class="snippet-button delete-snippet" data-id="${snippet.id}" title="Delete snippet">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        `;

        // Handle copy button
        snippetItem.querySelector(".copy-snippet").addEventListener("click", async (e) => {
          const button = e.currentTarget;
          try {
            await navigator.clipboard.writeText(snippet.text);
            button.classList.add("snippet-success");
            showToast("Copied to clipboard!");
            setTimeout(() => button.classList.remove("snippet-success"), 300);
          } catch (err) {
            showToast("Failed to copy text", "error");
          }
        });

        // Handle edit button
        snippetItem.querySelector(".edit-snippet").addEventListener("click", () => {
          showEditModal(snippet);
        });

        // Handle delete button
        snippetItem.querySelector(".delete-snippet").addEventListener("click", () => {
          showDeleteConfirmation(snippet.id);
        });

        snippetsList.appendChild(snippetItem);
      });
    });
  }

  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Show edit modal
  function showEditModal(snippet) {
    const modal = document.createElement("div");
    modal.className = "delete-modal";
    modal.innerHTML = `
      <div class="delete-modal-header">
        <h3 class="delete-modal-title">Edit Snippet</h3>
      </div>
      <textarea class="snippet-edit-textarea" style="width: 100%; min-height: 100px; margin-bottom: 16px;">${snippet.text}</textarea>
      <div class="delete-modal-actions">
        <button class="delete-modal-button delete-cancel">Cancel</button>
        <button class="delete-modal-button delete-confirm" style="background: var(--button-bg);">Save</button>
      </div>
    `;

    const overlay = document.createElement("div");
    overlay.className = "delete-modal-overlay";

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      overlay.remove();
    };

    overlay.addEventListener("click", closeModal);
    modal.querySelector(".delete-cancel").addEventListener("click", closeModal);
    modal.querySelector(".delete-confirm").addEventListener("click", () => {
      const newText = modal.querySelector(".snippet-edit-textarea").value.trim();
      if (newText) {
        updateSnippet(snippet.id, newText);
        closeModal();
        showToast("Snippet updated successfully!");
      }
    });
  }

  // Show delete confirmation
  function showDeleteConfirmation(snippetId) {
    const modal = document.createElement("div");
    modal.className = "delete-modal";
    modal.innerHTML = `
      <div class="delete-modal-header">
        <h3 class="delete-modal-title">Delete Snippet</h3>
      </div>
      <div class="delete-modal-content">
        Are you sure you want to delete this snippet? This action cannot be undone.
      </div>
      <div class="delete-modal-actions">
        <button class="delete-modal-button delete-cancel">Cancel</button>
        <button class="delete-modal-button delete-confirm">Delete</button>
      </div>
    `;

    const overlay = document.createElement("div");
    overlay.className = "delete-modal-overlay";

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      overlay.remove();
    };

    overlay.addEventListener("click", closeModal);
    modal.querySelector(".delete-cancel").addEventListener("click", closeModal);
    modal.querySelector(".delete-confirm").addEventListener("click", () => {
      deleteSnippet(snippetId);
      closeModal();
      showToast("Snippet deleted successfully!");
    });
  }

  // Show toast notification
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `alert-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Get empty state HTML
  function getEmptyState() {
    return `
      <div class="snippet-empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" />
          </svg>
        </div>
        <div class="empty-state-content">
          <h3 class="empty-state-title">No snippets yet</h3>
          <p class="empty-state-description">Create your first snippet to quickly access frequently used text</p>
        </div>
      </div>
    `;
  }

  // Function to update a snippet
  function updateSnippet(id, newText) {
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || [];
      const updatedSnippets = snippets.map(snippet =>
        snippet.id === id ? { ...snippet, text: newText } : snippet
      );
      chrome.storage.local.set({ snippets: updatedSnippets }, loadSnippets);
    });
  }

  // Function to delete a snippet
  function deleteSnippet(id) {
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || [];
      const updatedSnippets = snippets.filter(snippet => snippet.id !== id);
      chrome.storage.local.set({ snippets: updatedSnippets }, loadSnippets);
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

  snippetSearchInput.addEventListener("input", () => {
    loadSnippets(); // Reload snippets to apply the search filter
  });

  // Function to fetch and display site certificate information
  async function fetchSiteCertificateInfo() {
    const siteCertificateInfo = document.getElementById("siteCertificateInfo");
    siteCertificateInfo.innerHTML = `
      <div class="loading-certificate">
        <div class="loading-spinner"></div>
        <p>Fetching certificate information...</p>
      </div>
    `;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.url || !tab.url.startsWith('https')) {
        siteCertificateInfo.innerHTML = `
          <div class="certificate-error">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p>${!tab?.url ? 'No active tab found.' : 'This site is not using HTTPS.'}</p>
          </div>
        `;
        return;
      }

      const domain = new URL(tab.url).hostname;
      const [crtResponse, sslLabsResponse] = await Promise.all([
        fetch(`https://crt.sh/?q=${domain}&output=json`),
        fetch(`https://api.ssllabs.com/api/v3/analyze?host=${domain}&all=done`)
      ]);

      const [certData, sslData] = await Promise.all([
        crtResponse.json(),
        sslLabsResponse.json()
      ]);

      if (certData && certData.length > 0) {
        const latestCert = certData[0];
        const validFrom = new Date(latestCert.not_before);
        const validTo = new Date(latestCert.not_after);
        const isExpired = validTo < new Date();
        const daysToExpiry = Math.ceil((validTo - new Date()) / (1000 * 60 * 60 * 24));

        // Parse the issuer name into components
        const issuerParts = latestCert.issuer_name.split(',').reduce((acc, part) => {
          const [key, value] = part.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});

        siteCertificateInfo.innerHTML = `
          <div class="certificate-info ${isExpired ? 'expired' : ''}">
            <div class="cert-header">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span class="cert-status ${isExpired ? 'expired' : 'valid'}">
                ${isExpired ? 'Certificate Expired' : 'Certificate Valid'}
              </span>
            </div>
            
            <div class="cert-details">
              <div class="cert-section">
                <h3>Domain Information</h3>
                <div class="cert-item">
                  <span class="label">Domain Name:</span>
                  <span class="value">${domain}</span>
                </div>
                <div class="cert-item">
                  <span class="label">Common Name (CN):</span>
                  <span class="value">${latestCert.common_name}</span>
                </div>
                ${latestCert.name_value ? `
                  <div class="cert-item">
                    <span class="label">Alternative Names:</span>
                    <span class="value">${latestCert.name_value.split('\n').join(', ')}</span>
                  </div>
                ` : ''}
              </div>

              <div class="cert-section">
                <h3>Certificate Details</h3>
                <div class="cert-item">
                  <span class="label">Serial Number:</span>
                  <span class="value mono">${latestCert.serial_number}</span>
                </div>
                <div class="cert-item">
                  <span class="label">Issuer Organization:</span>
                  <span class="value">${issuerParts.O || 'N/A'}</span>
                </div>
                <div class="cert-item">
                  <span class="label">Issuer Country:</span>
                  <span class="value">${issuerParts.C || 'N/A'}</span>
                </div>
              </div>

              <div class="cert-section">
                <h3>Validity Period</h3>
                <div class="cert-item">
                  <span class="label">Valid From:</span>
                  <span class="value">${validFrom.toLocaleString()}</span>
                </div>
                <div class="cert-item">
                  <span class="label">Valid Until:</span>
                  <span class="value">${validTo.toLocaleString()}</span>
                </div>
                <div class="cert-item">
                  <span class="label">Status:</span>
                  <span class="value status ${isExpired ? 'expired' : daysToExpiry < 30 ? 'warning' : 'valid'}">
                    ${isExpired ? 'Expired' : daysToExpiry < 30 ? `Expires in ${daysToExpiry} days` : 'Valid'}
                  </span>
                </div>
              </div>

              ${sslData?.endpoints?.[0] ? `
                <div class="cert-section">
                  <h3>SSL/TLS Security</h3>
                  <div class="cert-item">
                    <span class="label">SSL Rating:</span>
                    <span class="value grade-${sslData.endpoints[0].grade?.toLowerCase()}">${sslData.endpoints[0].grade || 'N/A'}</span>
                  </div>
                  <div class="cert-item">
                    <span class="label">Protocol Support:</span>
                    <span class="value">${Object.keys(sslData.endpoints[0].details?.protocols || {}).map(p => p.toUpperCase()).join(', ') || 'N/A'}</span>
                  </div>
                  <div class="cert-item">
                    <span class="label">Forward Secrecy:</span>
                    <span class="value">${sslData.endpoints[0].details?.forwardSecrecy ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      } else {
        throw new Error('No certificate data found');
      }
    } catch (error) {
      siteCertificateInfo.innerHTML = `
        <div class="certificate-error">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <p>Unable to fetch certificate information. ${error.message}</p>
        </div>
      `;
    }
  }

  // Add event listener for the Site Info tab
  document.querySelector('[data-tab="siteInfo"]').addEventListener('click', fetchSiteCertificateInfo);
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

  if (sender === "bot") {
    // Create typing indicator first
    const typingElement = document.createElement("div");
    typingElement.classList.add("chat-message", "bot-message", "typing-indicator");
    typingElement.innerHTML = `
      <div class="ticontainer">
        <div class="tiblock">
          <div class="tidot"></div>
          <div class="tidot"></div>
          <div class="tidot"></div>
        </div>
      </div>
    `;
    chatResults.appendChild(typingElement);
    typingElement.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Add actual message after delay
    setTimeout(() => {
      // Remove typing indicator
      typingElement.remove();

      // Add the actual message
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
      const now = new Date();
      const timeDiv = document.createElement("div");
      timeDiv.classList.add("message-time");
      timeDiv.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      messageElement.appendChild(timeDiv);

      chatResults.appendChild(messageElement);

      // Save to chat history
      saveChatMessage({
        sender,
        content,
        timestamp: now.toISOString()
      });

      messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 2500); // second delay before showing actual message

  } else {
    // For user messages, add them immediately without typing animation
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", `${sender}-message`);

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
      messageElement.textContent = content;
    }

    const now = new Date();
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("message-time");
    timeDiv.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.appendChild(timeDiv);

    chatResults.appendChild(messageElement);

    saveChatMessage({
      sender,
      content,
      timestamp: now.toISOString()
    });

    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
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




