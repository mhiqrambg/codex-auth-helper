// background.js — Service Worker for async Session data retrieval + file download
// Follows Manifest V3 best practices, avoids global state loss

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.id || sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, error: 'INVALID_SENDER' });
    return false;
  }

  if (!sender.url || !sender.url.startsWith(chrome.runtime.getURL(''))) {
    sendResponse({ success: false, error: 'INVALID_ORIGIN' });
    return false;
  }

  if (message.action === 'fetch_session') {
    fetchChatGPTSession()
      .then(sessionData => {
        sendResponse({ success: true, data: sessionData });
      })
      .catch(error => {
        sendResponse({ success: false, error: 'SESSION_FETCH_FAILED' });
      });
    return true;
  }

  if (message.action === 'download_auth_json') {
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(message.jsonContent);
    const filename = message.filename || 'auth.json';
    
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: 'DOWNLOAD_FAILED' });
      } else {
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    return true;
  }
});

/**
 * Cross-origin request to ChatGPT Session API
 * Due to the host_permissions declaration for https://chatgpt.com/ in manifest.json,
 * the Service Worker can safely make this request in the background without CORS restrictions.
 */
async function fetchChatGPTSession() {
  const response = await fetch('https://chatgpt.com/api/auth/session', {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    throw new Error(`HTTP error, status: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data || !data.accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  return data;
}
