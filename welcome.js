document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    const body = document.body;
  
    // Load saved theme
    chrome.storage.local.get('theme', (data) => {
      const savedTheme = data.theme || 'light';
      themeSelect.value = savedTheme;
      body.className = `${savedTheme}-theme`;
    });
  
    // Theme change handler
    themeSelect.addEventListener('change', (event) => {
      const selectedTheme = event.target.value;
      body.className = `${selectedTheme}-theme`;
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
  
  