document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('saveUsername').addEventListener('click', () => {
      const username = document.getElementById('username').value;
      if (username) {
        chrome.storage.local.set({ username }, () => {
          window.close();
        });
      } else {
        alert('Please enter a name.');
      }
    });
  });
  
  