/* ==========================================================================
   YQWIN-Plus 测试页浮动主题切换器（test-theme-switch.js）
   --------------------------------------------------------------------------
   供 yqvue/test/*.html 与 yqvue/umd/*.html 共用：自动在页面右下角注入
   四段式主题切换（暗色 / 深蓝 / 亮色 / 跟随系统），样式在同目录
   webvue/yqvue/test-ui.css 的 #yq-theme-switch 区块。

   逻辑与 src/theme.ts、scripts/theme-boot.js 保持一致：
     · localStorage['yq-theme-mode'] 持久化（与工作台双向同步）
     · 「跟随系统」解析 prefers-color-scheme，并监听其变化
     · 应用 <html data-theme> 与 .dark（Element Plus 暗色变量开关）
     · 同步改写 #yq-theme-boot 临界底色，运行时切换与首屏引导一致
     · 监听 storage 事件：工作台或其他页面切换后本页跟随
   iframe 内不注入（工作台嵌入页由工作台自身管理主题）。
   ========================================================================== */
(function () {
  'use strict'

  // iframe 内不注入；重复加载幂等
  if (window.self !== window.top || window.__yqThemeSwitchLoaded) return
  window.__yqThemeSwitchLoaded = true

  var STORAGE_KEY = 'yq-theme-mode'
  var MODES = [
    {
      value: 'dark',
      label: '暗色',
      icon: '<path d="M20.5 13.4A8.6 8.6 0 1 1 10.6 3.5a6.8 6.8 0 0 0 9.9 9.9z"/>'
    },
    {
      value: 'blue',
      label: '深蓝',
      icon: '<path d="M12 3c3.2 3.6 5.6 6.9 5.6 9.8a5.6 5.6 0 0 1-11.2 0C6.4 9.9 8.8 6.6 12 3z"/>'
    },
    {
      value: 'light',
      label: '亮色',
      icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.2M12 19.2v2.2M4.5 4.5l1.6 1.6M17.9 17.9l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.5 19.5l1.6-1.6M17.9 6.1l1.6-1.6"/>'
    },
    {
      value: 'system',
      label: '跟随系统',
      icon: '<rect x="2.8" y="3.6" width="18.4" height="13" rx="2.2"/><path d="M8.4 20.4h7.2M12 16.6v3.8"/>'
    }
  ]
  // 临界底色与 theme-boot.js / theme.ts BOOT_COLORS 一致
  var BOOT_COLORS = {
    dark: { bg: '#0f1011', fg: '#d1d3db' },
    blue: { bg: '#10151e', fg: '#d1d3db' },
    light: { bg: '#eaecf0', fg: '#31353a' }
  }

  function loadMode() {
    var saved = null
    try { saved = localStorage.getItem(STORAGE_KEY) } catch (e) { /* 忽略 */ }
    for (var i = 0; i < MODES.length; i++) {
      if (MODES[i].value === saved) return saved
    }
    return 'dark'
  }

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  }

  function resolvePalette(mode) {
    if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
    return mode
  }

  var mode = loadMode()
  var switchEl = null

  function syncBootStyle(palette) {
    var el = document.getElementById('yq-theme-boot')
    if (!el) {
      el = document.createElement('style')
      el.id = 'yq-theme-boot'
      document.head.appendChild(el)
    }
    var c = BOOT_COLORS[palette]
    el.textContent = 'html{background-color:' + c.bg + ';color:' + c.fg +
      ';color-scheme:' + (palette === 'light' ? 'light' : 'dark') + '}'
  }

  function applyTheme() {
    var palette = resolvePalette(mode)
    var root = document.documentElement
    root.setAttribute('data-theme', palette)
    root.classList.toggle('dark', palette !== 'light')
    syncBootStyle(palette)
    if (switchEl) {
      var btns = switchEl.querySelectorAll('button')
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i].getAttribute('data-mode') === mode)
      }
    }
  }

  function setMode(next) {
    mode = next
    try { localStorage.setItem(STORAGE_KEY, next) } catch (e) { /* 忽略 */ }
    applyTheme()
  }

  function inject() {
    switchEl = document.createElement('div')
    switchEl.id = 'yq-theme-switch'
    switchEl.setAttribute('role', 'group')
    switchEl.setAttribute('aria-label', '主题切换')
    // 布局关键属性内联兜底：即使页面样式表缺失/被缓存，也保证浮动定位 + 横向排列
    switchEl.style.position = 'fixed'
    switchEl.style.right = '16px'
    switchEl.style.bottom = '16px'
    switchEl.style.zIndex = '999'
    switchEl.style.display = 'flex'
    switchEl.style.flexDirection = 'row'
    switchEl.style.alignItems = 'center'
    MODES.forEach(function (m) {
      var btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('data-mode', m.value)
      btn.title = m.label
      btn.setAttribute('aria-label', m.label)
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + m.icon + '</svg>'
      btn.addEventListener('click', function () { setMode(m.value) })
      switchEl.appendChild(btn)
    })
    document.body.appendChild(switchEl)
    applyTheme()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject)
  } else {
    inject()
  }

  // 「跟随系统」模式下响应系统深浅色变化
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function () {
      if (mode === 'system') applyTheme()
    })
  }

  // 同源其他窗口（如工作台）切换主题后同步跟随
  window.addEventListener('storage', function (e) {
    if (e.key !== STORAGE_KEY) return
    mode = loadMode()
    applyTheme()
  })
})()
