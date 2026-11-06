/* 主题引导（首屏防闪烁）：在各页面 <head> 内以同步脚本执行，先于 body 解析与首次绘制。
 * 逻辑与 src/theme.ts 的 loadMode/resolvePalette/applyTheme 保持一致：
 * 读取 localStorage['yq-theme-mode']，解析「跟随系统」，设置 <html data-theme> 与 .dark，
 * 并注入临界底色（theme.css 经 JS 模块注入，就绪前用内联样式防止白闪/黑闪）。
 * 运行时切换主题由 theme.ts applyTheme() 同步更新 #yq-theme-boot。 */
(function () {
  var mode = 'dark'
  try {
    var saved = localStorage.getItem('yq-theme-mode')
    if (saved === 'dark' || saved === 'blue' || saved === 'light' || saved === 'system') mode = saved
  } catch (e) { /* localStorage 不可用时回退默认暗色 */ }
  var palette = mode
  if (mode === 'system') {
    palette = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'
  }
  var root = document.documentElement
  root.setAttribute('data-theme', palette)
  if (palette !== 'light') root.classList.add('dark')
  // 临界底色与 theme.css 三调色板的 --yq-bg-body（页面底色）/正文色对应
  var bg = { dark: '#0f1011', blue: '#10151e', light: '#eaecf0' }
  var fg = { dark: '#d1d3db', blue: '#d1d3db', light: '#31353a' }
  var style = document.createElement('style')
  style.id = 'yq-theme-boot'
  style.textContent = 'html{background-color:' + bg[palette] + ';color:' + fg[palette] +
    ';color-scheme:' + (palette === 'light' ? 'light' : 'dark') + '}'
  document.head.appendChild(style)
})()
