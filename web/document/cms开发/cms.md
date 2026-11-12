# CMS 服务端渲染开发文档

> 本文档基于 **yuanqi-open** 演示项目编写。
> 源码：<https://gitee.com/uieip/yuanqi-open> ｜ <https://github.com/uieip>
> 演示站点：<http://www.uieip.com/> ｜ 本地测试：<http://localhost:8011/>

本文说明如何使用框架的 **服务端脚本（jsvm）** 开发 CMS 站点：导航、栏目、文章列表、文章详情、单页、分页、SEO、404 全部在服务端取数并渲染，浏览器收到的是完整 HTML，不依赖前端框架。

适用对象：在 `/cms` 下开发网站模板的前端 / 全栈人员。

## 快速上手

```html
<!doctype html>
<uieip type="page" value="base"></uieip>
<uieip type="reg" value="console,cms"></uieip>
<html>
<head>
    <uieip type="file" value="inc" src="/cms/inc/pc_head_inc.html"></uieip>
    <uieip type="tmpl" value="cms.title"></uieip>
</head>
<body>
    <uieip type="file" value="exec" src="/cms/inc/pc_topmenu_exec.html"></uieip>

    <uieip id="div_list" type="tmpl" value="cms.datalist"
           dbname="yqbase" tbname="cms_news"
           where="" order="time desc" pagesize="12" js="renderList"></uieip>

    <script runat="server">
        function renderList(data) {
            var base = "/" + (data.path ? data.path + "/" : "");
            var h = '<ul class="list-group">';
            for (var i = 0; i < data.rows.length; i++) {
                var row = data.rows[i];
                h += '<li><a href="' + base + row.tid + '.html">'
                   + escapeHtml(row.title) + '</a></li>';
            }
            h += '</ul>';
            return h;
        }
        function escapeHtml(s) {
            return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
                            .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
        }
    </script>
</body>
</html>
```

这段模板完成了三件事：

1. **导航 & SEO**：`exec` 片段自动输出顶部导航与面包屑；`cms.title` 按当前栏目生成 `<title>` 与 meta。
2. **取数 & 渲染**：`cms.datalist` 从 `yqbase.cms_news` 取分页数据，`renderList` 把它拼成 Bootstrap 列表。
3. **整页缓存**：生产模式下结果以 `cms:<url>` 为键缓存，下次命中直接返回。

