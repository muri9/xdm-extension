const handleDownloads = document.getElementById('handle_downloads');

console.log('hello from popup.js')

chrome.storage.local.get('handle_downloads', (value) => {
    handleDownloads.checked = value.handle_downloads;
});

handleDownloads.addEventListener('change', (e) => {
    chrome.storage.local.set({'handle_downloads': e.target.checked});
});
