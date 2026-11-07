# 技术架构

## 分层结构

```text
┌──────────────────────────────────────────────────────────┐
│                       浏览器 / 移动端                      │
│   YQWIN-Plus（Vue3 + TypeScript + Element Plus）/ HTML    │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP / JSON / 文件请求
┌───────────────────────────▼──────────────────────────────┐
│                 uieip 服务（Go 单文件可执行）               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│  │ 路由/静态   │ │ 模板与脚本  │ │ 数据引擎    │ │ 权限/SSO│ │
│  │ 服务       │ │ 引擎(ES5.1)│ │ 通用接口    │ │ 引擎    │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│  │ 文件服务    │ │ 流程引擎    │ │ 缓存/会话   │ │ 日志/监控│ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
└───────────┬───────────────────────────────┬──────────────┘
            │                               │
   ┌─────────────────────┐              ┌────────────────┐
   │ SQLite（本包）       │              │ 本地文件柜      │
   │ data/yqbase.sqlite  │              │ files/          │
   └─────────────────────┘              └────────────────┘
```

## 技术栈

| 层次 | 选型 |
| --- | --- |
| 服务端 | Golang，单文件发布，无外部运行时依赖 |
| 页面与业务逻辑 | 服务端 JavaScript（ECMAScript 5.1），页面内 `<script runat="server">` 直接执行 |
| 前端组件库 | YQWIN-Plus（Vue 3 + TypeScript + Element Plus） |
| 数据库 | 本包为 SQLite；正式版支持 PostgreSQL、KingbaseES 等 |
| 缓存 / 会话 | 内存（本包默认）或 Redis |
| 消息队列 | NSQ（可选） |
| 反向代理 | Nginx（可选，生产推荐） |
| 向量库 | Milvus（AI 知识库可选） |

平台不依赖第三方低代码框架封装，核心引擎自研，便于私有化与国产化环境落地。

## 核心引擎

| 引擎 | 职责 |
| --- | --- |
| 数据引擎（建模引擎） | 实体、字段、枚举、外键、关系图构建模型，自动生成数据表与通用增删改查接口；支持树形、排序、视图、表内文件 |
| 表单引擎 | 20+ 字段/复合组件（文本、下拉、外键、表格、树、属性、文件、HTML、Markdown、CSV、函数等），模板化页面与拖拽布局 |
| 权限引擎 | 组织、部门、岗位、人员、角色、菜单、操作标识多层模型，控制 UI 入口、数据范围与业务操作 |
| 流程引擎 | “点 + 线”状态机，支持开始、退回、执行、判断、程序、结束、取消、注释节点 |
| 认证引擎 | 本地账号、验证码、微信登录、OAuth2 / OIDC / CAS 2.0 / SAML2 / LDAP、远齐 SSO 兼容协议 |
| 文件服务 | 数据库内存储与本地文件柜两种模式，图片缩放、裁剪、水印、分片上传、文件指纹 |
| AI 接入层 | 大模型（DeepSeek / Ollama / OpenAI 兼容）、Milvus 向量库、Embedding、知识库问答 |

## 请求生命周期

1. 请求进入 `uieip` 服务，按路由规则匹配（见下节）。
2. 命中模板文件时，先执行页面上的服务端脚本（`<script runat="server">`）。
3. 模板指令 `<uieip type="page" value="login">` 完成登录校验，`type="reg"` 按需加载内置模块（`data`、`session`、`cache` 等）。
4. 脚本通过 `data`、`http`、`file` 等对象访问数据库与外部服务，输出 JSON 或渲染 HTML。
5. 静态资源与图片请求走静态服务 / 图片处理链路；缓存结果按 `cachetime` 控制。

## 路由约定

| 标识 / 路径 | 用途 | 示例 |
| --- | --- | --- |
| `_文件名.html` | handler 目录程序文件（POST/GET 处理） | `/_hello.html` |
| `!数据库_SID.扩展名` | 数据库内文件 | `/!yqbase_7f9aa457-....jpg` |
| `^文件柜_SID.扩展名` | 文件柜文件 | `/^sqlite_a4a29bc5-....png` |
| `@文件柜_SID.扩展名` | 文件柜图片（支持水印/缩放） | `/@sqlite_a4a29bc5-....png?w=300&h=200&t=c&m=1` |
| `` `文件名.js/css `` | 经服务端处理的 js/css | 请求 `` /cn/js/`area.js ``，后台文件为 `` js/`area.html `` |
| `api/*.json` | API 接口，对应 `api/*.html` 程序 | `/api/hello.json` |
| `*.html` | 模板文件 | `/cms/index.html` |
| 其他 | 静态文件 | `/scripts/...` |

图片参数：`w` 宽、`h` 高、`t` 缩放方式（`a` 拉伸、`w` 按宽、`h` 按高、`c` 裁剪）、`m` 水印位置（`1` 右下、`2` 左下、`3` 左上、`4` 右上、`5` 居中、`0` 不加水印）。

## 模板与脚本

```html
<!-- 页面初始化：base 基础模式；login 登录校验 -->
<uieip type="page" value="base"></uieip>
<uieip type="page" value="login" debug="true" timeout="5000"></uieip>

<!-- 加载内置函数模块 -->
<uieip type="reg" value="console,login,session"></uieip>

<!-- 加载文件：inc / exec / js / css / jsvm / code -->
<uieip type="file" value="inc" src="/scripts/yqwin_inc.txt" cache="true" minute="1440"></uieip>

<!-- 模板片段，可指定 js 函数处理数据 -->
<uieip id="nav" type="tmpl" value="cms.nav" js="bootstrap"></uieip>

<!-- 服务端脚本 -->
<script runat="server">
    var url = request.url();
    var ip = request.ip();
</script>

<!-- 输出变量 -->
<p><uieip>url</uieip></p>
```

内置对象：`request`、`response`、`http`、`console`；按需加载 `data`（数据库）、`session`、`cache`、`resource`、`login`、`cms` 等模块。

### API 示例

`web/api/hello.html`：

```html
<uieip type="page" value="base"></uieip>
<script runat="server">
    response.contentType("application/json");
    response.write(JSON.stringify({ error: 0, info: "hello uieip" }));
</script>
```

访问 `/api/hello.json` 即可获得 JSON 响应。

## 扩展点

| 扩展点 | 方式 |
| --- | --- |
| 业务接口 | 在 `web/api/` 新增 `xxx.html`，以服务端脚本返回 JSON |
| 页面逻辑 | 模板内嵌 `<script runat="server">`，或用 `` `xxx.js `` 走服务端处理 |
| 数据模型 | 后台建模引擎配置实体/字段，自动生成表与接口 |
| 前端组件 | 基于 YQWIN-Plus 扩展自有组件库 |
| 第三方登录 | 在统一认证中心配置 OAuth2 / OIDC / CAS / SAML / LDAP |
| 部署形态 | 单二进制 + Nginx / Windows 服务 / 容器化（正式版） |

## 相关文档

- 服务端概述与编译：`web/document/server/概述.md`
- 服务路由规则：`web/document/server/服务路由规则.md`
- WEB 框架：`web/document/WEB框架/概述.md`
- 脚本语言：`web/document/脚本语言/概述.md`
- 数据库：`web/document/数据库/概述.md`
