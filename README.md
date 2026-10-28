# Tray 中文版 · obsidian-tray-zh

把 Obsidian 常驻到系统托盘：关闭窗口不退出、全局快捷键唤起、托盘右键菜单、全局快速笔记。
本仓库是 [dragonwocky/obsidian-tray](https://github.com/dragonwocky/obsidian-tray) **v0.3.5** 的中文分支，界面已全部汉化，并修了两个 Windows 上托盘失效的问题。

## 与上游的差异

| # | 改动 | 说明 |
|---|---|---|
| 1 | **界面全中文** | 设置项标题、描述、托盘右键菜单、插件简介全部中文化 |
| 2 | **修复：最小化后唤不回** | 上游 `showWindows()` 缺 `win.restore()`。最小化的窗口 `isVisible()` 返回 `false`，而 `show()` 不会还原最小化状态，所以点托盘毫无反应 |
| 3 | **修复：托盘左键点了没反应** | Windows 上调用 `setContextMenu()` 会抑制托盘 `click` 事件。改为不设默认菜单，右键手动弹出，左键固定「调出并前置」 |
| 4 | 移除调试日志 | 发布版不含任何日志写入 |

## 安装

### 方式一：BRAT（推荐，可自动更新）

1. 安装并启用 **BRAT** 插件
2. 命令面板 → `BRAT: Add a beta plugin for testing`
3. 填入仓库地址：`sxiansheng1990/obsidian-tray-zh`
4. 启用插件 **Tray 中文版**

### 方式二：手动

1. 下载本仓库的 `main.js` 和 `manifest.json`
2. 放进 `你的仓库/.obsidian/plugins/tray-zh/`
3. 设置 → 第三方插件 → 刷新 → 启用「Tray 中文版」

## 使用

- **关闭窗口不退出**：设置里打开 **后台运行**（默认已开）
- **全局唤起**：默认 `Ctrl + Shift + Tab`，任何软件里都能把 Obsidian 叫出来/藏回去
- **快速笔记**：默认 `Ctrl + Shift + Q`
- **右键托盘图标**：快速笔记 / 显示仓库 / 隐藏仓库 / 重启 Obsidian / 关闭仓库

## 注意

- 插件 id 是 `tray-zh`，可以和官方 `Tray` 共存，但**不要同时启用**，两者会抢同一个全局快捷键
- 本分支跟随上游 v0.3.5，上游后续更新不会自动合并进来
- 本插件只做了中文界面，没有做多语言切换；英文用户请用[原版](https://github.com/dragonwocky/obsidian-tray)

## 协议

MIT License，原作者 [dragonwocky](https://github.com/dragonwocky)。本分支的修改同样以 MIT 发布，详见 [LICENSE](LICENSE)。

---

**English**: A Chinese-localised fork of [Tray](https://github.com/dragonwocky/obsidian-tray) v0.3.5. UI strings are Chinese only. Includes two Windows fixes: restoring minimised windows on tray click, and a workaround for `setContextMenu()` swallowing tray `click` events. MIT licensed, original author dragonwocky.
