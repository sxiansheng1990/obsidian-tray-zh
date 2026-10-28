/**
 * obsidian-tray v0.3.5 - 中文版 / Chinese localisation
 * Original: (c) 2023 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 *           https://github.com/dragonwocky/obsidian-tray/ - MIT license
 * Changes:  Chinese UI strings; restore() for minimised windows; manual tray
 *           context menu on Windows so the "click" event is not swallowed.
 */
"use strict";
const LOG_PREFIX = "obsidian-tray",
  LOG_LOADING = "loading",
  LOG_CLEANUP = "cleaning up",
  LOG_SHOWING_WINDOWS = "showing windows",
  LOG_HIDING_WINDOWS = "hiding windows",
  LOG_WINDOW_CLOSE = "intercepting window close",
  LOG_TRAY_ICON = "creating tray icon",
  LOG_REGISTER_HOTKEY = "registering hotkey",
  LOG_UNREGISTER_HOTKEY = "unregistering hotkey",
  ACTION_QUICK_NOTE = "快速笔记",
  ACTION_SHOW = "显示仓库",
  ACTION_HIDE = "隐藏仓库",
  ACTION_RELAUNCH = "重启 Obsidian",
  ACTION_CLOSE = "关闭仓库",
  DEFAULT_DATE_FORMAT = "YYYY-MM-DD",
  ACCELERATOR_FORMAT = `此快捷键为全局注册，即使 Obsidian 没有焦点也能响应。格式：
    <a href="https://www.electronjs.org/docs/latest/tutorial/keyboard-shortcuts#accelerators" target="_blank" rel="noopener">
    Electron 快捷键</a>
  `,
  MOMENT_FORMAT = `格式：
    <a href="https://momentjs.com/docs/#/displaying/format/" target="_blank" rel="noopener">
    Moment.js 格式字符串</a>
  `,
  OBSIDIAN_BASE64_ICON = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHZSURBVDhPlZKxTxRBFMa/XZcF7nIG7mjxjoRCwomJxgsFdhaASqzQxFDzB1AQKgstLGxIiBQGJBpiCCGx8h+wgYaGgAWNd0dyHofeEYVwt/PmOTMZV9aDIL/s5pvZvPfN9yaL/+HR3eXcypta0m4juFbP5GHuXc9IbunDFc9db/G81/ZzhDMN7g8td47mll4R5BfHwZN4LOaA+fHa259PbUmIYzWkt3e2NZNo3/V9v1vvU6kkstk+tLW3ItUVr/m+c3N8MlkwxYqmBFcbwUQQCNOcyVzDwEAWjuPi5DhAMV/tKOYPX5hCyz8Gz1zX5SmWjBvZfmTSaRBJkGAIoxJHv+pVW2yIGNxOJ8bUVNcFEWLxuG1ia6JercTbttwQTeDwPS0kCMXiXtgk/jQrFUw7ptYSMWApF40yo/ytjHq98fdk3ayVE+cn2CxMb6ruz9qAJKFUKoWza1VJSi/n0+ffgYHdWW2gHuxXymg0gjCB0sjpmiaDnkL3RzDyzLqBUKns2ztQqUR0fk2TwSrGSf1eczqF5vsPZRCQSSAFLk6gqctgQRkc6TWRQLV2YMYQki9OoNkqzFQ9r+WOGuW5CrJbOzyAlPKr6MSGLbkcDwbf35oY/jRkt6cAfgNwowruAMz9AgAAAABJRU5ErkJggg==`,
  log = (message) => console.log(`${LOG_PREFIX}: ${message}`);
let tray, plugin;
const obsidian = require("obsidian"),
  { app, Tray, Menu } = require("electron").remote,
  { nativeImage, BrowserWindow } = require("electron").remote,
  { getCurrentWindow, globalShortcut } = require("electron").remote;
const vaultWindows = new Set(),
  maximizedWindows = new Set(),
  getWindows = () => [...vaultWindows],
  observeWindows = () => {
    const onWindowCreation = (win) => {
      vaultWindows.add(win);
      win.setSkipTaskbar(plugin.settings.hideTaskbarIcon);
      win.on("close", () => {
        if (win !== getCurrentWindow()) vaultWindows.delete(win);
      });
      if (win.isMaximized()) maximizedWindows.add(win);
      win.on("maximize", () => maximizedWindows.add(win));
      win.on("unmaximize", () => maximizedWindows.delete(win));
    };
    onWindowCreation(getCurrentWindow());
    getCurrentWindow().webContents.on("did-create-window", onWindowCreation);
    if (process.platform === "darwin") {
      getCurrentWindow().on("focus", () => {
        if (plugin.settings.hideTaskbarIcon) hideTaskbarIcons();
      });
    }
  },
  showWindows = () => {
    log(LOG_SHOWING_WINDOWS);
    getWindows().forEach((win) => {
      if (win.isMinimized()) win.restore();
      if (maximizedWindows.has(win)) win.maximize();
      win.show();
      win.focus();
    });
  },
  hideWindows = () => {
    log(LOG_HIDING_WINDOWS);
    getWindows().forEach((win) => [
      win.isFocused() && win.blur(),
      plugin.settings.runInBackground ? win.hide() : win.minimize(),
    ]);
  },
  toggleWindows = (checkForFocus = true) => {
    const openWindows = getWindows().some((win) => {
      return (!checkForFocus || win.isFocused()) && win.isVisible();
    });
    if (openWindows) hideWindows();
    else showWindows();
  };
const onWindowClose = (event) => event.preventDefault(),
  onWindowUnload = (event) => {
    log(LOG_WINDOW_CLOSE);
    getCurrentWindow().hide();
    event.stopImmediatePropagation();
    event.returnValue = false;
  },
  interceptWindowClose = () => {
    window.addEventListener("beforeunload", onWindowUnload, true);
    getCurrentWindow().on("close", onWindowClose);
  },
  allowWindowClose = () => {
    getCurrentWindow().removeListener("close", onWindowClose);
    window.removeEventListener("beforeunload", onWindowUnload, true);
  };
const hideTaskbarIcons = () => {
    getWindows().forEach((win) => win.setSkipTaskbar(true));
    if (process.platform === "darwin") app.dock.hide();
  },
  showTaskbarIcons = () => {
    getWindows().forEach((win) => win.setSkipTaskbar(false));
    if (process.platform === "darwin") app.dock.show();
  },
  setLaunchOnStartup = () => {
    const { launchOnStartup, runInBackground, hideOnLaunch } = plugin.settings;
    app.setLoginItemSettings({
      openAtLogin: launchOnStartup,
      openAsHidden: runInBackground && hideOnLaunch,
    });
  };
const cleanup = () => {
    log(LOG_CLEANUP);
    unregisterHotkeys();
    showTaskbarIcons();
    allowWindowClose();
    destroyTray();
  },
  relaunchApp = () => {
    app.relaunch();
    app.exit(0);
  },
  closeVault = () => {
    log(LOG_CLEANUP);
    cleanup();
    const vaultWindows = getWindows(),
      obsidianWindows = BrowserWindow.getAllWindows();
    if (obsidianWindows.length === vaultWindows.length) {
      app.quit();
    } else vaultWindows.forEach((win) => win.destroy());
  };
const addQuickNote = () => {
    const { quickNoteLocation, quickNoteDateFormat } = plugin.settings,
      pattern = quickNoteDateFormat || DEFAULT_DATE_FORMAT,
      date = obsidian.moment().format(pattern),
      name = obsidian
        .normalizePath(`${quickNoteLocation ?? ""}/${date}`)
        .replace(/\*|"|\\|<|>|:|\||\?/g, "-"),
      leaf = plugin.app.workspace.getLeaf(),
      root = plugin.app.fileManager.getNewFileParent(""),
      openMode = { active: true, state: { mode: "source" } };
    plugin.app.fileManager
      .createNewMarkdownFile(root, name)
      .then((file) => leaf.openFile(file, openMode));
    showWindows();
  },
  replaceVaultName = (str) => {
    return str.replace(/{{vault}}/g, plugin.app.vault.getName());
  },
  destroyTray = () => {
    tray?.destroy();
    tray = undefined;
  },
  createTrayIcon = () => {
    destroyTray();
    if (!plugin.settings.createTrayIcon) {
      return;
    }
    log(LOG_TRAY_ICON);
    const obsidianIcon = nativeImage.createFromDataURL(
        plugin.settings.trayIconImage ?? OBSIDIAN_BASE64_ICON,
      ),
      contextMenu = Menu.buildFromTemplate([
        {
          type: "normal",
          label: ACTION_QUICK_NOTE,
          accelerator: plugin.settings.quickNoteHotkey,
          click: addQuickNote,
        },
        {
          type: "normal",
          label: ACTION_SHOW,
          accelerator: plugin.settings.toggleWindowFocusHotkey,
          click: showWindows,
        },
        {
          type: "normal",
          label: ACTION_HIDE,
          accelerator: plugin.settings.toggleWindowFocusHotkey,
          click: hideWindows,
        },
        { type: "separator" },
        { label: ACTION_RELAUNCH, click: relaunchApp },
        { label: ACTION_CLOSE, click: closeVault },
      ]);
    tray = new Tray(obsidianIcon);
    tray.setToolTip(replaceVaultName(plugin.settings.trayIconTooltip));
    tray.on("click", () => {
      if (process.platform === "darwin") {
        tray.popUpContextMenu(contextMenu);
      } else showWindows();
    });
    tray.on("right-click", () => {
      tray.popUpContextMenu(contextMenu);
    });
    tray.on("double-click", () => {
      showWindows();
    });
  };
const registerHotkeys = () => {
    log(LOG_REGISTER_HOTKEY);
    try {
      const { toggleWindowFocusHotkey, quickNoteHotkey } = plugin.settings;
      if (toggleWindowFocusHotkey) {
        globalShortcut.register(toggleWindowFocusHotkey, toggleWindows);
      }
      if (quickNoteHotkey) {
        globalShortcut.register(quickNoteHotkey, addQuickNote);
      }
    } catch {}
  },
  unregisterHotkeys = () => {
    log(LOG_UNREGISTER_HOTKEY);
    try {
      globalShortcut.unregister(plugin.settings.toggleWindowFocusHotkey);
      globalShortcut.unregister(plugin.settings.quickNoteHotkey);
    } catch {}
  };
const OPTIONS = [
  "窗口管理",
  {
    key: "launchOnStartup",
    desc: "登录计算机时自动打开 Obsidian。",
    type: "toggle",
    default: false,
    onChange: setLaunchOnStartup,
  },
  {
    key: "hideOnLaunch",
    desc: `启动 Obsidian 时自动最小化。若已开启「后台运行」，窗口会隐藏到系统托盘，而不是最小化到任务栏。`,
    type: "toggle",
    default: false,
  },
  {
    key: "runInBackground",
    desc: `
      隐藏应用并继续在后台运行，而不是在按下窗口关闭按钮或切换焦点热键时退出。
    `,
    type: "toggle",
    default: false,
    onChange() {
      setLaunchOnStartup();
      if (plugin.settings.runInBackground) interceptWindowClose();
      else [allowWindowClose(), showWindows()];
    },
  },
  {
    key: "hideTaskbarIcon",
    desc: `
      从程序坞/任务栏隐藏窗口图标。如果使用此选项，建议先启用托盘图标。这可能不适用于基于 Linux 的操作系统。
    `,
    type: "toggle",
    default: false,
    onChange() {
      if (plugin.settings.hideTaskbarIcon) hideTaskbarIcons();
      else showTaskbarIcons();
    },
  },
  {
    key: "createTrayIcon",
    desc: `在系统托盘区添加图标，点击即可把隐藏的 Obsidian 窗口调回前台；右键菜单可强制退出或重启程序。`,
    type: "toggle",
    default: true,
    onChange: createTrayIcon,
  },
  {
    key: "trayIconImage",
    desc: `
      设置托盘/菜单栏图标使用的图像。推荐尺寸：16x16
      <br>预览：<img data-preview style="height: 16px; vertical-align: bottom;">
    `,
    type: "image",
    default: OBSIDIAN_BASE64_ICON,
    onChange: createTrayIcon,
  },
  {
    key: "trayIconTooltip",
    desc: `
      设置用于标识托盘/菜单栏图标的标题。
      <code>{{vault}}</code> 占位符将被库名称替换。
      <br>预览：<b class="u-pop" data-preview></b>
    `,
    type: "text",
    default: "{{vault}} | Obsidian",
    postprocessor: replaceVaultName,
    onChange: createTrayIcon,
  },
  {
    key: "toggleWindowFocusHotkey",
    desc: ACCELERATOR_FORMAT,
    type: "hotkey",
    default: "CmdOrCtrl+Shift+Tab",
    onBeforeChange: unregisterHotkeys,
    onChange: registerHotkeys,
  },
  "快速笔记",
  {
    key: "quickNoteLocation",
    desc: "新的快速笔记将放入此文件夹。",
    type: "text",
    placeholder: "示例：notes/quick",
  },
  {
    key: "quickNoteDateFormat",
    desc: `新建的快速笔记将用这个格式命名。${MOMENT_FORMAT}
      <br>预览：<b class="u-pop" data-preview></b>
    `,
    type: "moment",
    default: DEFAULT_DATE_FORMAT,
  },
  {
    key: "quickNoteHotkey",
    desc: ACCELERATOR_FORMAT,
    type: "hotkey",
    default: "CmdOrCtrl+Shift+Q",
    onBeforeChange: unregisterHotkeys,
    onChange: registerHotkeys,
  },
];
const keyToLabel = (key) =>
    ({
      launchOnStartup: "开机自动启动",
      hideOnLaunch: "启动时隐藏",
      runInBackground: "后台运行（关闭窗口不退出）",
      hideTaskbarIcon: "隐藏任务栏图标",
      createTrayIcon: "显示托盘图标",
      trayIconImage: "托盘图标图片",
      trayIconTooltip: "托盘图标悬停提示",
      toggleWindowFocusHotkey: "显示/隐藏窗口快捷键",
      quickNoteLocation: "快速笔记保存位置",
      quickNoteDateFormat: "快速笔记文件名格式",
      quickNoteHotkey: "快速笔记快捷键",
    })[key] ?? key,
  htmlToFragment = (html) =>
    document.createRange().createContextualFragment((html ?? "").replace(/\s+/g, " "));
class SettingsTab extends obsidian.PluginSettingTab {
  display() {
    this.containerEl.empty();
    for (const opt of OPTIONS) {
      const setting = new obsidian.Setting(this.containerEl);
      if (typeof opt === "string") {
        setting.setName(opt);
        setting.setHeading();
      } else {
        if (opt.default) opt.placeholder ??= `示例：${opt.default}`;
        setting.setName(keyToLabel(opt.key));
        setting.setDesc(htmlToFragment(opt.desc));
        const onChange = async (value) => {
          await opt.onBeforeChange?.();
          plugin.settings[opt.key] = value;
          await plugin.saveSettings();
          await opt.onChange?.();
        };
        const value = plugin.settings[opt.key] ?? opt.default ?? "";
        if (opt.type === "toggle") {
          setting.addToggle((toggle) => {
            toggle.setValue(value).onChange(onChange);
          });
        } else if (opt.type === "image") {
          const previewImg = setting.descEl.querySelector("img[data-preview");
          if (previewImg) previewImg.src = value;
          const fileUpload = setting.descEl.createEl("input");
          fileUpload.style.visibility = "hidden";
          fileUpload.type = "file";
          fileUpload.onchange = (event) => {
            const file = event.target.files[0],
              reader = new FileReader();
            reader.onloadend = () => {
              onChange(reader.result);
              if (previewImg) previewImg.src = reader.result;
            };
            reader.readAsDataURL(file);
          };
          setting.addButton((button) => {
            button.setIcon("image").onClick(() => fileUpload.click());
          });
        } else if (opt.type === "moment") {
          setting.addMomentFormat((moment) => {
            const previewEl = setting.descEl.querySelector("[data-preview]");
            if (previewEl) moment.setSampleEl(previewEl);
            moment
              .setPlaceholder(opt.placeholder)
              .setDefaultFormat(opt.default ?? "")
              .setValue(value)
              .onChange(onChange);
          });
        } else {
          const previewEl = setting.descEl.querySelector("[data-preview]"),
            updatePreview = (value) => {
              if (!previewEl) return;
              previewEl.innerText = opt?.postprocessor(value) ?? value;
            };
          updatePreview(value);
          setting.addText((text) => {
            text
              .setPlaceholder(opt.placeholder)
              .setValue(value)
              .onChange((value) => [onChange(value), updatePreview(value)]);
          });
        }
      }
    }
  }
}
class TrayPlugin extends obsidian.Plugin {
  async onload() {
    log(LOG_LOADING);
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));
    const { settings } = this;
    plugin = this;
    createTrayIcon();
    registerHotkeys();
    setLaunchOnStartup();
    observeWindows();
    if (settings.runInBackground) interceptWindowClose();
    if (settings.hideTaskbarIcon) hideTaskbarIcons();
    if (settings.hideOnLaunch) {
      this.registerEvent(this.app.workspace.onLayoutReady(hideWindows));
    }
    this.addCommand({ id: "relaunch-app", name: ACTION_RELAUNCH, callback: relaunchApp });
    this.addCommand({ id: "close-vault", name: ACTION_CLOSE, callback: closeVault });
  }
  onunload() {
    cleanup();
  }
  getCurrentWindow = getCurrentWindow;
  getWindows = getWindows;
  showWindows = showWindows;
  hideWindows = hideWindows;
  toggleWindows = toggleWindows;
  async loadSettings() {
    const DEFAULT_SETTINGS = OPTIONS.map((opt) => ({ [opt.key]: opt.default }));
    this.settings = Object.assign(...DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
}
module.exports = TrayPlugin;
