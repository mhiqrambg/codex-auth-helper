// popup.js — Codex Auth Helper Core Interaction Logic
// Pure local processing principle - no storage, no cloud upload

const SessionManager = (() => {
  let privateSession = null;
  
  return {
    set: (data) => {
      privateSession = data;
    },
    get: () => privateSession,
    clear: () => {
      privateSession = null;
    },
    hasSession: () => privateSession !== null
  };
})();

const StorageManager = (() => {
  const MAX_ACCOUNTS = 10;
  const STORAGE_KEY = 'saved_accounts';

  return {
    async getSavedAccounts() {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          resolve(result[STORAGE_KEY] || []);
        });
      });
    },

    async saveAccount(sessionData) {
      const accounts = await this.getSavedAccounts();
      
      if (accounts.length >= MAX_ACCOUNTS) {
        throw new Error(`Maximum ${MAX_ACCOUNTS} accounts allowed`);
      }

      const existingIndex = accounts.findIndex(acc => acc.email === sessionData.user?.email);
      
      const accountData = {
        id: existingIndex >= 0 ? accounts[existingIndex].id : Date.now().toString(),
        email: sessionData.user?.email || 'unknown@example.com',
        name: sessionData.user?.name || 'Unknown User',
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.sessionToken || 'placeholder',
        idToken: this.generateSyntheticIdToken(sessionData),
        userId: sessionData.user?.id || '',
        accountId: sessionData.account?.id || '',
        planType: sessionData.account?.planType || 'free',
        savedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        accounts[existingIndex] = accountData;
      } else {
        accounts.push(accountData);
      }

      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: accounts }, () => {
          resolve(accountData);
        });
      });
    },

    async deleteAccount(accountId) {
      const accounts = await this.getSavedAccounts();
      const filtered = accounts.filter(acc => acc.id !== accountId);
      
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: filtered }, () => {
          resolve(filtered);
        });
      });
    },

    async clearAllAccounts() {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
          resolve();
        });
      });
    },

    generateSyntheticIdToken(sessionData) {
      const accountId = sessionData.account?.id || '';
      const email = sessionData.user?.email || '';
      const planType = sessionData.account?.planType || 'free';
      const iat = Math.floor(Date.now() / 1000);
      const exp = sessionData.expires ? Math.floor(new Date(sessionData.expires).getTime() / 1000) : iat + (30 * 24 * 3600);

      const jwtHeader = { alg: 'none', typ: 'JWT', cpa_synthetic: true };
      const jwtPayload = {
        iat, exp,
        "https://api.openai.com/auth": {
          chatgpt_account_id: accountId,
          chatgpt_plan_type: planType,
          chatgpt_user_id: sessionData.user?.id || '',
          user_id: sessionData.user?.id || ''
        },
        email
      };

      const base64UrlEncode = (obj) => {
        const str = JSON.stringify(obj);
        const base64 = btoa(unescape(encodeURIComponent(str)));
        return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      };

      return `${base64UrlEncode(jwtHeader)}.${base64UrlEncode(jwtPayload)}.synthetic`;
    }
  };
})();

let countdownInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initSessionFetch();
  bindEvents();
  loadSavedAccounts();
  
  window.addEventListener('beforeunload', () => {
    SessionManager.clear();
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  });
});

function initSessionFetch() {
  showState('loading');
  
  chrome.runtime.sendMessage({ action: 'fetch_session' }, (response) => {
    if (chrome.runtime.lastError) {
      showState('unauthorized');
      return;
    }

    if (response && response.success) {
      SessionManager.set(response.data);
      renderAuthorizedState(response.data);
      showState('authorized');
    } else {
      showState('unauthorized');
    }
  });
}

/**
 * Switch UI display state
 * @param {'loading'|'unauthorized'|'authorized'} state 
 */
function showState(state) {
  const loadingEl = document.getElementById('state-loading');
  const unauthorizedEl = document.getElementById('state-unauthorized');
  const authorizedEl = document.getElementById('state-authorized');

  loadingEl.classList.remove('active');
  unauthorizedEl.classList.remove('active');
  authorizedEl.classList.remove('active');

  if (state === 'loading') {
    loadingEl.classList.add('active');
  } else if (state === 'unauthorized') {
    unauthorizedEl.classList.add('active');
  } else if (state === 'authorized') {
    authorizedEl.classList.add('active');
  }
}

