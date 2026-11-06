/**
 * ECharts demo 公共初始化（纯 JavaScript，无 jQuery / yqwin 依赖）
 * 依赖：echarts、CodeMirror 5（可选，用于右侧 JSON 编辑器）
 *
 * 主题来自 theme-boot.js 设置的 <html data-theme>：
 *   light -> ECharts 默认亮色 + CodeMirror eclipse；dark / blue -> ECharts dark + CodeMirror darcula
 */
(function (global) {
  'use strict';

  /** 当前生效的调色板（blue 归入深色） */
  function currentPalette() {
    return (document.documentElement.getAttribute('data-theme') || 'dark') === 'light' ? 'light' : 'dark';
  }

  /**
   * 初始化图表
   * @param {Element} element 图表容器
   * @param {object} option ECharts 配置
   * @returns {object} echarts 实例
   */
  function initChart(element, option) {
    var isLight = currentPalette() === 'light';
    var chart = global.echarts.init(element, isLight ? null : 'dark', {
      renderer: 'canvas',
      useDirtyRect: false
    });

    chart.setOption(Object.assign({ backgroundColor: 'transparent' }, option));

    global.addEventListener('resize', function () {
      chart.resize();
    });
    return chart;
  }

  /**
   * 初始化 JSON 编辑器（CodeMirror 5）
   * @param {Element} element 容器元素
   * @param {string} value 初始内容
   * @returns {object|null} CodeMirror 实例
   */
  function initJsonEditor(element, value) {
    if (!global.CodeMirror) return null;

    return global.CodeMirror(element, {
      value: value,
      mode: 'application/json',
      theme: currentPalette() === 'light' ? 'eclipse' : 'darcula',
      lineNumbers: true,
      tabSize: 2,
      indentUnit: 2,
      lineWrapping: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
    });
  }

  global.EchartsDemo = {
    currentPalette: currentPalette,
    initChart: initChart,
    initJsonEditor: initJsonEditor
  };
})(window);
