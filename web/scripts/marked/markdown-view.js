/**
 * Markdown 预览组件（纯 JavaScript，无 jQuery / yqwin 依赖）
 * 依赖：marked、highlight.js，可选 highlightjs-line-numbers
 *
 * 用法：
 *   const view = new MarkdownView({ container: '#preview', title: '#pretitle' });
 *   view.render(markdownText);
 */
(function (global) {
  'use strict';

  var uid = 0;

  function nextId() {
    uid += 1;
    return 'md-' + Date.now().toString(36) + '-' + uid;
  }

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveElement(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.querySelector(target);
    return target;
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('复制失败:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function (err) {
        console.error('剪贴板写入失败，尝试兼容方式:', err);
        fallbackCopy(text);
      });
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  function buildToc(headings) {
    if (!headings.length) return '';

    var toc = '';
    var level = 0;

    headings.forEach(function (heading) {
      var current = Math.max(1, heading.level);
      if (current > level) {
        for (var up = level; up < current; up++) toc += '<ul>';
      } else {
        for (var down = current; down < level; down++) toc += '</ul>';
        toc += '</li>';
      }
      toc += '<li><a href="#' + heading.id + '">' + escapeHtml(heading.text) + '</a>';
      level = current;
    });

    while (level > 0) {
      toc += '</li></ul>';
      level -= 1;
    }
    return toc;
  }

  /**
   * 将 markdown 渲染为 html，并为标题生成锚点 id 与目录
   * @param {string} markdown
   * @returns {{html: string, toc: string}}
   */
  function renderMarkdown(markdown) {
    var headings = [];

    var parser = new global.marked.Marked({
      walkTokens: function (token) {
        if (token.type === 'heading') {
          token.id = nextId();
          headings.push({ level: token.depth, text: token.text, id: token.id });
        }
      },
      renderer: {
        heading: function (token) {
          var id = token.id || nextId();
          return '<h' + token.depth + ' id="' + id + '">' + token.text + '</h' + token.depth + '>';
        }
      }
    });

    return {
      html: parser.parse(markdown == null ? '' : markdown),
      toc: buildToc(headings)
    };
  }

  /**
   * 高亮代码块，并添加语言标题与复制按钮
   * @param {Element} container 已渲染 markdown 的容器
   */
  function decorateCodeBlocks(container) {
    var blocks = container.querySelectorAll('pre code');

    Array.prototype.forEach.call(blocks, function (codeElement) {
      try {
        if (global.hljs) {
          global.hljs.highlightElement(codeElement);
          if (global.hljs.lineNumbersBlock) {
            global.hljs.lineNumbersBlock(codeElement);
          }
        }
      } catch (err) {
        console.error('代码块高亮失败:', err);
      }

      var lang = (codeElement.className || '')
        .replace('hljs', '')
        .replace('language-', '')
        .trim();

      var pre = codeElement.parentNode;
      pre.style.position = 'relative';

      var title = document.createElement('div');
      title.className = 'code-title';
      title.textContent = lang;
      pre.insertBefore(title, pre.firstChild);

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-button';
      button.textContent = '复制';
      button.addEventListener('click', function () {
        var content = codeElement.textContent.trim();
        if (!content) {
          console.warn('代码块内容为空');
          return;
        }
        copyText(content).then(function () {
          button.textContent = '已复制';
          setTimeout(function () {
            button.textContent = '复制';
          }, 3000);
        });
      });
      pre.appendChild(button);
    });
  }

  /**
   * @constructor
   * @param {{container: (string|Element), title?: (string|Element)}} options
   */
   function MarkdownView(options) {
    options = options || {};
    this.container = resolveElement(options.container);
    this.titleElement = resolveElement(options.title);
  }

  /**
   * 渲染 markdown
   * @param {string} markdown
   */
  MarkdownView.prototype.render = function (markdown) {
    if (!this.container) return;

    var result = renderMarkdown(markdown);

    if (this.titleElement) {
      this.titleElement.classList.add('markdown-title');
      this.titleElement.innerHTML = result.toc;
    }

    this.container.classList.add('markdown-body');
    this.container.innerHTML = result.html;
    decorateCodeBlocks(this.container);
  };

  global.MarkdownView = MarkdownView;
  global.renderMarkdown = renderMarkdown;
})(window);
