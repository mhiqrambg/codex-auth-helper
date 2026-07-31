#!/bin/bash

# Security Verification Script for Codex Auth Helper
# Run this before deploying or publishing the extension

echo "🔍 Running Security Checks..."
echo ""

EXTENSION_DIR="extension"
ERRORS=0
WARNINGS=0

# Check 1: Verify no console.log/error in production code
echo "✓ Checking for console statements..."
if grep -r "console\." "$EXTENSION_DIR" --include="*.js" | grep -v "//.*console\." | grep -q .; then
    echo "  ❌ FAIL: Found console statements in code"
    grep -rn "console\." "$EXTENSION_DIR" --include="*.js" | grep -v "//.*console\."
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASS: No console statements found"
fi
echo ""

# Check 2: Verify CSP is present in manifest
echo "✓ Checking Content Security Policy..."
if grep -q "content_security_policy" "$EXTENSION_DIR/manifest.json"; then
    echo "  ✅ PASS: CSP found in manifest.json"
else
    echo "  ❌ FAIL: Missing CSP in manifest.json"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Verify sender validation in background.js
echo "✓ Checking message sender validation..."
if grep -q "sender.id" "$EXTENSION_DIR/background.js" && grep -q "sender.url" "$EXTENSION_DIR/background.js"; then
    echo "  ✅ PASS: Sender validation implemented"
else
    echo "  ❌ FAIL: Missing sender validation"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 4: Verify saveAs is true
echo "✓ Checking download security..."
if grep -q "saveAs: true" "$EXTENSION_DIR/background.js"; then
    echo "  ✅ PASS: saveAs set to true"
else
    echo "  ❌ FAIL: saveAs should be true for security"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 5: Verify no global session variable
echo "✓ Checking for secure session storage..."
if grep -q "let globalSession" "$EXTENSION_DIR/popup/popup.js"; then
    echo "  ❌ FAIL: Found insecure global session variable"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASS: No global session variable found"
fi
echo ""

# Check 6: Verify SessionManager exists
echo "✓ Checking SessionManager implementation..."
if grep -q "SessionManager" "$EXTENSION_DIR/popup/popup.js"; then
    echo "  ✅ PASS: SessionManager found"
else
    echo "  ❌ FAIL: SessionManager not implemented"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 7: Check for inline scripts in HTML
echo "✓ Checking for inline scripts..."
if grep -q "<script>" "$EXTENSION_DIR/popup/popup.html" | grep -v "popup.js"; then
    echo "  ⚠️  WARN: Possible inline script found"
    WARNINGS=$((WARNINGS + 1))
else
    echo "  ✅ PASS: No inline scripts"
fi
echo ""

# Check 8: Verify sanitization functions
echo "✓ Checking input sanitization..."
if grep -q "sanitizeText" "$EXTENSION_DIR/popup/popup.js"; then
    echo "  ✅ PASS: sanitizeText function found"
else
    echo "  ⚠️  WARN: No sanitization function found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 9: Verify URL validation
echo "✓ Checking URL validation..."
if grep -q "isValidImageUrl" "$EXTENSION_DIR/popup/popup.js"; then
    echo "  ✅ PASS: URL validation implemented"
else
    echo "  ⚠️  WARN: No URL validation found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 10: Verify cleanup handlers
echo "✓ Checking cleanup handlers..."
if grep -q "beforeunload" "$EXTENSION_DIR/popup/popup.js"; then
    echo "  ✅ PASS: Cleanup handler found"
else
    echo "  ⚠️  WARN: No cleanup handler found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 11: Verify restricted permissions
echo "✓ Checking permission scope..."
if grep -q "https://chatgpt.com/api/auth/session" "$EXTENSION_DIR/manifest.json"; then
    echo "  ✅ PASS: Minimal permission scope"
else
    echo "  ⚠️  WARN: Permission scope may be too broad"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 12: Verify security warning dialog
echo "✓ Checking security warning dialog..."
if grep -q "Security Warning" "$EXTENSION_DIR/popup/popup.js" || grep -q "安全提醒" "$EXTENSION_DIR/popup/popup.js" || grep -q "confirm.*sensitive" "$EXTENSION_DIR/popup/popup.js"; then
    echo "  ✅ PASS: Security warning found"
else
    echo "  ⚠️  WARN: No security warning dialog"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "================================"
echo "📊 Security Audit Summary"
echo "================================"
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED - Ready for deployment"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  WARNINGS FOUND - Review recommended before deployment"
    exit 0
else
    echo "❌ CRITICAL ISSUES FOUND - Do NOT deploy until fixed"
    exit 1
fi
