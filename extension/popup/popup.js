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

let countdownInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initSessionFetch();
  bindEvents();
  
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

  document.getElementById('btn-download').addEventListener('click', () => {
    if (!SessionManager.hasSession()) return;
    
    if (!confirm('⚠️ Security Warning\n\nThis file contains sensitive authentication tokens. Please ensure:\n\n1. Save to a secure location\n2. Do not share with others\n3. Do not upload to cloud storage\n\nConfirm export?')) {
      return;
    }
    
    const session = SessionManager.get();
    const authJsonString = generateCodexAuthJson(session);
    
    chrome.runtime.sendMessage({
      action: 'download_auth_json',
      jsonContent: authJsonString
    }, (response) => {
      if (chrome.runtime.lastError) {
        showToast('❌ Download failed, please try again');
        return;
      }
      if (response && response.success) {
        showToast('🎉 auth.json download started');
        setTimeout(() => {
          SessionManager.clear();
        }, 3000);
      } else {
        showToast('❌ Download failed, please try again');
      }
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
