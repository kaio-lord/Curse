chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ isAdBlockEnabled: true });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.isAdBlockEnabled) {
    const isAdBlockEnabled = changes.isAdBlockEnabled.newValue;
    chrome.runtime.sendMessage({ action: 'toggleAdBlock', isAdBlockEnabled });
  }
});
