chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed!');
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'searchInCapricorn',
    title: 'Search in Capricorn',
    contexts: ['selection']
  });
});

// Sample data for search (you can replace this with your actual data source)
const capricornData = [
  { title: 'Chrome Extension Development', content: 'Learn how to create Chrome extensions' },
  { title: 'JavaScript Basics', content: 'Understanding JavaScript fundamentals' },
  { title: 'Web Development', content: 'Modern web development techniques and tools' }
];

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'searchInCapricorn') {
    handleSearchInCapricorn(info, tab);
  }
});

async function handleSearchInCapricorn(info, tab) {
  if (info.selectionText) {
    const query = info.selectionText.trim().toLowerCase();
    
    // Search through the data
    const results = capricornData.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.content.toLowerCase().includes(query)
    );

    // Show results in a notification
    if (results.length > 0) {
      chrome.notifications.create({
        type: 'list',
        iconUrl: 'icon48.png',
        title: 'Search Results',
        message: `Found ${results.length} matches`,
        items: results.map(item => ({
          title: item.title,
          message: item.content.substring(0, 50) + '...'
        })),
        buttons: [{ title: 'View All' }]
      });
    } else {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Search Results',
        message: 'No matches found for your search.'
      });
    }
  }
}