function renderAuthorizedState(session) {
  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');
  const planEl = document.getElementById('badge-plan');
  const expiresEl = document.getElementById('token-expires');

  const user = session.user || {};
  
  const imageUrl = user.image || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
  if (isValidImageUrl(imageUrl)) {
    avatarEl.src = imageUrl;
  } else {
    avatarEl.src = 'https://lh3.googleusercontent.com/a/default-user=s96-c';
  }
  
  nameEl.textContent = sanitizeText(user.name || 'ChatGPT User');
  emailEl.textContent = sanitizeText(user.email || 'No Email Bound');

  const account = session.account || {};
  const planType = (account.planType || 'free').toUpperCase();
  planEl.textContent = sanitizeText(planType);
  
  if (planType === 'PLUS' || planType === 'PRO') {
    planEl.className = 'plan-badge plus';
  } else {
    planEl.className = 'plan-badge free';
  }

  const expiresTime = session.expires ? new Date(session.expires) : null;
  if (expiresTime) {
    expiresEl.textContent = formatLocalDate(expiresTime);
    startCountdown(expiresTime);
  } else {
    expiresEl.textContent = 'Long-term Valid';
    document.getElementById('token-countdown').textContent = 'Unlimited';
  }
}

function bindEvents() {
  document.getElementById('btn-login').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://chatgpt.com/' });
    window.close();
  });

  document.getElementById('btn-save').addEventListener('click', async () => {
    if (!SessionManager.hasSession()) {
      showToast('❌ No active session to save');
      return;
    }

    try {
      const session = SessionManager.get();
      const savedAccount = await StorageManager.saveAccount(session);
      showToast(`✅ Saved: ${savedAccount.email}`);
      await loadSavedAccounts();
    } catch (error) {
      showToast(`❌ ${error.message}`);
    }
  });

  document.getElementById('btn-download-current').addEventListener('click', async () => {
    if (!SessionManager.hasSession()) {
      showToast('❌ No active session to export');
      return;
    }

    if (!confirm('⚠️ Security Warning\n\nThis file contains sensitive authentication tokens. Please ensure:\n\n1. Save to a secure location\n2. Do not share with others\n3. Do not upload to cloud storage\n\nConfirm export?')) {
      return;
    }

    const session = SessionManager.get();
    const authJsonString = generateCodexAuthJson(session);
    downloadFile(authJsonString, 'auth.json');
    showToast('🎉 auth.json download started');
    
    setTimeout(() => {
      SessionManager.clear();
    }, 3000);
  });

  document.getElementById('btn-export-saved').addEventListener('click', async () => {
    const exportFormat = document.querySelector('input[name="export-format"]:checked')?.value || 'codex';
    const savedAccounts = await StorageManager.getSavedAccounts();

    if (savedAccounts.length === 0) {
      showToast('❌ No saved accounts');
      return;
    }

    if (exportFormat === '9router') {
      if (!confirm(`⚠️ Export ${savedAccounts.length} account(s) in 9router format?\n\nThis will export all saved accounts as an array.`)) {
        return;
      }

      const routerFormat = savedAccounts.map(acc => ({
        accessToken: acc.accessToken,
        refreshToken: acc.refreshToken,
        idToken: acc.idToken,
        email: acc.email
      }));

      const jsonString = JSON.stringify(routerFormat, null, 2);
      downloadFile(jsonString, 'auth_9router.json');
      showToast(`🎉 Exported ${savedAccounts.length} accounts`);

    } else {
      if (!confirm('⚠️ Export first saved account in Codex format?')) {
        return;
      }

      const firstAccount = savedAccounts[0];
      const authConfig = {
        auth_mode: "chatgpt",
        OPENAI_API_KEY: null,
        tokens: {
          id_token: firstAccount.idToken,
          access_token: firstAccount.accessToken,
          refresh_token: firstAccount.refreshToken,
          account_id: firstAccount.accountId
        },
        last_refresh: firstAccount.savedAt
      };

      const jsonString = JSON.stringify(authConfig, null, 2);
      downloadFile(jsonString, 'auth.json');
      showToast('🎉 auth.json download started');
    }
  });

  document.getElementById('btn-clear-all').addEventListener('click', async () => {
    const savedAccounts = await StorageManager.getSavedAccounts();
    
    if (savedAccounts.length === 0) return;

    if (!confirm(`⚠️ Delete all ${savedAccounts.length} saved account(s)?\n\nThis action cannot be undone.`)) {
      return;
    }

    await StorageManager.clearAllAccounts();
    await loadSavedAccounts();
    showToast('✅ All accounts cleared');
  });
}

function downloadFile(content, filename) {
  chrome.runtime.sendMessage({
    action: 'download_auth_json',
    jsonContent: content,
    filename: filename
  }, (response) => {
    if (chrome.runtime.lastError) {
      showToast('❌ Download failed, please try again');
      return;
    }
    if (!response || !response.success) {
      showToast('❌ Download failed, please try again');
    }
  });
}

