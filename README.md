# 🔐 Codex 认证助手 (Codex Auth Helper)

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](./extension/manifest.json)
[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Security](https://img.shields.io/badge/Security-Hardened-green.svg)](SECURITY.md)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Audit](https://img.shields.io/badge/Security_Audit-Passed-success.svg)](SECURITY_AUDIT_REPORT.md)

**Codex 认证助手** 是一款专为 Codex 开发者设计的安全、轻量、高颜值的凭证管理与本地配置备份辅助 Chrome 扩展程序。

通过高度安全的本地沙盒机制，本插件能够帮助您一键将 ChatGPT 登录会话凭证快速安全地导出，并自动转换为符合 Codex 运行规范的 `auth.json` 配置文件。

---

## 🌟 核心特性

- 📡 **智能本地状态检测**：秒级检测并自动对齐当前浏览器的 ChatGPT 授权状态，直观展现头像、邮箱及订阅计划（Free / Plus / Pro）。
- ⏱️ **实时有效期倒计时**：精确读取 Token 失效时间，并在 Popup 界面上提供秒级的生存期实时倒计时。
- ⚙️ **自动化格式合成**：完美实现 JWT 仿真构造，自动生成 Codex 规范所需的 **Synthetic 签名 id_token**，实现无缝鉴权。
- 🔒 **100% 纯本地离线处理**：
  - 核心逻辑基于闭环的浏览器沙盒处理，生成的配置直接以 `data:` URL 触发下载，不留任何临时 Blob 内存漏洞。
  - **绝不经过任何第三方服务器**（零上传接口，数据不上云），完全打消您的隐私顾虑。
- 🎨 **极致美学设计**：精心打磨的毛玻璃拟物化 (Glassmorphism) UI，支持细腻的悬浮过渡、动感 Toast 反馈以及多套主题配色的极速落地页。
- 🛡️ **企业级安全防护** (v1.2.0 新增)：
  - Message sender 验证防止跨扩展攻击
  - 闭包隔离的 SessionManager 防止内存泄露
  - Content Security Policy (CSP) 防御 XSS
  - URL 白名单验证防止恶意加载
  - 用户确认下载位置防止文件劫持
  - 自动清理敏感数据

---

## ⚠️ 重要安全更新

> **v1.2.0 包含关键安全修复！**  
> 如果您正在使用 v1.1.0 或更早版本，请立即升级以修复 12 个已知安全漏洞（包括 2 个严重级别）。
> 
> 详见：[安全审计报告](SECURITY_AUDIT_REPORT.md) | [变更日志](CHANGELOG.md)

---

## 🚀 极速上手

### 1. 开发者模式安装 (本地加载)
1. 下载或克隆本仓库到您的本地电脑。
2. 打开 Chrome 浏览器，在地址栏输入 `chrome://extensions/` 并回车。
3. 在右上角开启 **"开发者模式" (Developer mode)** 开关。
4. 点击左上角的 **"加载已解压的扩展程序" (Load unpacked)**。
5. 选择本仓库中的 `extension` 文件夹（即包含 `manifest.json` 的目录）。
6. 安装完成后，在浏览器工具栏的“拼图”图标中找到 **Codex 认证助手** 并将其固定。

### 2. 导出 `auth.json`
1. 确保您在当前浏览器中已经登录了 [ChatGPT 官网](https://chatgpt.com/)。
2. 点击浏览器右上角的插件图标，打开 **Codex 认证助手** 弹窗。
3. 插件会自动读取已登录的会话。如果未登录，可点击 **一键前往登录**。
4. 状态识别成功后，点击 **导出身份信息** 按钮。
5. **阅读安全警告对话框**，确认理解文件的敏感性。
6. 选择安全的保存位置（建议直接保存到 `~/.codex/` 目录）。
7. 下载完成后，插件会自动清理内存中的敏感数据。

### 3. 配置 Codex
将下载的 `auth.json` 文件移动到 Codex 配置目录：

**macOS/Linux:**
```bash
mv ~/Downloads/auth.json ~/.codex/auth.json
chmod 600 ~/.codex/auth.json  # 设置严格权限
```

**Windows:**
```powershell
move %USERPROFILE%\Downloads\auth.json %USERPROFILE%\.codex\auth.json
```

---

## 🔒 安全与隐私承诺

> [!IMPORTANT]
> 您的身份凭证与 Session 属于极度敏感的用户隐私，**绝对不能泄露或上传到任何服务器**！

### v1.2.0 安全增强功能

- ✅ **Message Sender 验证**：防止恶意扩展拦截通信
- ✅ **闭包隔离存储**：SessionManager 防止内存访问攻击
- ✅ **Content Security Policy**：阻止 XSS 和代码注入
- ✅ **URL 白名单验证**：仅允许可信域名的图片加载
- ✅ **用户确认下载**：手动选择保存位置，防止文件劫持
- ✅ **输入数据清理**：所有用户输入经过 sanitization
- ✅ **自动内存清理**：窗口关闭时清除敏感数据
- ✅ **最小权限原则**：仅请求必需的 API endpoint 权限
- ✅ **无日志泄露**：移除所有可能泄露敏感信息的 console 输出

### 核心安全承诺

- **零敏感数据收集**：本插件绝不收集、上传或转发任何个人隐私及凭证。
- **最小化权限声明**：仅声明 `downloads`（保存文件）与 `https://chatgpt.com/api/auth/session`（安全读取会话），杜绝冗余危险行为。
- **彻底的代码闭环**：您可以随时通过浏览器开发者工具 (F12) 检查 `background.js` 和 `popup.js`。没有引入任何外部不可控 CDN 第三方库，所有静态资源均本地打包。
- **通过安全审计**：经过完整的安全审计，修复了所有已知的严重和高危漏洞。

### 安全最佳实践

**✅ 推荐做法：**
- 将 `auth.json` 存储在加密目录
- 使用 `chmod 600` 设置文件权限（仅所有者可读写）
- 定期更新扩展到最新版本
- Token 过期前重新导出
- 使用完毕后从下载目录删除文件

**❌ 避免做法：**
- 不要分享 `auth.json` 给任何人
- 不要上传到云存储（Dropbox, Google Drive 等）
- 不要提交到 Git 仓库
- 不要在公共计算机上使用
- 不要长期保存在 Downloads 目录

详细安全信息请查阅：
- [安全政策 (SECURITY.md)](SECURITY.md)
- [安全审计报告 (SECURITY_AUDIT_REPORT.md)](SECURITY_AUDIT_REPORT.md)
- [变更日志 (CHANGELOG.md)](CHANGELOG.md)

---

## 🛠️ 开发者指南

### 运行安全检查

在部署或发布前，运行安全验证脚本：

```bash
bash security-check.sh
```

所有检查必须通过才能部署到生产环境。

### 项目结构

```
codex-auth-helper/
├── extension/              # Chrome 扩展核心文件
│   ├── background.js      # Service Worker (含安全验证)
│   ├── manifest.json      # 扩展配置 (含 CSP)
│   ├── popup/
│   │   ├── popup.html     # UI 界面
│   │   ├── popup.js       # 核心逻辑 (含 SessionManager)
│   │   └── popup.css      # 样式
│   └── icons/             # 图标资源
├── landing-page/          # 宣传页面
├── SECURITY.md            # 安全政策
├── SECURITY_AUDIT_REPORT.md  # 审计报告
├── CHANGELOG.md           # 变更日志
├── security-check.sh      # 安全验证脚本
└── README.md              # 本文件
```

---

## 📜 许可证

本项目基于 [MIT License](LICENSE) 开源，允许任何个人或团队进行自由修改与二次分发，但请务必保留原作者署名及开源协议声明。
