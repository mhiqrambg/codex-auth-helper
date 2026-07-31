# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-07-31

### 🔒 Security Fixes (CRITICAL UPDATE)

#### Fixed Vulnerabilities
- **[CRITICAL]** Added message sender validation to prevent interception attacks
- **[CRITICAL]** Implemented secure session storage using closure pattern
- **[HIGH]** Added Content Security Policy (CSP) to manifest
- **[HIGH]** Implemented URL validation for user avatars with domain whitelist
- **[HIGH]** Removed console.error() calls that exposed sensitive data
- **[HIGH]** Added input sanitization for all user-facing text
- **[MEDIUM]** Changed download behavior to `saveAs: true` (user chooses location)
- **[MEDIUM]** Added security warning dialog before file download
- **[MEDIUM]** Reduced permission scope from wildcard to specific API endpoint
- **[MEDIUM]** Fixed memory leak in countdown timer with proper cleanup
- **[LOW]** Updated version display to reduce information disclosure

#### Added
- `SessionManager` - Secure closure-based session storage
- `sanitizeText()` - Input sanitization helper function
- `isValidImageUrl()` - URL validation with whitelist
- Security warning dialog before downloading auth.json
- Auto-cleanup on window unload event
- Session auto-clear 3 seconds after successful download
- `SECURITY.md` - Comprehensive security documentation

#### Changed
- **Breaking:** Downloads now prompt user for save location (was auto-download)
- **Breaking:** Host permissions restricted to `/api/auth/session` endpoint only
- Error messages now generic (no sensitive data exposure)
- Version bumped from 1.1.0 to 1.2.0
- Replaced global `globalSession` variable with `SessionManager`

#### Security Improvements
```diff
manifest.json:
+ "version": "1.2.0"
+ "host_permissions": ["https://chatgpt.com/api/auth/session"]
- "host_permissions": ["https://chatgpt.com/"]
+ "content_security_policy": { ... }

background.js:
+ Sender validation (sender.id + sender.url checks)
+ saveAs: true (user confirmation required)
+ conflictAction: 'uniquify'
- console.error() with sensitive data

popup.js:
+ SessionManager closure pattern
+ sanitizeText() for XSS prevention
+ isValidImageUrl() with domain whitelist
+ beforeunload cleanup handler
+ Security warning dialog
- Global session variable
- Unguarded console.error()
```

#### Known Limitations (Not Fixed)
- **[CRITICAL]** JWT tokens still use `alg: 'none'` (requires backend changes)
- **[MEDIUM]** Token refresh mechanism uses sessionToken (may fail on refresh)

See `SECURITY.md` for detailed security information.

---

## [1.1.0] - 2026-06-15

### Added
- Initial public release
- ChatGPT session extraction
- Codex auth.json generation
- Real-time token countdown
- Glassmorphism UI design
- Landing page with documentation

### Features
- Automatic session detection
- One-click auth.json export
- Token expiry countdown
- Support for Free/Plus/Pro accounts
- Pure local processing (no cloud upload)

---

## Security Notice

**⚠️ Users on v1.1.0 or earlier MUST upgrade to v1.2.0 immediately due to critical security vulnerabilities.**

### Vulnerability Summary (v1.1.0):
- Message interception possible by malicious extensions
- Token exposure through global variables
- Auto-download vulnerable to malware monitoring
- Missing CSP headers
- Excessive host permissions

All critical and high-severity issues have been addressed in v1.2.0.

---

## Migration Guide: v1.1.0 → v1.2.0

### For Users:
1. Update the extension to v1.2.0
2. When downloading auth.json, you will now be prompted to choose save location (security improvement)
3. Read the security warning dialog carefully
4. Store auth.json in a secure location with restricted permissions

### For Developers:
```bash
# Update to latest version
git pull origin main

# Reload extension in chrome://extensions/
# Test message passing validation
# Verify CSP restrictions
# Confirm download prompts for location
```

### Breaking Changes:
- Downloads now require user interaction (saveAs dialog)
- Extensions attempting to intercept messages will be blocked
- External scripts/images outside whitelist will be blocked by CSP

---

## [1.0.0] - 2026-05-01 (Internal)
- Initial development version
- Basic functionality prototype