async function loadSavedAccounts() {
  console.log('loadSavedAccounts called');
  const accounts = await StorageManager.getSavedAccounts();
  console.log('Loaded accounts:', accounts);
  
  const section = document.getElementById('saved-accounts-section');
  const list = document.getElementById('saved-accounts-list');
  const countEl = document.getElementById('saved-count');

  if (!section || !list || !countEl) {
    console.error('Required DOM elements not found');
    return;
  }

  countEl.textContent = accounts.length;

  if (accounts.length === 0) {
    console.log('No accounts found, hiding section');
    section.classList.add('hidden');
    return;
  }

  console.log('Showing section with', accounts.length, 'accounts');
  section.classList.remove('hidden');

  list.innerHTML = accounts.map(acc => `
    <div class="saved-account-item" data-id="${acc.id}">
      <div class="saved-account-info">
        <div class="saved-account-email">${sanitizeText(acc.email)}</div>
        <div class="saved-account-meta">${sanitizeText(acc.planType.toUpperCase())} • ${new Date(acc.savedAt).toLocaleDateString()}</div>
      </div>
      <div class="saved-account-actions">
        <button class="btn-delete-account" data-id="${acc.id}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  console.log('Buttons created, attaching listeners...');
  attachAccountEventListeners(accounts);
  
  const switchButtons = document.querySelectorAll('.btn-switch-account');
  console.log('Switch buttons found:', switchButtons.length);
}

function attachAccountEventListeners(accounts) {
  document.querySelectorAll('.btn-delete-account').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const accountId = e.currentTarget.dataset.id;
      const account = accounts.find(acc => acc.id === accountId);
      
      console.log('Delete button clicked for:', account.email);
      
      if (!confirm(`Delete ${account.email}?`)) return;

      await StorageManager.deleteAccount(accountId);
      await loadSavedAccounts();
      showToast('✅ Account deleted');
    });
  });
}

/**
 * Real-time countdown for token expiration
 */
function startCountdown(expiresTime) {
  if (countdownInterval) clearInterval(countdownInterval);

  const countdownEl = document.getElementById('token-countdown');

  function update() {
    const now = new Date();
    const diff = expiresTime - now;

    if (diff <= 0) {
      countdownEl.textContent = 'Expired';
      countdownEl.className = 'detail-value text-danger';
      clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let displayStr = '';
    if (days > 0) displayStr += `${days}d `;
    if (hours > 0 || days > 0) displayStr += `${hours}h `;
    displayStr += `${minutes}m ${seconds}s`;

    countdownEl.textContent = displayStr;
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

/**
 * Format local date and time
 */
function formatLocalDate(date) {
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Core conversion logic: Transform ChatGPT Session data into Codex-compliant format
 * 
 * ⚠️ Known Limitation: refresh_token uses ChatGPT's sessionToken,
 * which is not a true OAuth2 refresh_token (a real refresh_token can only be obtained
 * through auth.openai.com verification flow, which requires phone verification - 
 * the obstacle this extension aims to bypass).
 * Codex may fail when attempting to refresh tokens, requiring re-export of auth.json.
 */
function generateCodexAuthJson(session) {
  const accountId = session.account?.id || '';
  const email = session.user?.email || '';
  const planType = session.account?.planType || 'free';
  const iat = Math.floor(Date.now() / 1000);
  const exp = session.expires ? Math.floor(new Date(session.expires).getTime() / 1000) : iat + (30 * 24 * 3600);

  const jwtHeader = { alg: 'none', typ: 'JWT', cpa_synthetic: true };
  const jwtPayload = {
    iat, exp,
    "https://api.openai.com/auth": {
      chatgpt_account_id: accountId,
      chatgpt_plan_type: planType,
      chatgpt_user_id: session.user?.id || '',
      user_id: session.user?.id || ''
    },
    email
  };

  const base64UrlEncode = (obj) => {
    const str = JSON.stringify(obj);
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const syntheticIdToken = `${base64UrlEncode(jwtHeader)}.${base64UrlEncode(jwtPayload)}.synthetic`;

  const authConfig = {
    auth_mode: "chatgpt",
    OPENAI_API_KEY: null,
    tokens: {
      id_token: syntheticIdToken,
      access_token: session.accessToken,
      refresh_token: session.sessionToken || "placeholder",
      account_id: accountId
    },
    last_refresh: new Date().toISOString()
  };

  return JSON.stringify(authConfig, null, 2);
}

function copyToClipboard(text, successMsg) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast(successMsg);
    })
    .catch(err => {
      showToast('❌ Copy failed, please select manually');
    });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  
  toastMsg.textContent = sanitizeText(message);
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function isValidImageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const allowedDomains = ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 's.gravatar.com'];
    return parsedUrl.protocol === 'https:' && allowedDomains.some(domain => parsedUrl.hostname === domain);
  } catch {
    return false;
  }
}
