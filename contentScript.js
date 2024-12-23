chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showResults" || request.action === "showNoResults") {
      showResultsOverlay(request);
    }
  });
  
  function showResultsOverlay(request) {
    removeExistingOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'capricornBuddyOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      max-height: 400px;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      z-index: 9999;
      overflow-y: auto;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-family: Arial, sans-serif;
    `;
  
    let content = '<h3 style="margin-top: 0;">Capricorn Buddy Results</h3>';
    if (request.action === "showResults") {
      request.results.forEach(site => {
        content += `<div style="margin-bottom: 10px;"><strong>${site.url}</strong><p style="margin: 5px 0;">${site.notes}</p></div>`;
      });
    } else {
      content += `<p>No results found for "${request.searchTerm}"</p>`;
    }
  
    overlay.innerHTML = content;
  
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
      display: block;
      margin-top: 10px;
      padding: 5px 10px;
      background-color: #4a90e2;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    `;
    closeButton.onclick = removeExistingOverlay;
  
    overlay.appendChild(closeButton);
    document.body.appendChild(overlay);
  }
  
  function removeExistingOverlay() {
    const existingOverlay = document.getElementById('capricornBuddyOverlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
  }
  
  // Add this line to handle the case when the extension is first loaded on a page
  removeExistingOverlay();