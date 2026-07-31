# 🔐 Codex Auth Helper

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](./extension/manifest.json)
[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Security](https://img.shields.io/badge/Security-Hardened-green.svg)](SECURITY.md)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Audit](https://img.shields.io/badge/Security_Audit-Passed-success.svg)](SECURITY_AUDIT_REPORT.md)

**Codex Auth Helper** is a secure, lightweight, and beautifully designed Chrome extension for Codex developers to manage credentials and create local configuration backups.

Through a highly secure local sandbox mechanism, this extension helps you export your ChatGPT login session credentials quickly and safely, automatically converting them into Codex-compliant `auth.json` configuration files.

---

## 🌟 Core Features

- 📡 **Smart Local Status Detection**: Instantly detects and syncs your browser's ChatGPT authorization status, displaying avatar, email, and subscription plan (Free / Plus / Pro)
- ⏱️ **Real-time Expiry Countdown**: Precisely reads token expiration time with second-level countdown display
- ⚙️ **Automated Format Synthesis**: Implements JWT emulation to generate Codex-required **Synthetic signed id_token** for seamless authentication
- 🔒 **100% Pure Local Offline Processing**:
  - Core logic based on closed-loop browser sandbox processing, configurations triggered via `data:` URL downloads with no temporary Blob memory vulnerabilities
  - **Never passes through any third-party servers** (zero upload endpoints, no cloud storage), completely eliminating privacy concerns
- 🎨 **Exquisite Design**: Carefully crafted Glassmorphism UI with smooth hover transitions, dynamic Toast feedback, and multiple theme color options
- 🛡️ **Enterprise-Grade Security** (v1.2.0):
  - Message sender validation prevents cross-extension attacks
  - Closure-isolated SessionManager prevents memory leaks
  - Content Security Policy (CSP) defends against XSS
  - URL whitelist validation prevents malicious loading
  - User-confirmed download location prevents file hijacking
  - Automatic sensitive data cleanup

---

## ⚠️ Important Security Update

> **v1.2.0 contains critical security fixes!**  
> If you are using v1.1.0 or earlier, please upgrade immediately to fix 12 known security vulnerabilities (including 2 critical).
> 
> See: [Security Audit Report](SECURITY_AUDIT_REPORT.md) | [Changelog](CHANGELOG.md)

---

## 🚀 Quick Start

### 1. Developer Mode Installation (Local Loading)

1. Download or clone this repository to your local computer
2. Open Chrome browser and enter `chrome://extensions/` in the address bar
3. Enable **"Developer mode"** toggle in the top right corner
4. Click **"Load unpacked"** in the top left corner
5. Select the `extension` folder from this repository (containing `manifest.json`)
6. After installation, find **Codex Auth Helper** in the browser toolbar's puzzle icon and pin it

### 2. Export `auth.json`

1. Ensure you are logged into [ChatGPT](https://chatgpt.com/) in your current browser
2. Click the extension icon in the top right corner to open the **Codex Auth Helper** popup
3. The extension will automatically read your logged-in session. If not logged in, click **Go to ChatGPT Login**
4. After successful status recognition, click the **Export Credentials** button
5. **Read the security warning dialog** and confirm you understand the file's sensitivity
6. Choose a secure save location (recommended: save directly to `~/.codex/` directory)
7. After download completes, the extension will automatically clear sensitive data from memory

### 3. Configure Codex

Move the downloaded `auth.json` file to your Codex configuration directory:

**macOS/Linux:**
```bash
mv ~/Downloads/auth.json ~/.codex/auth.json
chmod 600 ~/.codex/auth.json  # Set strict permissions
```

**Windows:**
```powershell
move %USERPROFILE%\Downloads\auth.json %USERPROFILE%\.codex\auth.json
```

---

## 🔒 Security & Privacy Commitment

> [!IMPORTANT]
> Your identity credentials and session data are extremely sensitive user privacy information that **must never be leaked or uploaded to any server**!

### v1.2.0 Security Enhancements

- ✅ **Message Sender Validation**: Prevents malicious extensions from intercepting communications
- ✅ **Closure Isolation Storage**: SessionManager prevents memory access attacks
- ✅ **Content Security Policy**: Blocks XSS and code injection
- ✅ **URL Whitelist Validation**: Only allows trusted domain image loading
- ✅ **User-Confirmed Downloads**: Manual save location selection prevents file hijacking
- ✅ **Input Data Sanitization**: All user input goes through sanitization
- ✅ **Automatic Memory Cleanup**: Clears sensitive data on window close
- ✅ **Principle of Least Privilege**: Only requests necessary API endpoint permissions
- ✅ **No Log Leakage**: Removed all console output that could leak sensitive information

### Core Security Commitments

- **Zero Sensitive Data Collection**: This extension never collects, uploads, or forwards any personal privacy or credentials
- **Minimized Permission Declaration**: Only declares `downloads` (save files) and `https://chatgpt.com/api/auth/session` (secure session reading), eliminating unnecessary dangerous behaviors
- **Complete Code Isolation**: You can inspect `background.js` and `popup.js` anytime through browser developer tools (F12). No uncontrolled external CDN third-party libraries are introduced; all static resources are bundled locally
- **Security Audit Passed**: Underwent complete security audit with all known critical and high-risk vulnerabilities fixed

### Security Best Practices

**✅ Recommended:**
- Store `auth.json` in encrypted directories
- Use `chmod 600` to set file permissions (owner read/write only)
- Regularly update extension to latest version
- Re-export before token expiration
- Delete file from downloads directory after use

**❌ Avoid:**
- Do not share `auth.json` with anyone
- Do not upload to cloud storage (Dropbox, Google Drive, etc.)
- Do not commit to Git repositories
- Do not use on public computers
- Do not store long-term in Downloads directory

For detailed security information, see:
- [Security Policy (SECURITY.md)](SECURITY.md)
- [Security Audit Report (SECURITY_AUDIT_REPORT.md)](SECURITY_AUDIT_REPORT.md)
- [Changelog (CHANGELOG.md)](CHANGELOG.md)

---

## 🛠️ Developer Guide

### Run Security Checks

Before deployment or release, run the security validation script:

```bash
bash security-check.sh
```

All checks must pass before deploying to production.

### Project Structure

```
codex-auth-helper/
├── extension/                     # Chrome extension core files
│   ├── background.js             # Service Worker (with security validation)
│   ├── manifest.json             # Extension config (with CSP)
│   ├── popup/
│   │   ├── popup.html            # UI interface
│   │   ├── popup.js              # Core logic (with SessionManager)
│   │   └── popup.css             # Styles
│   └── icons/                    # Icon resources
├── landing-page/                 # Landing page
├── SECURITY.md                   # Security policy
├── SECURITY_AUDIT_REPORT.md      # Audit report
├── SECURITY_FIXES.md             # Quick fixes reference
├── CHANGELOG.md                  # Changelog
├── security-check.sh             # Security validation script
└── README.md                     # This file
```

---

## 📊 Version History

### v1.2.0 (2026-07-31) - Security Hardening

**Security Fixes:**
- [CRITICAL] Fixed message sender validation vulnerability
- [CRITICAL] Implemented secure session storage pattern
- [HIGH] Added Content Security Policy
- [HIGH] Implemented URL validation with whitelist
- [HIGH] Added input sanitization
- [HIGH] Removed sensitive error logging
- [MEDIUM] Forced user download confirmation
- [MEDIUM] Added security warning dialog
- [MEDIUM] Restricted host permissions
- [MEDIUM] Fixed memory leaks
- [LOW] Removed version disclosure

**Improvements:**
- Full English internationalization
- Comprehensive security documentation
- Automated security validation script
- Risk level reduced from HIGH to LOW (67% improvement)

See [CHANGELOG.md](CHANGELOG.md) for complete history.

---

## 📈 Security Metrics

| Metric | Before (v1.1.0) | After (v1.2.0) | Improvement |
|--------|-----------------|----------------|-------------|
| Risk Level | HIGH (7.5/10) | LOW (2.5/10) | ⬇️ 67% |
| Security Score | 2.5/10 | 8.5/10 | ⬆️ 240% |
| Critical Vulns | 2 | 0 | ✅ -100% |
| High Vulns | 4 | 0 | ✅ -100% |
| Medium Vulns | 4 | 0 | ✅ -100% |
| Low Vulns | 2 | 0 | ✅ -100% |

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All security checks pass (`bash security-check.sh`)
- Code follows existing style conventions
- Sensitive data is never logged or exposed
- Documentation is updated accordingly

---

## 🐛 Bug Reports & Security Issues

- **Security Vulnerabilities**: Please email security@example.com (do not create public issues)
- **Bug Reports**: Create an issue on GitHub
- **Feature Requests**: Create an issue on GitHub

---

## 📜 License

This project is open-sourced under the [MIT License](LICENSE). Free modification and redistribution are allowed for any individual or team, but please retain original author attribution and open-source license declaration.

---

## 🙏 Acknowledgments

- Chrome Extension Manifest V3 documentation
- Security best practices from OWASP
- Community feedback and contributions

---

**Made with ❤️ for Codex developers**

**Version:** 1.2.0 | **Status:** ✅ Production Ready | **Security:** ⭐⭐⭐⭐⭐
