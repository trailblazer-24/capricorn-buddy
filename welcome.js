document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    const body = document.body;
  
    function applyTheme(theme) {
      body.className = `${theme}-theme`;
      themeSelect.value = theme;
    }
  
    // Load saved theme
    chrome.storage.local.get('theme', (data) => {
      const savedTheme = data.theme || 'light';
      applyTheme(savedTheme);
    });
  
    // Theme change handler
    themeSelect.addEventListener('change', (event) => {
      const selectedTheme = event.target.value;
      applyTheme(selectedTheme);
    });
  
    document.getElementById('saveSettings').addEventListener('click', () => {
      const username = document.getElementById('username').value;
      const theme = themeSelect.value;
      if (username) {
        chrome.storage.local.set({ username, theme }, () => {
          window.close();
        });
      } else {
        alert('Please enter a name.');
      }
    });
  });
  
  