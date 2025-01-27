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
        entry.site_url.toLowerCase().includes(searchValue.toLowerCase())
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
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
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

  // Game Management
  const games = {
    snake: {
      init(canvas) {
        const ctx = canvas.getContext('2d');
        let snake = [{x: 10, y: 10}];
        let food = {x: 15, y: 15};
        let direction = 'right';
        let score = 0;
        let gameLoop = null;
        let isGameStarted = false;
        const gridSize = 20;
        const tileSize = canvas.width / gridSize;

        // Draw grid background
        function drawGrid() {
          // Draw subtle grid lines
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.lineWidth = 1;
          
          // Draw vertical lines
          for (let i = 1; i < gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * tileSize, 0);
            ctx.lineTo(i * tileSize, canvas.height);
            ctx.stroke();
          }
          
          // Draw horizontal lines
          for (let i = 1; i < gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * tileSize);
            ctx.lineTo(canvas.width, i * tileSize);
            ctx.stroke();
          }
        }

        function drawSnake() {
          // Draw snake body
          snake.forEach((segment, index) => {
            // Gradient from head to tail
            const gradient = ctx.createLinearGradient(
              segment.x * tileSize, 
              segment.y * tileSize,
              segment.x * tileSize + tileSize,
              segment.y * tileSize + tileSize
            );
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, '#45a049');
            
            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#388E3C';
            
            // Round corners for snake segments
            ctx.beginPath();
            ctx.roundRect(
              segment.x * tileSize + 1, 
              segment.y * tileSize + 1, 
              tileSize - 2, 
              tileSize - 2,
              index === 0 ? 8 : 4 // Head has more rounded corners
            );
            ctx.fill();
            ctx.stroke();

            // Add eyes if it's the head
            if (index === 0) {
              ctx.fillStyle = 'white';
              const eyeSize = tileSize / 6;
              const eyeOffset = tileSize / 3;
              
              // Left eye
              ctx.beginPath();
              ctx.arc(
                segment.x * tileSize + eyeOffset,
                segment.y * tileSize + eyeOffset,
                eyeSize, 0, Math.PI * 2
              );
              ctx.fill();
              
              // Right eye
              ctx.beginPath();
              ctx.arc(
                segment.x * tileSize + tileSize - eyeOffset,
                segment.y * tileSize + eyeOffset,
                eyeSize, 0, Math.PI * 2
              );
              ctx.fill();

              // Add pupils based on direction
              ctx.fillStyle = 'black';
              const pupilSize = eyeSize / 2;
              let pupilOffsetX = 0;
              let pupilOffsetY = 0;
              
              switch(direction) {
                case 'up': pupilOffsetY = -1; break;
                case 'down': pupilOffsetY = 1; break;
                case 'left': pupilOffsetX = -1; break;
                case 'right': pupilOffsetX = 1; break;
              }

              ctx.beginPath();
              ctx.arc(
                segment.x * tileSize + eyeOffset + (pupilOffsetX * 2),
                segment.y * tileSize + eyeOffset + (pupilOffsetY * 2),
                pupilSize, 0, Math.PI * 2
              );
              ctx.fill();

              ctx.beginPath();
              ctx.arc(
                segment.x * tileSize + tileSize - eyeOffset + (pupilOffsetX * 2),
                segment.y * tileSize + eyeOffset + (pupilOffsetY * 2),
                pupilSize, 0, Math.PI * 2
              );
              ctx.fill();
            }
          });
        }

        function drawFood() {
          const x = food.x * tileSize;
          const y = food.y * tileSize;
          
          // Draw apple body
          ctx.fillStyle = '#FF5722';
          ctx.beginPath();
          ctx.arc(x + tileSize/2, y + tileSize/2, tileSize/2 - 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw leaf
          ctx.fillStyle = '#4CAF50';
          ctx.beginPath();
          ctx.ellipse(
            x + tileSize/2 + 2, 
            y + tileSize/3 - 2, 
            tileSize/4, 
            tileSize/6, 
            Math.PI/4, 
            0, Math.PI * 2
          );
          ctx.fill();
        }

        function moveSnake() {
          const head = {...snake[0]};
          
          switch(direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
          }

          // Check collision with walls or self
          if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize || 
              snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            clearInterval(gameLoop);
            
            // Draw game over overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 20);
            
            ctx.font = '20px Inter';
            ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
            
            ctx.font = '16px Inter';
            ctx.fillText('Press Space to try again', canvas.width/2, canvas.height/2 + 60);
            
            return false;
          }

          snake.unshift(head);
          
          // Check if snake ate food
          if (head.x === food.x && head.y === food.y) {
            score += 10;
            document.getElementById('gameScore').textContent = score;
            
            // Generate new food position
            do {
              food = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
              };
            } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
            
          } else {
            snake.pop();
          }
          
          return true;
        }

        function gameStep() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Fill with a subtle background color
          ctx.fillStyle = '#fafafa';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          drawGrid();
          drawFood();
          drawSnake();
          return moveSnake();
        }

        function startGame() {
          if (isGameStarted) return;
          
          // Reset game state
          snake = [{x: 10, y: 10}];
          food = {x: 15, y: 15};
          direction = 'right';
          score = 0;
          document.getElementById('gameScore').textContent = '0';
          isGameStarted = true;
          
          // Clear any existing game loop
          if (gameLoop) clearInterval(gameLoop);
          
          // Start new game loop
          gameLoop = setInterval(() => {
            if (!gameStep()) {
              clearInterval(gameLoop);
              isGameStarted = false;
            }
          }, 200);
        }

        function showStartScreen() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Fill with a subtle background color
          ctx.fillStyle = '#fafafa';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          drawGrid();
          
          // Draw welcome message
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.font = 'bold 32px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('Snake Game', canvas.width/2, canvas.height/2 - 40);
          
          ctx.font = '20px Inter';
          ctx.fillText('Press Space to Start', canvas.width/2, canvas.height/2 + 20);
          
          ctx.font = '16px Inter';
          ctx.fillText('Use Arrow Keys or WASD to play', canvas.width/2, canvas.height/2 + 60);
        }

        const keydownHandler = (e) => {
          if (!isGameStarted && e.key === ' ') {
            startGame();
            return;
          }

          if (!isGameStarted) return;

          switch(e.key) {
            case 'ArrowUp': case 'w': case 'W': 
              if (direction !== 'down') direction = 'up'; 
              break;
            case 'ArrowDown': case 's': case 'S': 
              if (direction !== 'up') direction = 'down'; 
              break;
            case 'ArrowLeft': case 'a': case 'A': 
              if (direction !== 'right') direction = 'left'; 
              break;
            case 'ArrowRight': case 'd': case 'D': 
              if (direction !== 'left') direction = 'right'; 
              break;
            case ' ':
              if (!isGameStarted) startGame();
              break;
          }
        };

        // Initial setup
        document.addEventListener('keydown', keydownHandler);
        showStartScreen();

        return {
          cleanup: () => {
            if (gameLoop) clearInterval(gameLoop);
            document.removeEventListener('keydown', keydownHandler);
          }
        };
      }
    },
    // Add 2048 game implementation
    '2048': {
      init(canvas) {
        const ctx = canvas.getContext('2d');
        const GRID_SIZE = 4;
        const CELL_SIZE = canvas.width / GRID_SIZE;
        const CELL_PADDING = 6;
        let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        let score = 0;
        let gameLoop = null;
        let isGameStarted = false;

        // Color schemes for different numbers
        const COLORS = {
          '2': '#eee4da',
          '4': '#ede0c8',
          '8': '#f2b179',
          '16': '#f59563',
          '32': '#f67c5f',
          '64': '#f65e3b',
          '128': '#edcf72',
          '256': '#edcc61',
          '512': '#edc850',
          '1024': '#edc53f',
          '2048': '#edc22e'
        };

        const TEXT_COLORS = {
          '2': '#776e65',
          '4': '#776e65',
          '8': '#f9f6f2',
          '16': '#f9f6f2',
          '32': '#f9f6f2',
          '64': '#f9f6f2',
          '128': '#f9f6f2',
          '256': '#f9f6f2',
          '512': '#f9f6f2',
          '1024': '#f9f6f2',
          '2048': '#f9f6f2'
        };

        function initGrid() {
          grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
          addNewTile();
          addNewTile();
          score = 0;
          document.getElementById('gameScore').textContent = '0';
          isGameStarted = true;
        }

        function addNewTile() {
          const emptyCells = [];
          for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
              if (grid[i][j] === 0) emptyCells.push({x: i, y: j});
            }
          }
          if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[x][y] = Math.random() < 0.9 ? 2 : 4;
          }
        }

        function drawGrid() {
          ctx.fillStyle = '#bbada0';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
              const value = grid[i][j];
              const x = j * CELL_SIZE + CELL_PADDING;
              const y = i * CELL_SIZE + CELL_PADDING;
              const width = CELL_SIZE - 2 * CELL_PADDING;
              const height = CELL_SIZE - 2 * CELL_PADDING;

              // Draw cell background
              ctx.fillStyle = value === 0 ? '#cdc1b4' : COLORS[value] || '#edc22e';
              ctx.beginPath();
              ctx.roundRect(x, y, width, height, 8);
              ctx.fill();

              if (value !== 0) {
                // Draw value
                ctx.fillStyle = TEXT_COLORS[value] || '#f9f6f2';
                ctx.font = `bold ${value >= 1024 ? 30 : 35}px Inter`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(value.toString(), x + width/2, y + height/2);
              }
            }
          }
        }

        function move(direction) {
          let moved = false;
          const newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));

          function processLine(line) {
            let newLine = line.filter(cell => cell !== 0);
            for (let i = 0; i < newLine.length - 1; i++) {
              if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                score += newLine[i];
                newLine.splice(i + 1, 1);
                moved = true;
              }
            }
            while (newLine.length < GRID_SIZE) newLine.push(0);
            return newLine;
          }

          if (direction === 'left' || direction === 'right') {
            for (let i = 0; i < GRID_SIZE; i++) {
              let line = grid[i].slice();
              if (direction === 'right') line.reverse();
              line = processLine(line);
              if (direction === 'right') line.reverse();
              newGrid[i] = line;
              if (line.join(',') !== grid[i].join(',')) moved = true;
            }
          } else {
            for (let j = 0; j < GRID_SIZE; j++) {
              let line = grid.map(row => row[j]);
              if (direction === 'down') line.reverse();
              line = processLine(line);
              if (direction === 'down') line.reverse();
              for (let i = 0; i < GRID_SIZE; i++) {
                newGrid[i][j] = line[i];
              }
              if (line.join(',') !== grid.map(row => row[j]).join(',')) moved = true;
            }
          }

          if (moved) {
            grid = newGrid;
            addNewTile();
            document.getElementById('gameScore').textContent = score;
          }

          if (!canMove()) {
            isGameStarted = false;
            showGameOver();
          }
        }

        function canMove() {
          // Check for empty cells
          for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
              if (grid[i][j] === 0) return true;
            }
          }

          // Check for possible merges
          for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
              const current = grid[i][j];
              if ((i < GRID_SIZE - 1 && grid[i + 1][j] === current) ||
                  (j < GRID_SIZE - 1 && grid[i][j + 1] === current)) {
                return true;
              }
            }
          }
          return false;
        }

        function showGameOver() {
          ctx.fillStyle = 'rgba(238, 228, 218, 0.73)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.fillStyle = '#776e65';
          ctx.font = 'bold 48px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 20);
          
          ctx.font = '24px Inter';
          ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
          
          ctx.font = '18px Inter';
          ctx.fillText('Press Space to try again', canvas.width/2, canvas.height/2 + 60);
        }

        function showStartScreen() {
          ctx.fillStyle = '#faf8ef';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.fillStyle = '#776e65';
          ctx.font = 'bold 48px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('2048', canvas.width/2, canvas.height/2 - 40);
          
          ctx.font = '24px Inter';
          ctx.fillText('Press Space to Start', canvas.width/2, canvas.height/2 + 20);
          
          ctx.font = '18px Inter';
          ctx.fillText('Press Space to Start', canvas.width/2, canvas.height/2 + 60);
        }

        const keydownHandler = (e) => {
          if (!isGameStarted && e.key === ' ') {
            initGrid();
            gameLoop = requestAnimationFrame(function animate() {
              drawGrid();
              gameLoop = requestAnimationFrame(animate);
            });
            return;
          }

          if (!isGameStarted) return;

          switch(e.key) {
            case 'ArrowUp': move('up'); break;
            case 'ArrowDown': move('down'); break;
            case 'ArrowLeft': move('left'); break;
            case 'ArrowRight': move('right'); break;
          }
        };

        document.addEventListener('keydown', keydownHandler);
        showStartScreen();

        return {
          cleanup: () => {
            if (gameLoop) cancelAnimationFrame(gameLoop);
            document.removeEventListener('keydown', keydownHandler);
          }
        };
      }
    },
    // Add Tic Tac Toe implementation
    'tictactoe': {
      init(canvas) {
        const ctx = canvas.getContext('2d');
        const CELL_SIZE = canvas.width / 3;
        let board = Array(9).fill(null);
        let currentPlayer = 'X';
        let gameLoop = null;
        let isGameStarted = false;
        let gameOver = false;

        function drawBoard() {
          ctx.fillStyle = '#fafafa';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw grid lines
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          
          // Vertical lines
          ctx.beginPath();
          ctx.moveTo(CELL_SIZE, 0);
          ctx.lineTo(CELL_SIZE, canvas.height);
          ctx.moveTo(CELL_SIZE * 2, 0);
          ctx.lineTo(CELL_SIZE * 2, canvas.height);
          ctx.stroke();

          // Horizontal lines
          ctx.beginPath();
          ctx.moveTo(0, CELL_SIZE);
          ctx.lineTo(canvas.width, CELL_SIZE);
          ctx.moveTo(0, CELL_SIZE * 2);
          ctx.lineTo(canvas.width, CELL_SIZE * 2);
          ctx.stroke();

          // Draw X's and O's
          board.forEach((cell, index) => {
            if (cell) {
              const x = (index % 3) * CELL_SIZE;
              const y = Math.floor(index / 3) * CELL_SIZE;
              drawSymbol(cell, x, y);
            }
          });
        }

        function drawSymbol(symbol, x, y) {
          ctx.strokeStyle = symbol === 'X' ? '#FF5722' : '#2196F3';
          ctx.lineWidth = 8;
          const padding = 40;

          if (symbol === 'X') {
            ctx.beginPath();
            ctx.moveTo(x + padding, y + padding);
            ctx.lineTo(x + CELL_SIZE - padding, y + CELL_SIZE - padding);
            ctx.moveTo(x + CELL_SIZE - padding, y + padding);
            ctx.lineTo(x + padding, y + CELL_SIZE - padding);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(
              x + CELL_SIZE/2,
              y + CELL_SIZE/2,
              CELL_SIZE/2 - padding,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          }
        }

        function checkWinner() {
          const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
          ];

          for (let line of lines) {
            const [a, b, c] = line;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
              return board[a];
            }
          }

          if (board.every(cell => cell !== null)) {
            return 'tie';
          }

          return null;
        }

        function handleClick(e) {
          if (!isGameStarted || gameOver) return;

          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const col = Math.floor(x / CELL_SIZE);
          const row = Math.floor(y / CELL_SIZE);
          const index = row * 3 + col;

          if (board[index] === null) {
            board[index] = currentPlayer;
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            
            const winner = checkWinner();
            if (winner) {
              gameOver = true;
              setTimeout(() => showGameOver(winner), 100);
            }
          }
        }

        function showGameOver(winner) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = 'white';
          ctx.font = 'bold 48px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(
            winner === 'tie' ? 'Tie Game!' : `${winner} Wins!`,
            canvas.width/2,
            canvas.height/2 - 20
          );

          ctx.font = '24px Inter';
          ctx.fillText('Press Space to play again', canvas.width/2, canvas.height/2 + 40);
          
          isGameStarted = false;
        }

        function showStartScreen() {
          ctx.fillStyle = '#fafafa';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.fillStyle = '#333';
          ctx.font = 'bold 48px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('Tic Tac Toe', canvas.width/2, canvas.height/2 - 40);
          
          ctx.font = '24px Inter';
          ctx.fillText('Press Space to Start', canvas.width/2, canvas.height/2 + 20);
          
          ctx.font = '18px Inter';
          ctx.fillText('Click to place X or O', canvas.width/2, canvas.height/2 + 60);
        }

        function startGame() {
          board = Array(9).fill(null);
          currentPlayer = 'X';
          gameOver = false;
          isGameStarted = true;
          document.getElementById('gameScore').textContent = '0';
          
          gameLoop = requestAnimationFrame(function animate() {
            drawBoard();
            gameLoop = requestAnimationFrame(animate);
          });
        }

        canvas.addEventListener('click', handleClick);

        const keydownHandler = (e) => {
          if (e.key === ' ') {
            if (!isGameStarted || gameOver) {
              startGame();
            }
          }
        };

        document.addEventListener('keydown', keydownHandler);
        showStartScreen();

        return {
          cleanup: () => {
            if (gameLoop) cancelAnimationFrame(gameLoop);
            document.removeEventListener('keydown', keydownHandler);
            canvas.removeEventListener('click', handleClick);
          }
        };
      }
    },
    // Add Memory Card implementation
    'memory': {
      init(canvas) {
        const ctx = canvas.getContext('2d');
        const GRID_SIZE = 4;
        const CARD_SIZE = canvas.width / GRID_SIZE;
        const PADDING = 10;
        let cards = [];
        let flippedCards = [];
        let matchedPairs = 0;
        let score = 0;
        let gameLoop = null;
        let isGameStarted = false;

        const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

        function initCards() {
          cards = [];
          flippedCards = [];
          matchedPairs = 0;
          score = 0;
          document.getElementById('gameScore').textContent = '0';

          // Create pairs of cards
          const cardPairs = [...EMOJIS, ...EMOJIS];
          // Shuffle cards
          for (let i = cardPairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
          }

          // Create card objects
          for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
              cards.push({
                emoji: cardPairs[i * GRID_SIZE + j],
                x: j * CARD_SIZE,
                y: i * CARD_SIZE,
                isFlipped: false,
                isMatched: false
              });
            }
          }
        }

        function drawCards() {
          ctx.fillStyle = '#fafafa';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          cards.forEach(card => {
            const x = card.x + PADDING;
            const y = card.y + PADDING;
            const width = CARD_SIZE - 2 * PADDING;
            const height = CARD_SIZE - 2 * PADDING;

            ctx.fillStyle = card.isMatched ? '#e0e0e0' : '#fff';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            
            // Draw card background
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 8);
            ctx.fill();
            ctx.stroke();

            if (card.isFlipped || card.isMatched) {
              // Draw emoji
              ctx.font = `${CARD_SIZE/2}px Arial`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(
                card.emoji,
                x + width/2,
                y + height/2
              );
            } else {
              // Draw card back pattern
              ctx.fillStyle = '#ddd';
              ctx.beginPath();
              ctx.roundRect(x + 10, y + 10, width - 20, height - 20, 4);
              ctx.fill();
            }
          });
        }

        function handleClick(e) {
          if (!isGameStarted || flippedCards.length >= 2) return;

          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          cards.forEach((card, index) => {
            if (!card.isFlipped && !card.isMatched &&
                x >= card.x && x <= card.x + CARD_SIZE &&
                y >= card.y && y <= card.y + CARD_SIZE) {
              flipCard(index);
            }
          });
        }

        function flipCard(index) {
          cards[index].isFlipped = true;
          flippedCards.push(index);

          if (flippedCards.length === 2) {
            const [first, second] = flippedCards;
            
            if (cards[first].emoji === cards[second].emoji) {
              // Match found
              cards[first].isMatched = true;
              cards[second].isMatched = true;
              matchedPairs++;
              score += 100;
              document.getElementById('gameScore').textContent = score;
              flippedCards = [];

              if (matchedPairs === EMOJIS.length) {
                setTimeout(showGameOver, 500);
              }
            } else {
              // No match
              setTimeout(() => {
                cards[first].isFlipped = false;
                cards[second].isFlipped = false;
                flippedCards = [];
              }, 1000);
            }
          }
        }

        function showGameOver() {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = 'white';
          ctx.font = 'bold 48px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('You Win!', canvas.width/2, canvas.height/2 - 20);

          ctx.font = '24px Inter';
          ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 20);

          ctx.font = '18px Inter';
          ctx.fillText('Press Space to play again', canvas.width/2, canvas.height/2 + 60);
          
          isGameStarted = false;
        }

        function showStartScreen() {
          ctx.fillStyle = '#fafafa';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = '#333';
          ctx.font = 'bold 48px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('Memory Game', canvas.width/2, canvas.height/2 - 40);

          ctx.font = '24px Inter';
          ctx.fillText('Press Space to Start', canvas.width/2, canvas.height/2 + 20);

          ctx.font = '18px Inter';
          ctx.fillText('Match pairs of cards', canvas.width/2, canvas.height/2 + 60);
        }

        canvas.addEventListener('click', handleClick);

        const keydownHandler = (e) => {
          if (e.key === ' ') {
            if (!isGameStarted) {
              isGameStarted = true;
              initCards();
              gameLoop = requestAnimationFrame(function animate() {
                drawCards();
                gameLoop = requestAnimationFrame(animate);
              });
            }
          }
        };

        document.addEventListener('keydown', keydownHandler);
        showStartScreen();

        return {
          cleanup: () => {
            if (gameLoop) cancelAnimationFrame(gameLoop);
            document.removeEventListener('keydown', keydownHandler);
            canvas.removeEventListener('click', handleClick);
          }
        };
      }
    }
  };

  // Initialize game controls
  function initializeGameControls() {
    const gameCards = document.querySelectorAll('.game-card');
    const gameCanvas = document.getElementById('gameCanvas');
    const canvas = document.getElementById('canvas');
    const gamesGrid = document.querySelector('.games-grid');
    const backButton = document.querySelector('.back-button');
    let currentGame = null;

    function cleanupCurrentGame() {
      if (currentGame && currentGame.cleanup) {
        currentGame.cleanup();
        currentGame = null;
      }
    }

    gameCards.forEach(card => {
      card.addEventListener('click', () => {
        const gameType = card.dataset.game;
        if (!games[gameType]) return;

        gamesGrid.style.display = 'none';
        gameCanvas.style.display = 'block';
        
        // Set canvas size
        canvas.width = 400;
        canvas.height = 400;
        
        // Reset score
        document.getElementById('gameScore').textContent = '0';
        
        // Cleanup previous game if exists
        cleanupCurrentGame();
        
        // Initialize new game
        currentGame = games[gameType].init(canvas);
      });
    });

    backButton.addEventListener('click', () => {
      gameCanvas.style.display = 'none';
      gamesGrid.style.display = 'grid';
      cleanupCurrentGame();
    });
  }

  // Add this to your DOMContentLoaded event listener
  initializeGameControls();

  // Add this after the DOMContentLoaded event listener
  function initializeBase64() {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const inputFile = document.getElementById('inputFile');
    const fileDropZone = document.querySelector('.file-drop-zone');
    const fileInfo = document.querySelector('.file-info');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    let currentFile = null;
    let currentFileName = '';
    let currentFileType = '';

    // Toggle between text and file input
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const type = btn.dataset.type;
        document.querySelector('.text-input').classList.toggle('active', type === 'text');
        document.querySelector('.file-input').classList.toggle('active', type === 'file');
        
        // Reset outputs
        outputText.value = '';
        downloadBtn.disabled = true;
        currentFile = null;
        fileInfo.textContent = '';
      });
    });

    // File Drop Zone handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      fileDropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      fileDropZone.addEventListener(eventName, () => {
        fileDropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      fileDropZone.addEventListener(eventName, () => {
        fileDropZone.classList.remove('dragover');
      });
    });

    fileDropZone.addEventListener('drop', handleDrop);
    inputFile.addEventListener('change', handleFileSelect);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      handleFile(file);
    }

    function handleFileSelect(e) {
      const file = e.target.files[0];
      handleFile(file);
    }

    function handleFile(file) {
      if (!file) return;
      
      currentFile = file;
      currentFileName = file.name;
      currentFileType = file.type || 'application/octet-stream';
      fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
      outputText.value = '';
      downloadBtn.disabled = true;
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function encodeBase64() {
      try {
        if (document.querySelector('[data-type="file"].active')) {
          if (!currentFile) {
            alert('Please select a file first');
            return;
          }
          
          loadingOverlay.classList.add('active');
          const base64 = await fileToBase64(currentFile);
          outputText.value = base64;
          downloadBtn.disabled = true;
        } else {
          const input = inputText.value;
          outputText.value = btoa(unescape(encodeURIComponent(input)));
          downloadBtn.disabled = true;
        }
      } catch (error) {
        outputText.value = 'Error: Invalid input for encoding';
      } finally {
        loadingOverlay.classList.remove('active');
      }
    }

    async function decodeBase64() {
      try {
        const input = inputText.value;
        if (!input) {
          alert('Please enter base64 string to decode');
          return;
        }

        loadingOverlay.classList.add('active');
        
        // Try to decode as file first
        try {
          const [mimeType, fileName] = detectFileFromBase64(input);
          if (mimeType) {
            const blob = base64ToBlob(input, mimeType);
            currentFile = blob;
            currentFileName = fileName || 'decoded_file';
            currentFileType = mimeType;
            outputText.value = `File detected: ${currentFileName} (${mimeType})`;
            downloadBtn.disabled = false;
            return;
          }
        } catch (e) {
          // If file detection fails, try as text
          const decoded = decodeURIComponent(escape(atob(input)));
          outputText.value = decoded;
          downloadBtn.disabled = true;
        }
      } catch (error) {
        outputText.value = 'Error: Invalid base64 input';
      } finally {
        loadingOverlay.classList.remove('active');
      }
    }

    function detectFileFromBase64(base64String) {
      // Check for common file signatures
      const signatures = {
        '/9j/': ['image/jpeg', 'file.jpg'],
        'iVBORw0KGgo': ['image/png', 'file.png'],
        'JVBERi0': ['application/pdf', 'file.pdf'],
        'UEsDBBQA': ['application/zip', 'file.zip'],
        'R0lGODlh': ['image/gif', 'file.gif'],
        'AAABAA': ['image/x-icon', 'file.ico']
      };

      for (let [signature, [mimeType, fileName]] of Object.entries(signatures)) {
        if (base64String.startsWith(signature)) {
          return [mimeType, fileName];
        }
      }

      return [null, null];
    }

    function base64ToBlob(base64, mimeType) {
      const byteCharacters = atob(base64);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        byteArrays.push(new Uint8Array(byteNumbers));
      }

      return new Blob(byteArrays, { type: mimeType });
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = error => reject(error);
      });
    }

    async function copyToClipboard() {
      try {
        await navigator.clipboard.writeText(outputText.value);
        copyBtn.classList.add('success');
        copyBtn.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          copyBtn.classList.remove('success');
          copyBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z"/>
              <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2"/>
            </svg>
            Copy
          `;
        }, 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }

    function downloadFile() {
      if (!currentFile) return;
      
      const url = URL.createObjectURL(currentFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function clearAll() {
      inputText.value = '';
      outputText.value = '';
      currentFile = null;
      currentFileName = '';
      currentFileType = '';
      fileInfo.textContent = '';
      downloadBtn.disabled = true;
      inputText.focus();
    }

    encodeBtn.addEventListener('click', encodeBase64);
    decodeBtn.addEventListener('click', decodeBase64);
    copyBtn.addEventListener('click', copyToClipboard);
    downloadBtn.addEventListener('click', downloadFile);
    clearBtn.addEventListener('click', clearAll);

    // Add keyboard shortcuts
    inputText.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'Enter':
            encodeBase64();
            e.preventDefault();
            break;
          case 'b':
            decodeBase64();
            e.preventDefault();
            break;
        }
      }
    });
  }

  // Add this to your DOMContentLoaded event listener
  initializeBase64();

  function initializeThemeSelector() {
    const themeSelect = document.getElementById('themeSelect');

    // Function to apply theme
    function applyTheme(themeName) {
      const root = document.documentElement;
      
      // Remove all existing theme classes
      root.classList.remove('light-theme', 'dark-theme', 'forest-theme', 'sunset-theme', 'ocean-theme', 'lavender-theme', 'ember-theme', 'mint-theme');
      
      // Add the new theme class
      root.classList.add(`${themeName}-theme`);

      // Apply theme variables
      root.style.setProperty('--bg-color', `var(--${themeName}-bg)`);
      root.style.setProperty('--text-color', `var(--${themeName}-text)`);
      root.style.setProperty('--secondary-text', `var(--${themeName}-secondary-text)`);
      root.style.setProperty('--input-bg', `var(--${themeName}-input-bg)`);
      root.style.setProperty('--input-border', `var(--${themeName}-input-border)`);
      root.style.setProperty('--button-bg', `var(--${themeName}-button-bg)`);
      root.style.setProperty('--button-hover', `var(--${themeName}-button-hover)`);
      root.style.setProperty('--button-text', `var(--${themeName}-button-text, #ffffff)`);
      root.style.setProperty('--chat-user-bg', `var(--${themeName}-chat-user-bg, var(--${themeName}-input-bg))`);
      root.style.setProperty('--chat-bot-bg', `var(--${themeName}-chat-bot-bg, var(--${themeName}-card-bg))`);
      root.style.setProperty('--header-bg', `var(--${themeName}-header-bg, var(--${themeName}-bg))`);
      root.style.setProperty('--success', `var(--${themeName}-success, #34c759)`);
      root.style.setProperty('--card-bg', `var(--${themeName}-card-bg, var(--${themeName}-bg))`);
      root.style.setProperty('--card-border', `var(--${themeName}-card-border, var(--${themeName}-input-border))`);
      root.style.setProperty('--hover-bg', `var(--${themeName}-hover-bg, var(--${themeName}-input-bg))`);
    }

    // Handle theme changes
    themeSelect.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      applyTheme(selectedTheme);
      chrome.storage.local.set({ theme: selectedTheme });
    });

    // Load saved theme
    chrome.storage.local.get(['theme'], (data) => {
      const theme = data.theme || 'light';
      themeSelect.value = theme;
      applyTheme(theme);
    });
  }

  // Add to your DOMContentLoaded event listener
  initializeThemeSelector();

  // Add this to your DOMContentLoaded event listener
  function initializeWelcomeScreen() {
    chrome.storage.local.get(['firstTime'], (data) => {
      if (data.firstTime !== false) {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const getStartedBtn = document.getElementById('getStartedBtn');
        
        // Make sure welcome screen is visible
        welcomeScreen.style.display = 'flex';
        
        getStartedBtn.addEventListener('click', () => {
          welcomeScreen.classList.add('hide');
          // Remove welcome screen after animation
          setTimeout(() => {
            welcomeScreen.style.display = 'none';
          }, 300);
          chrome.storage.local.set({ firstTime: false });
        });
      } else {
        const welcomeScreen = document.getElementById('welcomeScreen');
        welcomeScreen.style.display = 'none';
      }
    });
  }

  // Add to your DOMContentLoaded event listener
  initializeWelcomeScreen();
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




