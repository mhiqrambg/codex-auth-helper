# 🔐 Security Policy

## Security Improvements (v1.2.0)

### Critical Fixes Implemented

#### 1. Message Sender Validation
- ✅ Validates `sender.id` matches extension ID
- ✅ Validates `sender.url` originates from extension pages
- ✅ Prevents message interception by malicious extensions

#### 2. Secure Session Storage
- ✅ Implements closure-based `SessionManager` 
- ✅ Prevents global scope access to tokens
- ✅ Auto-clears session on window unload

#### 3. Enhanced Download Security
- ✅ Changed `saveAs: true` - forces user to choose location
- ✅ Added `conflictAction: 'uniquify'` - prevents overwrite attacks
- ✅ Added security warning dialog before download
- ✅ Auto-clears session 3 seconds after download

#### 4. Input Sanitization
- ✅ Validates image URLs against whitelist
- ✅ Sanitizes all user-facing text with `textContent`
- ✅ Implements `sanitizeText()` helper function

#### 5. Content Security Policy (CSP)
- ✅ Restricts script execution to extension only
- ✅ Whitelist approved image domains
- ✅ Blocks inline scripts and eval()
- ✅ Restricts network connections

#### 6. Permission Scope Reduction
- ✅ Changed from `https://chatgpt.com/*` to specific endpoint
- ✅ Minimal permission principle applied

#### 7. Error Handling
- ✅ Removed `console.error()` with sensitive data
- ✅ Generic error messages to users
- ✅ No stack trace exposure

#### 8. Memory Management
- ✅ Timer cleanup on window unload
- ✅ Prevents memory leaks from intervals
- ✅ Session cleared after use

## Remaining Limitations

### Known Issues (Require Architecture Changes)

#### 1. JWT Signature (CRITICAL)
**Status:** Not Fixed - Requires Backend Changes

The extension still generates unsigned JWT tokens (`alg: 'none'`). This is by design as:
- True OAuth2 refresh tokens require phone verification
- Codex backend needs to accept synthetic tokens
- Proper signing requires shared secret management

**Recommendation:** Implement proper JWT signing in future versions when backend supports it.

#### 2. Token Refresh Mechanism (MEDIUM)
**Status:** Not Fixed - Requires API Access

The `refresh_token` uses ChatGPT's `sessionToken` which may not work for actual token refresh.

**Workaround:** Users must re-export auth.json when tokens expire.

## Security Best Practices for Users

### ✅ DO:
- Store `auth.json` in secure, encrypted directories
- Use `~/.codex/` directory with restricted permissions (chmod 600)
- Delete downloaded file after moving to Codex directory
- Re-export regularly when tokens approach expiry
- Keep extension updated

### ❌ DON'T:
- Share `auth.json` with anyone
- Upload to cloud storage (Dropbox, Google Drive, etc.)
- Commit to version control (Git)
- Store in Downloads folder permanently
- Use on shared computers without cleanup

## Reporting Security Issues

If you discover a security vulnerability, please email: **security@example.com**

**DO NOT** create public GitHub issues for security vulnerabilities.

### Expected Response Time:
- Critical vulnerabilities: 24-48 hours
- High severity: 3-5 days
- Medium/Low: 1-2 weeks

## Security Audit History

| Date | Version | Auditor | Findings | Status |
|------|---------|---------|----------|--------|
| 2026-07-31 | v1.2.0 | Internal | 12 issues (2 Critical, 4 High, 4 Medium, 2 Low) | ✅ 10 Fixed, 2 Documented |
| 2026-07-01 | v1.1.0 | Initial | N/A | Baseline |

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x: (Vulnerable)   |
| < 1.1   | :x:                |

## License

This security policy is part of the Codex Auth Helper project, licensed under MIT.