想知道 `webpath`、`sys_cms`、分页规则、`body.html` 这些具体约定，从 [1. 架构与配置](#1-架构与配置) 开始读。

## 现有模板

`/cms` 目录下已提供一套完整示例：

| 文件 | 用途 |
| --- | --- |
| `index.html` | 首页 |
| `list.html` | 栏目列表（分页） |
| `page.html` | 文章详情 |
| `pageone.html` | 单页（固定内容） |
| `404.html` / `404_1.html` | PC / 移动端 404 |
| `inc/pc_head_inc.html` | head 公共片段 |
| `inc/pc_topmenu_exec.html` | 顶部导航（`exec`） |
| `inc/pc_breadcrumb_exec.html` | 面包屑（`exec`） |
| `inc/pc_leftmenu_exec.html` | 左侧菜单（`exec`） |
| `inc/pc_footer_inc.html` | 页脚公共片段 |
| `doc.html` / `query.html` | 文档型 / 查询型页面示例 |

每个文件都经过生产环境验证，修改字段名或增删字段时可直接作为对照。

---

## 1. 架构与配置

### 1.1 目录与职责

| 路径 | 职责 |
| --- | --- |
| `/cms/index.html` | 站点首页模板 |
| `/cms/list.html` | 栏目列表模板（分页） |
| `/cms/page.html` | 文章详情模板 |
| `/cms/pageone.html` | 单页模板（关于我们、联系方式等） |
| `/cms/404.html` / `404_1.html` | PC / 移动端 404 |
| `/cms/inc/` | 公共片段：head、顶部导航、面包屑、左侧菜单、页脚 |
| `/scripts/cms/lgstatus.js` | 前台登录状态、统计、评论、管理员模板编辑入口 |

### 1.2 请求处理流程

```text
GET /blog/axCKP0-ya.html
        │
        ▼
CMS 请求入口
        │  非静态目录、扩展名 .html
        ▼
按 sys_cms.navigation 把 URL 映射为模板文件
        │  读取 sys_cms（name = websvr/cms）
        ▼
页面执行
        │  生产模式：命中 cms:<path?query> 直接返回
        │  未命中：读取模板文件
        ▼
jsvm.Init
        │  page → reg → file → tmpl → script → 表达式 → js 渲染函数
        ▼
完整 HTML → 写入 cms:<path?query> 缓存 → 响应
```

### 1.3 URL 到模板的映射

站点配置在 `sys_cms`，`websvr/cms` 指定读取哪一行（默认 `www`）。

| 访问 URL | 匹配规则 | 使用的模板字段 |
| --- | --- | --- |
| `/` | 根路径 | `site_info.index_url`（移动端优先 `index_url1`） |
| `/blog/` | 目录 → `index.html` → 列表第一页 | `list_url`（移动端优先 `list_url1`） |
| `/blog/page2.html` | 文件名以 `page` 开头 | `list_url`，页码 = `2` |
| `/blog/axCKP0-ya.html` | 其它文件名 | `show_url`（移动端优先 `show_url1`） |
| 导航节点配置了 `link_url` 且为 `http(s)://` | 外链 | 302 跳转 |
| 导航节点配置了相对 `link_url` | 按该 path 重新定位导航 | 该节点的模板 |
| 找不到导航 / 模板为空 | 兜底 | `404.html`（移动端 `404_1.html`） |
| 模板文件不存在 | 读取失败 | 同上 404 |

注意：

- 配置中的模板路径会被 **转小写** 后拼到 `webpath`，模板文件名请统一小写。
- 访问 `/blog/` 时内部文件名先变成 `index.html`，再统一改为 `page1.html` 参与模板选择，所以列表页模板看到的是"第 1 页"。
- 导航节点的 `tid` 优先级高于 URL 文件名。单页节点配置 `tid` 后，该栏目下任意详情 URL 都会渲染同一条记录。

移动端 404 文件：与其 `index_url1` 同目录（为空时回退 `index_url` 的目录）的 `404_1.html`。

### 1.4 特殊文件名

CMS 在进入导航映射前会处理以下前缀（正常页面不需要）：

| 文件名 | 行为 |
| --- | --- |
| `_name.html` | 执行 `svrfunc`/`handler` 下的服务端处理函数（表单提交、接口） |
| `!xxx` | 输出数据库中的文件 |
| `@xxx` / `^xxx` | 输出文件存储中的文件 |
| `` `xxx.html `` | 直接执行指定模板，不经过导航映射 |

### 1.5 服务配置

`config.json` 中与 CMS 相关的配置：

```json
{
  "websvr": {
    "webpath": "../website",
    "cms": "www",
    "debug": true,
    "timeout": 2000,
    "cachetime": 1440
  }
}
```

| 配置 | 说明 |
| --- | --- |
| `webpath` | 站点根目录，模板、图片、脚本均相对此目录 |
| `cms` | 读取 `sys_cms.name` 等于该值的站点配置 |
| `debug` | 调试模式：不做整页缓存、不压缩内联 JS、不缓存 inc 文件，并向浏览器控制台输出模板数据 |
| `timeout` | 单次服务端脚本执行超时（毫秒），调试模式下不生效 |
| `cachetime` | 整页缓存与站点配置缓存时长（分钟） |

### 1.6 `sys_cms` 结构

`sys_cms` 位于主库，与内容表所在库无关。

| 字段 | 说明 |
| --- | --- |
| `name` | 站点标识，与 `websvr/cms` 对应 |
| `describe` | 站点名称，仅后台展示 |
| `site_info` | 站点信息 JSON |
| `navigation` | 导航 JSON 数组 |
| `queue` | 排序 |

`site_info` 示例：

```json
{
  "title": "站点标题",
  "keywords": "站点关键词",
  "description": "站点描述",
  "index_url": "cms/Index.html",
  "index_url1": ""
}
```

`navigation` 示例（每个节点对应一个栏目）：

```json
[
  {
    "name": "作者博客",
    "describe": "作者博客",
    "path": "blog",
    "blank": false,
    "list_url": "cms/list.html",
    "show_url": "cms/page.html",
    "p_title": "作者博客",
    "p_keywords": "作者博客",
    "p_describe": "作者博客",
    "is_del": false
  },
  {
    "name": "关于作者",
    "link_url": "author",
    "blank": false,
    "is_del": false,
    "subs": [
      {
        "name": "作者简介",
        "path": "author",
        "list_url": "cms/pageone.html",
        "tid": "vj-c-whqe",
        "p_title": "作者简介",
        "p_keywords": "作者简介",
        "p_describe": "作者简介",
        "is_del": false
      }
    ]
  }
]
```

导航字段（JSON 键为小写下划线风格，脚本中访问的是导出字段，首字母大写）：

| JSON 键 | 运行时字段 | 说明 |
| --- | --- | --- |
| `name` | `Name` | 菜单文字 |
| `describe` | `Describe` | 菜单描述 / `title` 提示 |
| `icon` | `Icon` | 图标 CSS 类名 |
| `path` | `Path` | 栏目路径，如 `blog`、`account/index` |
| `link_url` | `LinkUrl` | 外链或其它栏目的 path |
| `blank` | `Blank` | 是否新窗口打开 |
| `list_url` | `ListUrl` | 列表页模板 |
| `show_url` | `ShowUrl` | 详情页模板 |
| `list_url1` | `ListUrl1` | 移动端列表模板（可空） |
| `show_url1` | `ShowUrl1` | 移动端详情模板（可空） |
| `tid` | `Tid` | 固定记录 tid（单页栏目必填） |
| `p_title` | `PTitle` | 栏目 SEO 标题 |
| `p_keywords` | `PKeywords` | 栏目 SEO 关键词 |
| `p_describe` | `PDescribe` | 栏目 SEO 描述 |
| `is_del` | `IsDel` | 是否隐藏（仍可访问） |
| `subs` | `Subs` | 子栏目数组，结构相同 |

### 1.7 后台维护

- 站点与导航维护：`/adp/cms.html`（站点下拉 + 导航树 + 站点信息 / 导航信息编辑）。
- 清理 CMS 缓存：该页面的"清理缓存"按钮，实际执行 `yqData.clearCache("cms:")`。
- 更细粒度缓存清理：`/adp/svradmin/cache.html`。

修改导航或 `site_info` 后必须清理 `cms:` 前缀缓存（站点配置本身缓存键是 `cms:_siteinfo`），否则要等 `cachetime` 过期。

---

## 2. 模板语法与服务端脚本 API

CMS 模板就是普通 HTML 文件，加上 `uieip` 标签与 `runat="server"` 脚本。

### 2.1 最小模板

```html
<!doctype html>
<uieip type="page" value="base"></uieip>
<uieip type="reg" value="console,cms"></uieip>
<html>
<head>
    <uieip type="file" value="inc" src="/cms/inc/pc_head_inc.html"></uieip>
    <uieip id="div_title" type="tmpl" value="cms.title"></uieip>
</head>
<body>
    <uieip type="file" value="exec" src="/cms/inc/pc_topmenu_exec.html"></uieip>

    <uieip id="div_list" type="tmpl" value="cms.datalist"
           dbname="yqbase" tbname="cms_news"
           where="" order="time desc" pagesize="12" js="renderList"></uieip>

    <script runat="server">
        function renderList(data) {
            return "<ul></ul>";
        }
    </script>
</body>
</html>
```

### 2.2 标签速查

| 标签 | 作用 | 常用参数 |
| --- | --- | --- |
| `<uieip type="page" value="base">` | 页面类型。`base` 为基础页面，`login` 会强制登录（后台用） | `value`、`debug`、`timeout`、`method` |
| `<uieip type="reg" value="console,cms,login,data">` | 注册服务端函数库，逗号分隔 | `value` |
| `<uieip type="file" value="inc" src="...">` | **原样内联**文件内容，不解析文件里的 `uieip` | `src`、`cache`、`minute` |
| `<uieip type="file" value="exec" src="...">` | 以独立 jsvm 执行被引入文件，**会解析其中的 `uieip`**，结果内联；数据会复制回主 VM | `src` |
| `<uieip type="file" value="js" src="...">` | 内联 JS 文件，生产模式压缩 | `src`、`cache` |
| `<uieip type="file" value="css" src="...">` | 内联 CSS 文件 | `src`、`cache` |
| `<uieip type="file" value="jsvm" src="...">` | 读取 JS 文件并在服务端执行（不输出） | `src` |
| `<uieip type="file" value="code" src="...">` | 读取文件、转义后以 `<pre>` 输出 | `src` |
| `<uieip type="tmpl" value="cms.xxx" id="..." js="fn">` | 数据模板（内置 `cms.*` 或自定义） | 见 [3. 内置数据模板](#3-内置数据模板) |
| `<uieip>表达式</uieip>` | 服务端表达式输出（不带 `type`），如 `<uieip>_html</uieip>` | 表达式 |
| `<script runat="server">...</script>` | 服务端脚本（goja 执行） | `src`（可选，相对 web 根） |

路径规则（`src`）：

- 以 `/` 开头：相对 `webpath` 根目录，推荐统一这样写。
- 以 `..` 开头：相对当前模板所在目录。
- 其它：相对当前模板所在目录。

`script src` 与 `require` 不同，始终按 `webpath` 根目录解析。

### 2.3 执行顺序

模板引擎的实际执行顺序，开发时必须按此理解数据何时可用：

1. 查找 `type="page"`，校验 `method`，按 `debug` / `timeout` 参数设置运行模式。
2. 注入 `request`、`response`。
3. 注册 `type="reg"` 中的函数库。
4. 按文档顺序处理 `type="file"`（`inc` / `exec` / `js` / `css` / `jsvm` / `code`）。
5. 按文档顺序执行所有 `type="tmpl"` 数据模板，结果暂存到 `vm.Datas`。
6. 处理 `type="form"`。
7. 调试模式注入数据打印脚本；若存在 `_tongji` 数据，注入 `const _tongji = {...}`。
8. 执行所有 `<script runat="server">`（按文档顺序）。
9. 执行所有 `uieip` 表达式输出。
10. 执行数据模板的 `js` 渲染函数：`response.set(id, fn(request.data(id)))`。
11. 生产模式压缩页面内联 `<script>`。
12. 输出并缓存整页。

几条硬规则：

- **数据模板在服务端脚本之前执行**，所以脚本里可以直接 `request.data("cms.nav")`、`request.data("div_list")`。
- **渲染函数最后执行**，适合生成大段 HTML；也可以在渲染函数里调用 `cms.title()` 改写标题。
- **`inc` 不解析 `uieip`**。动态片段（导航、面包屑）必须用 `exec`；`inc` 只适合纯 HTML/CSS/JS 等静态内容。
- **`exec` 有独立 VM**，可以自己声明 `cms.nav` 等模板，执行完数据会合并回主 VM。主页面即使没声明 `cms.nav`，只要前面的 `exec` 声明过，后面的脚本也能 `request.data("cms.nav")`；但建议主页面显式声明，避免依赖隐式顺序。
- **`id` 与 `js` 必须同时设置**，渲染函数才会被调用；缺少 `id` 时数据以模板名（如 `cms.datalist`）存放，且不会执行 `js`。
- `id` 必须唯一，`response.set` 只替换第一个匹配项。
- 多个 `js` 渲染函数之间没有固定执行顺序（按内部 map 遍历），不要互相依赖执行先后。

服务端脚本先执行、表达式后输出，因此常用"先算后写"的写法（见 `/cms/doc.html`）：

```html
<uieip type="reg" value="resource"></uieip>
<div id="sidebar"><uieip>_html</uieip></div>

<script runat="server">
    var _html = "";
    var res = resource.ujson("document/data.ujson");
    if (res.error == 0) {
        _html = "<ul>...</ul>";
    }
</script>
```

### 2.4 服务端脚本 API

#### 2.4.1 `request`

| 方法 | 说明 |
| --- | --- |
| `request.data(id)` | 读取数据模板数据；不存在返回 `null` |
| `request.set(id, html)` | 按 `id` 替换模板占位内容 |
| `request.get(id)` | 读取指定 `id` 当前已生成的 HTML，不存在返回 `null` |
| `request.dataset(id, value)` | 向 `id` 写入自定义数据，供后续脚本读取 |
| `request.param(name)` | 读取请求参数（查询串或表单），空值返回 `null` |
| `request.pathval()` | 返回 `{path, name, page}`；`name` 不含 `.html`，`page` 仅在 `pageN.html` 时存在 |
| `request.url()` | 当前 URL 路径（去掉开头 `/`），如 `blog/axCKP0-ya.html` |
| `request.baseurl()` / `request.clienturl()` | `scheme://host` / `scheme://host/path` |
| `request.scheme()` / `request.host()` | 协议 / 主机 |
| `request.ip()` | 客户端 IP |
| `request.isPostback()` | 是否 `__POSTBACK` 提交 |
| `request.formGetValue(name)` | 读取 POST 表单值，多值返回数组 |
| `request.formSetValue(name, value)` | 设置 POST 表单值（用于回填） |
| `request.cookie_get(name)` / `cookie_set` / `cookie_del` | Cookie 读写删 |
| `request.body(true)` | 请求体，`true` 返回字符串，否则字节数组 |

#### 2.4.2 `response`

| 方法 | 说明 |
| --- | --- |
| `response.write(str)` | 向当前位置输出内容（脚本块内最常用） |
| `response.set(id, html)` | 替换指定 `id` 的模板占位 |
| `response.redirect(url)` | 302 跳转 |
| `response.scriptbegin()` / `response.scriptend()` | 输出 `<script>` / `</script>` |

#### 2.4.3 `cms`

| 方法 | 说明 |
| --- | --- |
| `cms.title(title)` | 用标题更新页面中 `cms.title` 模板位置 |
| `cms.title(title, keywords, description)` | 同时设置关键词与描述 |

详情页通常在 `cms.datarow` 的渲染函数里调用，用文章标题覆盖栏目标题。若页面没有声明 `cms.title` 模板，`cms.title()` 会把生成的 HTML 作为返回值返回。

#### 2.4.4 `login`

| 方法 | 说明 |
| --- | --- |
| `login.state()` | 是否登录，布尔值 |
| `login.userinfo()` | 登录用户信息（按字段名访问，如 `login.userinfo()["name"]`）；未登录返回 `undefined` |
| `login.isadmin()` | 当前用户是否为管理员 |
| `login.logout()` | 退出登录 |

页面引入 `login` 函数库后，可像 `/cms/inc/pc_topmenu_exec.html` 一样在服务端输出用户状态。但注意整页缓存是站点级的，用户相关内容建议交给客户端脚本 `lgstatus.js` 处理，或关闭整页缓存。

#### 2.4.5 `resource`

| 方法 | 说明 |
| --- | --- |
| `resource.ujson(path)` | 读取 `webpath` 下的 ujson，返回 `{error:0, data:...}` |
| `resource.file(path)` | 读取文件文本，返回 `{error:0, text:"..."}` |
| `resource.stringToMD5(str)` | MD5 |
| `resource.rsaEncrypt` / `rsaDecrypt` 等 | RSA 工具 |

示例见 `/cms/doc.html`：在服务端脚本中 `resource.ujson("document/data.ujson")` 读取文档树并生成页面。

#### 2.4.6 `data`（自定义查询）

`type="reg"` 中加上 `data` 后可用：

| 方法 | 说明 |
| --- | --- |
| `data.query(dbName, sql, params)` | 查询，返回 `{error:0, info:"success", rows:[...]}` |
| `data.exec(dbName, sql, params)` | 增删改，返回 `{error:0, info:"success"}` |

`sql` 使用 `$1`、`$2` 占位，`params` 为数组；SQLite 会自动转换为 `?`。适合内置模板无法覆盖的统计、聚合、联表查询。失败时返回 `{error:9, info:"错误原因"}`。

#### 2.4.7 `console`

`console.log()` 输出到服务端日志。调试模式下，jsvm 还会把每个数据模板的数据以 `_tmp_cms_nav`、`_tmp_div_list` 等变量注入页面末尾并在浏览器控制台打印，方便查看真实数据结构。

---

## 3. 内置数据模板

所有数据模板都共享一份"页面信息"（当前路径、站点信息、导航），并通过 `_tongji` 向客户端暴露统计用的 URL 等数据。

除 `cms.title` 外，这些模板默认不生成 HTML，只负责取数；需要输出内容时必须配合 `js` 渲染函数（或在脚本里读取 `request.data` 自行拼接）。

### 数据流

```text
后台内容表 (cms_news / cms_oneshot / 自定义表)
        │
        ▼
cms.datalist / cms.datarow  ──  按 sys_tb 逻辑名查库
        │
        ▼
vm.Datas[id]  ──  request.data(id)
        │
        ▼
js 渲染函数  ──  拼接 HTML、转义、生成分页/上下篇
        │
        ▼
response.set(id, html) → 完整 HTML → 整页缓存 cms:<url> → 浏览器
```

整个过程中浏览器不发起内容接口请求，SEO 抓取到的就是最终内容。

### 3.1 `cms.nav`：导航

```html
<uieip id="nav" type="tmpl" value="cms.nav" js="renderNav"></uieip>
```

| 参数 | 说明 |
| --- | --- |
| `id` | 数据键，同时是替换位置。使用 `js` 时必填 |
| `js` | 渲染函数名；设置后先用内置 HTML 占位，再由函数返回值替换 |

#### 数据结构（`request.data("cms.nav")` / 渲染函数入参）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `path` | string | 当前栏目路径，首页为空串 |
| `name` | string | 当前文件名（不含 `.html`），首页为 `index` |
| `page` | number | 仅 `pageN.html` 时存在 |
| `site` | object | `Title`、`Keywords`、`Description`、`IndexUrl`、`IndexUrl1` |
| `navs` | array | 顶层导航数组 |
| `nav` | array | 从根到当前栏目的导航链；首页为空数组 |

导航项运行时字段见 [1.6 `sys_cms` 结构](#16-sys_cms-结构)。

#### 链接规则（自定义渲染函数常用）

- `LinkUrl` 为 `http://` / `https://`：直接使用。
- `LinkUrl` 非空但不是外链：视为另一个栏目的 path，链接为 `/{LinkUrl}/`。
- `LinkUrl` 为空：链接为 `/{Path}/`。
- 当前节点判断：`Path == path`；首页还要结合 `name == "index"`。
- `Blank` 为真时加 `target="_blank"`。

内置回退导航（只写 `js`、不实现渲染函数时）会直接输出 `LinkUrl`，不做上述相对路径转换；正式页面请像 `/cms/inc/pc_topmenu_exec.html` 一样实现自己的渲染函数。

#### 完整实现位置

- 顶部导航：`/cms/inc/pc_topmenu_exec.html`
- 面包屑：`/cms/inc/pc_breadcrumb_exec.html`
- 左侧菜单：`/cms/inc/pc_leftmenu_exec.html`

注意：`cms.nav` 数据中 **不包含 `url`**，服务端把 URL 移到了 `_tongji.url`。需要当前目录 URL 时用 `"/" + data.path + "/"`（首页需特判）。

### 3.2 `cms.title`：标题与 SEO

```html
<!-- 自动模式：首页用站点信息，栏目页用导航的 p_* 字段 -->
<uieip id="div_title" type="tmpl" value="cms.title"></uieip>

<!-- 手工模式 -->
<uieip type="tmpl" value="cms.title" title="404" description="页面不存在"></uieip>

<!-- 交给脚本控制 -->
<uieip id="div_title" type="tmpl" value="cms.title" js="setTitle"></uieip>
```

#### 行为

1. 设置了 `title` 参数：直接输出 `<title>`、`<meta name="keywords">`、`<meta name="description">`。当前实现中 `keywords` 取 `title` 参数值；如需独立关键词，用服务端脚本调用 `cms.title(title, keywords, description)`。
2. 未设置 `title` 且设置了 `js`：只准备数据，不输出 HTML，由渲染函数调用 `cms.title(...)`。
3. 自动模式：`path` 为空（首页或根级模板）使用 `site.Title/Keywords/Description`；其它页面使用当前导航链最后一项的 `PTitle/PKeywords/PDescribe`；`path` 非空但找不到导航时输出 `404` 标题。

#### 详情页覆盖标题的典型写法（见 `/cms/page.html`）

```javascript
function renderRow(data) {
    if (!data.row) return "";

    var nav = request.data("cms.nav");
    var navItem = (nav && nav.nav && nav.nav.length > 0) ? nav.nav[0] : {};
    cms.title(
        (data.row.title ? data.row.title + " - " : "") + (navItem.PTitle || ""),
        (data.row.keywords ? data.row.keywords + "," : "") + (navItem.PKeywords || ""),
        (data.row.summary ? data.row.summary + " - " : "") + (navItem.PDescribe || "")
    );
    // ...
}
```

### 3.3 `cms.datalist`：列表与分页

```html
<uieip id="div_list" type="tmpl" value="cms.datalist"
       dbname="yqbase" tbname="cms_news"
       where="" order="time desc"
       pagesize="12" js="renderList"></uieip>
```

#### 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `dbname` | 是 | 数据库名 |
| `tbname` | 是 | `sys_tb` 中登记的逻辑表名（物理表由 `vi_name` 决定） |
| `where` | 否 | SQL 条件片段，**不要写 `WHERE` 关键字**；空串表示全部 |
| `order` | 否 | 排序字段；默认 `modifytime desc`，填写后会自动追加 `,modifytime desc` |
| `isPage` | 否 | 默认分页；设为 `false` 则只取全部数据，不做分页 |
| `pagesize` | 分页时必填 | 每页条数，必须为正整数，否则报错 |
| `pageno` | 否 | 兼容参数，当前实现不参与分页 |
| `id` | 使用 `js` 时必填 | 数据键与渲染位置 |
| `js` | 否 | 渲染函数名 |

**页码来自 URL**：`/blog/page2.html` → `page=2`；`/blog/` 与 `/blog/index.html` → 第 1 页。

> 旧版帮助文档中的 `pagesize` 默认值 10、`pageno` 指定页码在当前代码中不生效：`pagesize` 必须显式设置，页码由 URL 决定，以本节为准。

#### 数据结构

分页模式：

| 字段 | 说明 |
| --- | --- |
| `path` | 当前目录路径，如 `blog` |
| `name` | 当前文件名 |
| `page` | URL 中的页码（`pageN.html` 时存在） |
| `url` | 当前页面路径（`/blog/` 或 `/blog/page2.html`），**不能**直接当分页前缀 |
| `dbname` / `tbname` | 查询来源 |
| `pagesize` / `pageno` / `pagecount` / `recordcount` | 分页信息 |
| `rows` | 数据行数组 |

非分页数据只有 `rows`（以及 `path`/`name`/`url`），没有分页字段。

#### 分页链接规则

用目录路径作为前缀，**不要用 `data.url`**（`page2.html` 时它是完整页面路径）：

- 第 1 页：`/{path}/`，根目录为 `/`
- 第 N 页（N > 1）：`/{path}/pageN.html`

```javascript
var base = "/" + (data.path ? data.path + "/" : "");  // /blog/ 或 /
```

#### 最小渲染函数

```javascript
function renderList(data) {
    var base = "/" + (data.path ? data.path + "/" : "");
    var h = '<div class="list-group">';

    for (var i = 0; i < data.rows.length; i++) {
        var row = data.rows[i];
        h += '<a class="list-group-item" href="' + base + row.tid + '.html">';
        h += '    <span class="item-title">' + escapeHtml(row.title) + '</span>';
        h += '    <span class="item-date">' + escapeHtml(row.time).substring(0, 10) + '</span>';
        h += '</a>';
    }
    h += '</div>';

    if (data.pagecount > 1) {
        h += '<ul class="pagination">';
        if (data.pageno > 1) {
            var prev = data.pageno === 2 ? base : base + "page" + (data.pageno - 1) + ".html";
            h += '<li><a href="' + prev + '">上一页</a></li>';
        }
        if (data.pageno < data.pagecount) {
            h += '<li><a href="' + base + "page" + (data.pageno + 1) + '.html">下一页</a></li>';
        }
        h += '</ul>';
    }
    return h;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
```

生产示例（含统计占位、缩略图、分页）见 `/cms/list.html`。

### 3.4 `cms.datarow`：单条记录 / 详情页

```html
<uieip id="div_row" type="tmpl" value="cms.datarow"
       dbname="yqbase" tbname="cms_news"
       seek="tid='{id}'" order="time desc"
       current="true" js="renderRow"></uieip>
```

#### 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `dbname` | 是 | 数据库名 |
| `tbname` | 是 | 逻辑表名 |
| `seek` | 通常必填 | SQL 条件片段，可含 `{id}` 占位；为空时取表中第一行，不建议 |
| `order` | 否 | 排序；包含 `time` 时会额外查询上 / 下一条 |
| `current` | 否 | 设为 `true` 时向 `_tongji` 注入 `tbtag`、`tid`，供统计使用 |
| `id` / `js` | 使用 `js` 时必填 | 与列表一致 |

#### `{id}` 的取值顺序

1. 导航链最后一项的 `Tid`（单页栏目固定记录）；
2. URL 文件名（去掉 `.html`），但 `index` 不参与；
3. 都为空时不解码记录，直接返回只有 `path`/`name`/`url` 的数据（`data.row` 不存在）。

因此：

- 文章详情页：`path` 指向列表栏目（不配 `tid`），URL 文件名就是记录 `tid`，用 `seek="tid='{id}'"`。
- 单页栏目：导航节点配置 `tid`，模板用 `seek="tid='{id}'"`，用户访问 `/contact/` 即可渲染固定记录。
- 固定取一条记录：直接写 `seek="tid='xxxx'"`，不依赖 URL。

#### 数据结构

| 字段 | 说明 |
| --- | --- |
| `path` / `name` | 当前目录 / 文件名 |
| `url` | 当前页面路径；使用 `{id}` 且解析到记录时会移入 `_tongji.url`，固定 `seek` 或未解析到记录时仍保留 |
| `row` | 记录对象，没有匹配时不存在 |
| `prev` | `order` 含 `time` 且有当前记录时存在：时间不早于当前记录中最近的一条（更新的一篇） |
| `next` | `order` 含 `time` 且有当前记录时存在：时间不晚于当前记录中最近的一条（更早的一篇） |
| `tbname` | 逻辑表名（`order` 含 `time` 且有记录时写入） |

#### 渲染函数示例

```javascript
function renderRow(data) {
    if (!data.row) return "";

    var nav = request.data("cms.nav");
    cms.title(data.row.title || "", data.row.keywords || "", data.row.summary || "");

    var h = '<article class="article">';
    h += '  <h1>' + escapeHtml(data.row.title) + '</h1>';
    h += '  <div class="meta">' + escapeHtml(data.row.time) + '</div>';

    var body = data.row.body ? JSON.parse(data.row.body) : null;
    if (body && body.html) {
        h += body.html;   // 正文为后台富文本，按可信 HTML 处理
    }

    if (data.prev) {
        h += '<a href="' + data.prev.tid + '.html">前一条：' + escapeHtml(data.prev.title) + '</a>';
    }
    if (data.next) {
        h += '<a href="' + data.next.tid + '.html">下一条：' + escapeHtml(data.next.title) + '</a>';
    }
    h += '</article>';
    return h;
}
```

完整示例见 `/cms/page.html` 与 `/cms/pageone.html`。

---

## 4. 内容数据约定

内容由后台数据管理 / 编辑器写入，前台 CMS 只读，模板中不要做写库操作。

### 4.1 示例内容表

| 逻辑表名 | 物理表 | 用途 |
| --- | --- | --- |
| `cms_news` | `sys.cms_news` | 列表型内容（文章、资讯） |
| `cms_oneshot` | `sys.cms_oneshot` | 单页型内容（公司简介、联系方式） |

> 模板里的 `tbname` 写逻辑名 `cms_news`；实际访问的物理表来自 `sys_tb.vi_name`。

两者主要字段相同：

| 字段 | 说明 |
| --- | --- |
| `sid` | 记录主键 |
| `title` / `subtitle` | 标题 / 副标题 |
| `author` | 作者 |
| `keywords` | 关键词 |
| `time` | 显示时间，列表排序、上 / 下一条均使用 |
| `summary` | 摘要，可用于 SEO description |
| `img` | 缩略图 JSON 字符串 |
| `body` | 正文 JSON 字符串 |
| `topnumber` | 置顶值 |
| `tid` | URL 中使用的短标识，必须稳定且唯一 |
| `c_userid` / `c_username` | 创建人 ID / 用户名 |
| `m_userid` / `m_username` | 修改人 ID / 用户名 |
| `createtime` / `modifytime` | 创建 / 修改时间 |
| `kbs` | 知识库标记 |

### 4.2 `body` 字段

```json
{
  "files": [
    {
      "sid": "a4a29bc5-441e-464c-9a42-9301ea85d07a",
      "sto_type": 2,
      "sto_name": "sqlite",
      "name": "公司简介.jpg",
      "size": 74583,
      "type": "image/jpeg"
    }
  ],
  "html": "<p>正文内容...</p><img src=\"@sqlite_a4a29bc5-441e-464c-9a42-9301ea85d07a\">"
}
```

渲染正文：`JSON.parse(row.body).html`。正文由后台编辑器生成，属于可信 HTML，直接输出；其它字段必须转义。

### 4.3 `img` 与文件 URL

```json
{
  "sid": "e7c5bb7f-7acd-11f1-a366-00155d96c0e3",
  "sto_type": 2,
  "sto_name": "sqlite",
  "name": "封面.png",
  "size": 2828311,
  "type": "image/png"
}
```

URL 规则：

- `sto_type === 1`：`"!" + sto_name + "_" + sid`
- 其它：`"@" + sto_name + "_" + sid`

```javascript
function fileUrl(imgJson) {
    if (!imgJson) return "";
    var img = JSON.parse(imgJson);
    return (img.sto_type === 1 ? "!" : "@") + img.sto_name + "_" + img.sid;
}
```

正文字段中的图片通常已经被编辑器写成 `@sqlite_{sid}` 形式，直接输出即可。

### 4.4 `tid` 的约定

- `tid` 是 URL 中的短标识，必须稳定、唯一。
- 列表页链接：`base + row.tid + ".html"`（`base` 为 `"/" + (path ? path + "/" : "")`）。
- 详情页匹配：`seek="tid='{id}'"`，其中 `{id}` 从导航 `Tid` 或 URL 文件名解析。
- 单页栏目通常在导航节点配置固定 `tid`，所有访问该栏目的 URL 都渲染同一条记录。

### 4.5 统计与评论

前台脚本 `/scripts/cms/lgstatus.js` 负责：

- 登录状态菜单、管理员"模板编辑"入口；
- 访问量、点赞、收藏、评论的加载与交互。

服务端负责注入 `_tongji` 与占位标记：

| 标记 / 数据 | 说明 |
| --- | --- |
| `const _tongji = {...}` | 页面使用 `cms.nav` / `cms.title` 时自动输出；包含 `url`，`cms.datarow current="true"` 时还包含 `tbtag`、`tid` |
| `.uieip-tongji-view` | 单篇阅读量 |
| `.uieip-tongji-all` | 全站访问量 |
| `.uieip-tongji-list[data-type][data-link]` | 点赞 / 收藏 / 评论计数，`data-type` 逗号分隔 |
| `.uieip-tongji-comment` | 评论区容器 |

`lgstatus.js` 顶部的 `tongji_show`、`tongji_name`、`tongji_url` 控制是否启用统计及统计服务地址。不需要统计时保持默认关闭即可。

自定义页面如果没有使用 `cms.nav` / `cms.title`，就不会自动生成 `_tongji`；此时若启用统计，需要在页面内自行定义 `const _tongji = {url: "..."}`。

---

## 5. 示例页面与新增栏目

### 5.1 现有示例页面

#### 5.1.1 首页（`index.html`）

```html
<uieip type="page" value="base"/>
<uieip type="reg" value="console,cms"></uieip>
<head>
    <uieip type="file" value="inc" src="/cms/inc/pc_head_inc.html"></uieip>
    <uieip type="tmpl" value="cms.title"/>
</head>
<body>
    <uieip type="file" value="exec" src="/cms/inc/pc_topmenu_exec.html"></uieip>
    <!-- 静态区块 -->
</body>
```

首页只声明 `cms.title`，用站点信息生成标题；顶部导航由 `exec` 片段自行声明 `cms.nav`。

#### 5.1.2 列表页（`list.html`）

关键点：

- `cms.datalist` 查询 `cms_news`，`pagesize="12"`，`order="time desc"`。
- 右侧栏再用一个 `cms.datarow` 取固定 `cms_oneshot` 记录作为"作者卡片"。
- 分页用 `"/" + (data.path ? data.path + "/" : "")` 拼接，**不要**直接用 `data.url`（`page2.html` 时它是完整页面路径）。
- 无图文章才输出统计占位，避免卡片布局错位。

#### 5.1.3 详情页（`page.html`）

关键点：

- `cms.datarow` 使用 `seek="tid='{id}'"`、`order="time desc"`、`current="true"`。
- 渲染函数里先调用 `cms.title()` 覆盖标题与 SEO。
- 正文输出 `JSON.parse(data.row.body).html`。
- 输出上 / 下一条链接、统计占位、评论容器。
- 右侧用 `cms.datalist` 输出推荐列表。

#### 5.1.4 单页（`pageone.html`）

- 导航节点配置固定 `tid`，模板用 `seek="tid='{id}'"`。
- 左侧菜单由 `pc_leftmenu_exec.html` 输出当前栏目的子菜单。
- 页面正文同样来自 `body.html`。

#### 5.1.5 404（`404.html`）

- `cms.title` 手工设置标题，避免导航缺失时再次报错。
- 公共片段可设置 `cache="true" minute="2"`，缩短静态片段缓存。
- 移动端对应 `404_1.html`，与其 `index_url1`（为空则 `index_url`）同目录。

#### 5.1.6 公共片段

| 文件 | 引入方式 | 说明 |
| --- | --- | --- |
| `pc_head_inc.html` | `inc` | meta、Bootstrap、图标、站点样式 |
| `pc_footer_inc.html` | `inc` | 页脚、Bootstrap JS、`lgstatus.js`、登录 / 退出函数 |
| `pc_topmenu_exec.html` | `exec` | 顶部导航 + 用户状态，声明 `cms.nav` |
| `pc_breadcrumb_exec.html` | `exec` | 面包屑，读取 `cms.nav` |
| `pc_leftmenu_exec.html` | `exec` | 左侧菜单，读取 `cms.nav` |

### 5.2 新增栏目 / 页面

以新增"新闻资讯"栏目为例。

#### 步骤 1：准备内容表

- 在后台数据管理中登记表结构（`sys_tb` 逻辑名 + `vi_name` 物理名），或直接复用 `cms_news`。
- 至少包含 `sid`、`title`、`time`、`summary`、`img`、`body`、`tid`。

#### 步骤 2：准备模板

- 复用 `cms/list.html` / `cms/page.html`；如需独立样式，新建 `cms/news_list.html`、`cms/news_show.html`。
- 文件名使用小写。
- 列表模板检查 `dbname`、`tbname`、`pagesize`、`order`。
- 详情模板检查 `seek="tid='{id}'"`、`current="true"`。

#### 步骤 3：配置导航

在 `/adp/cms.html` 的导航树新增节点，或直接编辑 `sys_cms.navigation`：

```json
{
  "name": "新闻资讯",
  "describe": "新闻资讯",
  "path": "news",
  "blank": false,
  "list_url": "cms/news_list.html",
  "show_url": "cms/news_show.html",
  "p_title": "新闻资讯",
  "p_keywords": "新闻资讯",
  "p_describe": "新闻资讯",
  "is_del": false
}
```

#### 步骤 4：单页栏目（可选）

只展示一条固定内容时，配置 `tid`，模板用 `pageone` 类型：

```json
{
  "name": "联系我们",
  "path": "contact",
  "list_url": "cms/pageone.html",
  "tid": "fll9tno5u"
}
```

#### 步骤 5：清理缓存

- 后台点击"清理缓存"，或调用 `yqData.clearCache("cms:")`。
- 修改 `site_info` / `navigation` 后必须清理。

#### 步骤 6：验证

- `/news/`（第 1 页）
- `/news/page2.html`（第 2 页）
- `/news/{tid}.html`（详情）
- `/contact/`（单页）
- 不存在的路径应落到 404 模板。

---

## 6. 调试、缓存、排障与规范

### 6.1 调试模式

开发环境建议在 `config.json` 中开启：

```json
"websvr": {
  "debug": true,
  "timeout": 2000
}
```

效果：

- 关闭整页缓存，修改模板后刷新即可生效。
- 关闭内联 JS 压缩，便于查看生成结果。
- 关闭 `inc` 文件缓存。
- 浏览器控制台自动打印各数据模板数据（`_tmp_cms_nav`、`_tmp_div_list` 等）。
- 页面脚本不再受 `timeout` 限制。

也可以在单个页面覆盖：

```html
<uieip type="page" value="base" debug="true"></uieip>
```

注意：单页 `debug="true"` 只影响 jsvm 内部（脚本超时、内联压缩、数据注入），**不会绕过整页缓存**。开发时建议直接使用全局 `websvr/debug`。

### 6.2 缓存

| 缓存键 | 内容 | 清理方式 |
| --- | --- | --- |
| `cms:<path?query>` | 整页 HTML | `clearCache("cms:")` 或等待 `cachetime` |
| `cms:_siteinfo` | 站点信息 + 导航 | 同上 |
| `file:inc` | 被 `inc` 引入的文件内容 | 清理 `file:inc`；生产模式默认缓存，`cache="false"` 可关闭，`minute` 可指定分钟数 |

注意：

- 带查询串的 URL 会形成独立缓存键。
- 整页缓存是站点级的，登录状态、用户信息等个性化内容不要直接服务端渲染进整页，除非接受缓存共享。
- 生产模式修改页面模板后清理 `cms:` 前缀；修改 `inc` 片段还需清理 `file:inc`，无需重启。

### 6.3 常见问题

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| 输出"CMS 配置不存在" | `sys_cms.name` 与 `websvr/cms` 不一致，或库中没有该行 | 检查配置与数据 |
| 输出"site_info 字段为空" / "navigation 字段为空" / JSON 解析错误 | `site_info`、`navigation` 为空或 JSON 格式错误 | 用 JSON 校验工具检查 |
| 输出"pagesize必须为正整数" | 分页模板未设置 `pagesize` | 补 `pagesize` |
| 输出"page参数格式错误 / page参数必须为数字" | URL 写成 `pageabc.html`、`page.html` 之类 | 使用 `pageN.html`（N 从 2 开始） |
| 输出"缺少必需参数：tbname/dbname" | 模板参数拼写错误 | 检查属性 |
| 输出"查询数据失败" | 表名未在 `sys_tb` 登记、字段不存在、数据库未配置 | 检查 `sys_tb`、数据库连接、SQL |
| 列表页空白 | 查询无数据或渲染函数返回空 | 调试模式查看 `_tmp_div_list` |
| 详情页空白 | `{id}` 与记录 `tid` 不一致，或导航 `tid` 覆盖了 URL | 检查记录 `tid` 与导航配置 |
| 标题总是 404 | 当前 path 在导航中找不到 | 检查 `path` 与 URL |
| 修改导航不生效 | `cms:_siteinfo` 缓存 | 清理 `cms:` |
| 修改模板不生效 | 整页缓存 / inc 缓存 | 清理缓存或开 `debug` |
| 页面报脚本错误 | 服务端脚本异常 | 查看服务端日志与错误页堆栈，`console.log` 调试 |

### 6.4 开发规范与安全

#### 6.4.1 HTML 转义

- 渲染函数返回的是原始 HTML，框架不做自动转义。
- 标题、摘要、作者、时间等字段必须 `escapeHtml`。
- 只有后台富文本 `body.html` 与已确认可信的片段可以直接输出。

```javascript
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
```

#### 6.4.2 SQL 安全

- `where` / `seek` 是 SQL 片段，不是参数化查询。
- 禁止把 `request.param()`、Cookie、表单值拼进 `where`。
- `{id}` 来自 URL 文件名，也会原样拼入 SQL；生产环境应在前置代理 / 网关限制 HTML 路径字符，或改用 `data.query` 的参数化查询。
- 需要复杂条件时，优先用自定义服务端脚本 + `data.query(db, sql, params)`。

#### 6.4.3 服务端渲染优先

- 导航、栏目、列表、文章正文、SEO 必须服务端渲染，保证首屏与搜索引擎可抓取。
- 不要用前端 `fetch` 加载核心内容；异步接口只用于统计、评论、点赞等增强功能。

#### 6.4.4 缓存友好

- 匿名页面可放心开启整页缓存。
- 用户相关页面关闭缓存，或改为客户端渲染。
- 列表 `pagesize` 不宜过大；大字段（正文）只在详情页查询。

#### 6.4.5 模板组织

- 动态片段用 `exec`，静态片段用 `inc`；不要把 `uieip` 标签写进 `inc` 文件。
- 公共片段路径统一用 `/cms/inc/...`，避免相对路径歧义。
- 生产环境公共 `inc` 默认缓存，可用 `cache="false"` 关闭，或用 `minute` 调整缓存时间。

#### 6.4.6 脚本规范

- 以 ES5.1 为兼容基准；当前 goja 可运行 `let`、模板字符串等常用 ES6 语法，但公共模板建议保持简单。
- 服务端脚本不要做耗时操作；默认超时 2000ms。
- 调试输出使用 `console.log`，不要 `response.write` 污染页面。

---

## 相关帮助

- 模板标签基础：脚本语言/概述.md
- CMS 模板参数字典：脚本语言/网站操作.md
- 路由与特殊文件：server/服务路由规则.md
- 前台登录 / 统计 / 评论脚本：`/scripts/cms/lgstatus.js`
