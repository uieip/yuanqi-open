# 远齐低代码开发平台（UIEIP）

> 模型驱动 · 低代码 · 一体化企业应用平台
>
> 当前版本：**v1.0**（2026-10-06 定版）
>
> 本发布包：**Windows + SQLite 免费开源版**，解压即用，无需安装数据库和运行时。

[English](readme-en.md) | 中文

---

## 一、产品简介

UIEIP（远齐低代码开发平台）是一套面向企业应用的免费开源低代码平台。平台以**模型驱动**为核心，把数据建模、页面搭建、权限控制、流程编排、单点登录、门户网站、知识库与 AI 能力整合在一个可独立部署的服务中。

服务端采用 **Golang** 编写并以单文件方式发布，页面与业务逻辑使用**服务端 JavaScript（ECMAScript 5.1）** 模板引擎，前端组件库 **YQWIN-Plus** 基于 **Vue 3 + TypeScript + Element Plus** 构建。平台不依赖第三方低代码框架封装，核心引擎自主可控。

本发布包内置 **Windows x64 可执行程序 + SQLite 数据库 + 初始化数据 + 前端资源**，开箱即可体验完整后台管理与开发能力。正式版本支持多种数据库及任意操作系统，详见[开源版与正式版](#十三开源版与正式版)。

---

## 二、核心能力

| 能力 | 说明 |
| --- | --- |
| 数据引擎（建模引擎） | 通过实体、字段、枚举、外键、关系图构建数据模型，自动生成数据表与通用增删改查接口；支持树形、排序、视图、表内文件等模型能力 |
| 表单引擎 | 内置 20+ 种字段/复合组件（文本、下拉、外键、表格、树、属性、文件、HTML、Markdown、CSV、函数等），支持模板化页面与拖拽式布局 |
| 权限引擎 | 组织、部门、岗位、人员、角色、菜单、操作标识多层权限模型，可控制 UI 入口、数据范围与业务操作 |
| 流程引擎 | 可视化流程设计器，支持开始、退回、执行、判断、程序、结束、取消、注释节点；支持会签、或签、比例通过、退回、代审、待办/已办 |
| 单点登录（SSO） | 统一认证中心，支持 OAuth2、OIDC、CAS 2.0、SAML2、LDAP、远齐 SSO 兼容协议，以及微信第三方登录 |
| 门户 / CMS | 站点、栏目、导航、文章、模板管理，内置访问、点赞、收藏、评论统计 |
| 知识库与 AI | 可接入 DeepSeek、Ollama 等大模型，支持 Milvus 向量库、火山引擎/Ollama Embedding、知识库问答与业务数据结合 |
| 脚本语言 | 服务端 JavaScript（ES5.1，高级宏语言），提供 request、response、http、data、session、cache、resource 等内置对象，可在页面中直接编写业务逻辑 |
| 文件服务 | 支持数据库内存储与本地文件柜两种模式，支持图片缩放、裁剪、水印、分片上传、文件指纹 |
| 多语言 | 内置翻译管理（`sys_trans`），支持中文、英文等语言包扩展 |
| 运维管理 | 缓存管理、系统监控、统计管理、DNS、Nginx、NSQ、参数管理等服务管理功能 |
| 组件库 | YQWIN-Plus：页面框架、表单、数据表格、树、弹窗、图表（ECharts/D3/GoJS）、看板、甘特图等 |

---

## 三、技术架构

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

- 服务端：Golang，单文件发布，无外部运行时依赖
- 脚本：JavaScript（ECMAScript 5.1），页面内 `<script runat="server">` 直接执行
- 前端：YQWIN-Plus（Vue 3 + TypeScript + Element Plus）
- 数据库：本包为 SQLite；正式版支持 PostgreSQL、KingbaseES 等，更多数据库持续适配
- 缓存/会话：内存（本包默认）或 Redis
- 消息队列：NSQ（可选）
- 反向代理：Nginx（可选，推荐生产环境使用）
- 向量库：Milvus（AI 知识库可选）

---

## 四、快速开始

### 4.1 运行环境

- Windows 10 / Windows 11，或 Windows Server（x64）
- 无需安装 Go、Node.js、数据库或 Web 服务器
- 建议内存 2 GB 以上，磁盘可用空间 1 GB 以上

### 4.2 启动步骤

1. 将发布包解压到固定目录，例如：

   ```text
   D:\Spring\yuanqi-open
   ```

   > 重要：随包 `config.json` 中的站点目录、数据库、日志等均使用**绝对路径**（默认 `D:\Spring\yuanqi-open`）。如果解压到其他目录，必须先修改 `config.json` 中的相关路径，见[配置说明](#五配置说明)。

2. 进入目录并启动服务：

   ```powershell
   cd D:\Spring\yuanqi-open
   .\uieip-windows.exe
   ```

   也可以直接双击 `uieip-windows.exe`。服务默认监听 **8011** 端口。

3. 浏览器访问：

   | 入口 | 地址 |
   | --- | --- |
   | 站点首页 | http://127.0.0.1:8011/ |
   | 管理后台 | http://127.0.0.1:8011/adp/ |
   | 登录页 | http://127.0.0.1:8011/login/ |
   | 组件库示例 | http://127.0.0.1:8011/yqvue/ |

4. 使用默认账号登录：

   ```text
   用户名：spring
   密码：uieip.123
   ```

   > 首次部署后请立即修改默认密码，并替换 `config.json` 中的第三方密钥。

### 4.3 停止服务

- 前台运行时：在控制台按 `Ctrl + C`
- 后台/服务方式运行时：停止对应的 Windows 服务（见[部署与运维](#八部署与运维)）

---

## 五、配置说明

主配置文件：`config.json`；DNS 配置文件：`yqdns.json`。

### 5.1 常用配置项

| 配置项 | 说明 |
| --- | --- |
| `websvr.webtype` | 服务类型：`default` 应用站点、`cms` 网站、`sso` 单点登录 |
| `websvr.addr` | 监听端口，默认 `8011` |
| `websvr.webpath` | 站点根目录，必须指向 `web` 目录 |
| `websvr.funcpath` | 后台程序目录，默认 `web\svrfunc` |
| `websvr.debug` | 开发模式；为 `true` 时不压缩、便于调试 |
| `websvr.timeout` | 请求超时，单位毫秒 |
| `websvr.cachetime` | 静态页面缓存时间，单位分钟 |
| `websvr.checkhost` | 是否校验 Host；本地访问建议保持 `false` |
| `websvr.host` | 站点域名，部署到公网时修改为实际域名 |
| `websvr.scheme` | `http` 或 `https` |
| `websvr.zip` | 非调试模式下是否压缩输出 |
| `websvr.proxyurl` | 服务端访问外网时的代理地址（HTTP/SOCKS5） |
| `appauth.mode` | 客户端准入与签名校验：`off` 直通、`audit` 只记录、`enforce` 强制拒绝 |
| `cache.type` | 缓存类型：`memory` 或 `redis` |
| `session.type` | 会话类型：`memory` 或 `redis`；`lifeTime` 为会话时长（分钟） |
| `log.path` | 日志目录，默认 `D:\Spring\logfile` |
| `log.level` | 日志级别，默认 `0` |
| `db.lists` | 数据库列表，**第一个为系统数据库** |
| `db.yqbase.connStr` | 系统数据库连接串，本包为 SQLite 文件路径 |
| `file.lists` | 文件柜列表 |
| `file.sqlite.fsPath` | 本地文件柜存储目录，默认 `files\` |
| `power.admin` | 系统管理员用户 SID 列表 |
| `power.sso` | 统一认证中心地址、应用 ID、密钥 |
| `power.third.weixin` | 微信登录 AppID / Secret |
| `power.verif` | 短信、邮件验证码与校验配置 |
| `ai.status` | 是否启用 AI 能力 |
| `ai.model_default` | 默认大模型，如 `deepseek`、`ollama` |
| `ai.model.*` | 大模型 API Key、模型名、Base URL、超时 |
| `ai.milvusdb` | Milvus 向量库连接信息 |
| `ai.embedder` | Embedding 服务（火山引擎 / Ollama） |
| `ai.kbs` | 知识库定义：名称、集合、维度、Embedding 驱动 |
| `svradmin.dns` | 内置 DNS 服务配置 |
| `svradmin.nginx` | Nginx 安装目录 |
| `svradmin.nsq` | NSQ 地址、邮件与短信通道 |
| `svradmin.ldap` | 内置 LDAP 服务配置 |

### 5.2 迁移目录时需要修改的路径

如果发布包不在 `D:\Spring\yuanqi-open`，请同步修改：

```json
{
  "websvr": {
    "webpath": "<新目录>\\web",
    "funcpath": "<新目录>\\web\\svrfunc"
  },
  "log": { "path": "<日志目录>" },
  "db": {
    "yqbase": { "connStr": "<新目录>\\data\\yqbase.sqlite" }
  },
  "file": {
    "sqlite": {
      "connStr": "<新目录>\\files\\filedb.sqlite",
      "fsPath": "<新目录>\\files\\"
    }
  },
  "svradmin": { "dns": { "path": "<新目录>\\yqdns.json" } },
  "ai": {
    "store": "<会话目录>",
    "workspace": "<工作目录>"
  }
}
```

### 5.3 敏感配置提醒

`config.json` 中包含数据库连接、AI API Key、短信/邮件账号、微信 AppID/Secret、SSO 密钥等敏感信息。用于生产环境前请务必：

1. 修改默认管理员密码；
2. 替换为自有第三方平台密钥，并轮换已公开的测试密钥；
3. 不要将 `config.json` 提交到公开代码仓库；
4. 通过 Nginx 配置 HTTPS，并限制管理后台访问来源。

---

## 六、目录结构

```text
yuanqi-open/
├─ uieip-windows.exe      # Windows x64 服务主程序（单文件）
├─ config.json            # 主配置文件（端口、站点、数据库、日志、AI、SSO 等）
├─ yqdns.json             # 内置 DNS 服务配置
├─ data/
│  └─ yqbase.sqlite       # 系统数据库（模型、菜单、用户、权限、流程、CMS 等）
├─ files/
│  ├─ filedb.sqlite       # 文件柜元数据
│  └─ YYYY/M/             # 本地文件存储目录（按年月归档）
└─ web/                   # 站点根目录
   ├─ index.html          # 站点首页（开发测试导航）
   ├─ adp/                # 管理后台页面（数据、菜单、权限、流程、服务管理等）
   ├─ login/              # 登录、登出、单点登录页面
   ├─ account/            # 个人中心、访问/点赞/收藏/评论统计
   ├─ cms/                # 门户网站模板与页面
   ├─ api/                # API 接口目录（请求 .json，程序为同名 .html）
   ├─ jsvm/               # 服务端脚本示例与模板引擎测试
   ├─ yqvue/              # YQWIN-Plus 组件库（UMD 与示例）
   ├─ scripts/            # 前端依赖：Vue、Element Plus、ECharts、D3、GoJS 等
   ├─ images/ icon/       # 站点图片与图标
   ├─ svrfunc/            # 服务端功能程序目录
   └─ document/           # 产品与开发文档（Markdown）
```

---

## 七、服务路由与模板引擎

### 7.1 路由约定

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

图片参数：`w` 宽、`h` 高、`t` 缩放方式（`a` 拉伸、`w` 按宽、`h` 按高、`c` 裁剪）、`m` 水印位置（`1` 右下、`2` 左下、`3` 左上、`4` 右上、`5` 居中，`0` 不加水印）。

### 7.2 模板指令

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

服务端脚本内置对象：`request`、`response`、`http`、`console`；按需加载 `data`（数据库）、`session`、`cache`、`resource`、`login`、`cms` 等模块。

### 7.3 API 示例

`web/api/hello.html`：

```html
<uieip type="page" value="base"></uieip>
<script runat="server">
    response.contentType("application/json");
    response.write(JSON.stringify({ error: 0, info: "hello uieip" }));
</script>
```

访问 `/api/hello.json` 即可获得 JSON 响应。

---

## 八、部署与运维

### 8.1 注册为 Windows 服务

推荐使用 NSSM：

```powershell
nssm install uieip "D:\Spring\yuanqi-open\uieip-windows.exe"
nssm set uieip AppDirectory "D:\Spring\yuanqi-open"
nssm set uieip DisplayName "UIEIP Service"
nssm set uieip Start SERVICE_AUTO_START
nssm start uieip
```

常用命令：

```powershell
nssm stop uieip
nssm restart uieip
nssm remove uieip confirm
```

### 8.2 Nginx 反向代理

生产环境建议在 UIEIP 前增加 Nginx，负责域名、HTTPS、上传大小限制与真实 IP 透传：

```nginx
upstream uieip {
    server 127.0.0.1:8011 weight=1 fail_timeout=5s max_fails=3;
}

server {
    listen 80;
    server_name your.domain.com;

    client_max_body_size 1024m;

    location / {
        proxy_pass http://uieip;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Scheme $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 系统监控等功能使用 WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 600s;
    }
}
```

### 8.3 日志与监控

- 日志目录：`log.path`（默认 `D:\Spring\logfile`）
- 日志级别：DEBUG < INFO < WARNING < ERROR < CRITICAL，默认记录 WARNING 及以上
- 管理后台：**服务管理 → 系统监控 / 缓存管理 / 统计管理**
- 页面脚本中的 `console.log()` 输出到服务端日志

### 8.4 端口与防火墙

- 默认端口：`8011`
- 如需局域网访问，请在 Windows 防火墙入站规则中放行对应 TCP 端口
- 修改端口：调整 `config.json` 中 `websvr.addr` 后重启服务

---

## 九、工作流

工作流采用“点 + 线”的状态机模型：

| 节点 | 说明 |
| --- | --- |
| Start | 开始节点，发起流程 |
| Return | 退回节点，回到指定状态 |
| Exec | 执行/审批节点，支持指定人员、岗位、部门+职位、发起人部门+职位、代码获取人员 |
| Judge | 判断节点，按出线表达式决定分支 |
| Proc | 程序节点，调用接口或消息 |
| End | 结束节点 |
| Cancle | 取消节点 |
| Comment | 画布注释，不参与流转 |

执行节点支持：

- 通过方式：单人审批、最小通过人数、最小通过百分比、全部通过
- 人员变更、自动审批、代审
- 退回次数统计、全局参数、提交记录
- 待办、已办、我的流程

工作流运行数据保存在 `wf_info`、`wf_json`、`wf_todo`、`wf_comp`，业务表状态字段由流程版本配置自动回写。

---

## 十、单点登录与安全

### 10.1 支持的认证方式

- 本地账号密码登录
- 图形验证码
- 短信验证码、邮件验证码
- 微信第三方登录（公众号内授权 / 开放平台扫码）
- 标准协议：OAuth2、OIDC、CAS 2.0、SAML2
- LDAP（Bind/Search）
- 远齐 SSO 兼容协议

### 10.2 密码存储

采用 OpenLDAP 兼容的加盐哈希格式：

```text
{算法}Hash(密码 + 服务端盐) + 服务端盐
```

支持 `SHA1`、`SHA256`、`SHA512`、`YUANQI` 兼容模式。客户端可先哈希再传输，结合一次性客户端盐防止重放。

### 10.3 安全建议

1. 修改默认账号 `spring` 的密码，或新建管理员后停用默认账号
2. 启用 HTTPS，避免密码与令牌明文传输
3. 将 `appauth.mode` 设置为 `enforce`（本包默认），按需配置可信站点与 IP 白名单
4. 妥善保管 `config.json`，定期轮换第三方密钥
5. 管理后台限制内网或指定 IP 访问
6. 定期备份 `data` 与 `files`，并验证恢复流程
7. 生产环境关闭 `websvr.debug`

---

## 十一、AI 与知识库

平台内置 AI 接入层，可将大模型与业务数据、知识库结合：

- 大模型：DeepSeek、Ollama，可扩展其他 OpenAI 兼容接口
- 向量库：Milvus
- Embedding：火山引擎、Ollama
- 知识库：在 `ai.kbs` 中定义知识库、集合、维度与 Embedding 驱动
- 数据集：菜单“界面数据”可配置 `kbs_params`，将业务表内容同步到知识库
- 管理入口：**系统管理 → 知识库管理**
- AI 聊天：`web/adp/ai-chat.html`

本发布包默认 `ai.status = false`。启用前请配置好模型、Embedding、Milvus，并替换示例 API Key。

---

## 十二、功能入口速查

| 功能 | 路径 |
| --- | --- |
| 管理后台首页 | `/adp/` |
| 数据管理 | `/adp/data.html` |
| 字段/模型配置 | `/adp/fields.html` |
| 菜单管理 | `/adp/menu.html` |
| 门户管理 | `/adp/cms.html` |
| 文件管理 | `/adp/file.html` |
| 系统参数 | `/adp/param.html` |
| 知识库管理 | `/adp/bikbs.html` |
| 流程管理 | `/adp/wfedit.html` |
| 我的流程 / 待办 / 已办 | `/adp/wf_my.html`、`/adp/wf_todo.html`、`/adp/wf_comp.html` |
| 部门 / 岗位 / 人员 | `/adp/hr_org.html`、`/adp/hr_post.html`、`/adp/hr_user.html` |
| 权限管理 | `/adp/roles.html` |
| 应用管理 / 许可管理 | `/adp/app.html`、`/adp/license.html` |
| 服务管理 | `/adp/svradmin/`（缓存、监控、统计、DNS、Nginx、NSQ、参数） |
| 翻译管理 | `/adp/translist.html` |
| 个人中心 | `/account/` |
| 组件库 | `/yqvue/` |
| 服务端脚本测试 | `/jsvm/` |
| API 示例 | `/api/hello.json` |

---

## 十三、开源版与正式版

| 对比项 | 开源免费版（本发布包） | 正式版 |
| --- | --- | --- |
| 操作系统 | Windows x64 | Windows / Linux / macOS 等 |
| 数据库 | SQLite | 多种数据库，已支持 SQLite、PostgreSQL、KingbaseES，持续适配 MySQL、openGauss、GaussDB、OceanBase、TiDB 等 |
| 部署形态 | 单文件、解压即用 | 可服务化、容器化部署 |
| 适用场景 | 学习体验、原型验证、中小企业轻量应用 | 生产环境、企业级应用、国产化环境 |
| 技术支持 | 社区 | 按授权提供 |

平台目标：

- 服务端跨平台部署，可运行于 Linux、Windows Server、macOS
- 支持主流数据库与国产数据库
- 兼顾物联网设备嵌入与管理支撑平台
- 核心架构开源或自研，自主可控

> 本发布包为免费开源运行包；正式版的多数据库、跨平台与增强能力以实际发布/授权为准。

---

## 十四、文档索引

产品与开发文档位于 `web/document/`：

| 文档 | 路径 |
| --- | --- |
| 产品概述 | [web/readme.md](web/readme.md) |
| 更新记录 | [web/document/note.md](web/document/note.md) |
| 服务端概述与编译 | [web/document/server/概述.md](web/document/server/概述.md) |
| 安装配置 | [web/document/server/安装配置.md](web/document/server/安装配置.md) |
| 服务安装（Docker/Redis/Nginx/NSQ/FRP/DNS/NSSM） | [web/document/server/服务安装.md](web/document/server/服务安装.md) |
| 服务路由规则 | [web/document/server/服务路由规则.md](web/document/server/服务路由规则.md) |
| 工作流 | [web/document/server/工作流.md](web/document/server/工作流.md) |
| 日志管理 | [web/document/server/日志管理.md](web/document/server/日志管理.md) |
| 系统架构 | [web/document/系统架构/概述.md](web/document/系统架构/概述.md) |
| 用户登录与密码 | [web/document/系统架构/用户登录.md](web/document/系统架构/用户登录.md) |
| 组件类型 | [web/document/系统架构/组件类型.md](web/document/系统架构/组件类型.md) |
| 文件存储 | [web/document/系统架构/文件.md](web/document/系统架构/文件.md) |
| 数据库概述 | [web/document/数据库/概述.md](web/document/数据库/概述.md) |
| 数据库脚本程序 | [web/document/数据库/脚本程序.md](web/document/数据库/脚本程序.md) |
| 单点登录概述 | [web/document/单点登录/概述.md](web/document/单点登录/概述.md) |
| OAuth2 / OIDC / CAS / LDAP / SAML | `web/document/单点登录/` |
| WEB 框架 | [web/document/WEB框架/概述.md](web/document/WEB框架/概述.md) |
| 脚本语言 | [web/document/脚本语言/概述.md](web/document/脚本语言/概述.md) |
| AI 与知识库笔记 | `web/document/笔记/AI/` |
| BI 笔记 | `web/document/笔记/BI/` |

---

## 十五、常见问题

**Q1：启动后浏览器无法访问？**

1. 在 PowerShell 中进入安装目录运行 `.\uieip-windows.exe`，查看控制台是否有报错；
2. 确认 `uieip-windows.exe` 已正常运行且未关闭；
3. 确认访问地址为 `http://127.0.0.1:8011/`；
4. 检查 8011 端口是否被占用：`netstat -ano | findstr 8011`；
5. 检查 Windows 防火墙是否放行；
6. 若修改过目录，检查 `config.json` 的 `webpath`、`db.connStr` 等绝对路径是否正确。

**Q2：端口被占用怎么办？**

修改 `config.json` 中 `websvr.addr`（如 `8020`）后重启服务，并同步调整 Nginx 反向代理端口。

**Q3：换了目录后页面 404 或数据库打不开？**

`config.json` 默认使用 `D:\Spring\yuanqi-open` 绝对路径。迁移后请按[迁移目录时需要修改的路径](#52-迁移目录时需要修改的路径)逐项修改。

**Q4：默认账号是什么？如何修改密码？**

默认账号 `spring`，密码 `uieip.123`。登录后进入**修改密码**页面，或由管理员在人员管理中重置。若系统开启首次登录改密策略，新用户首次登录会被要求修改密码。

**Q5：上传大文件失败？**

检查 Nginx 的 `client_max_body_size`，并确认磁盘空间充足。文件默认保存在 `files\` 下，元数据在 `files\filedb.sqlite`。

**Q6：如何接入 MySQL / PostgreSQL？**

本包仅内置 SQLite 驱动与初始化库。正式版提供 PostgreSQL、KingbaseES 等数据库支持，并可按数据库类型生成建表脚本与存储过程/脚本程序。

**Q7：如何启用 HTTPS？**

在 Nginx 上配置证书并反向代理到 `127.0.0.1:8011`，同时将 `config.json` 中 `websvr.scheme` 改为 `https`、`websvr.host` 改为实际域名。

**Q8：系统监控页面 WebSocket 报错？**

Nginx 需开启 WebSocket 支持：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Q9：日志在哪里？**

默认 `D:\Spring\logfile`，由 `log.path` 配置。页面脚本中的 `console.log()` 会写入服务端日志。

**Q10：数据如何备份和恢复？**

停止服务后备份 `data\`、`files\` 和 `config.json`；恢复时覆盖回原目录并启动服务即可。

---

## 十六、版本历史

| 日期 | 内容 |
| --- | --- |
| 2026-10-06 | 定版 1.0 |
| 2026-09-20 | 重构 login、SSO 程序；数据目录表与字段获取增加缓存 |
| 2026-04-17 | Vue + Element Plus 前端完成 v1.0.0 |
| 2025-10-05 | Excel 导出支持表格合并（`yq.datagrid.js`、`yq.data.js`） |
| 2025-09-01 | 新增创建用户、设置初始密码、首次登录修改密码 |
| 2025-08-15 | 完善单点登录，支持 OAuth2、OIDC、CAS、LDAP |
| 2025-02-01 | `hr_org_user_rel` 增加次要部门字段 |
| 2024-11-17 | 第三方账号登录接口及微信登录实例 |
| 2024-10-08 | 开始记录更新历史 |

### 规划中

- 更多数据库适配（MySQL、openGauss、GaussDB、OceanBase、TiDB 等）
- 多因素认证（MFA）
- 外部 AD / HR 目录自动同步
- 流程引擎持续完善
- 移动端适配与更多行业模板

---

## 十七、开源与致谢

UIEIP 为免费开源项目，致力于构建自主可控的低代码与企业管理支撑平台。欢迎通过 Issue、文档修订、模板与组件贡献等方式参与共建。

> 使用前请阅读并遵守项目发布说明中的授权条款；第三方组件（Vue、Element Plus、ECharts、D3.js、GoJS、TinyMCE、Marked 等）遵循其各自许可证。详见[免责声明](#十八免责声明)。

---

## 十八、免责声明

1. **软件按“现状”提供。** 本项目不对软件的完整性、准确性、可靠性、适用性或无中断运行作出任何明示或默示担保。因使用或无法使用本软件产生的任何直接或间接损失，项目作者及贡献者不承担赔偿责任。

2. **第三方组件需使用者自行申请授权。** 本平台使用了 Vue、Element Plus、ECharts、D3.js、GoJS、TinyMCE、Marked、jQuery、Bootstrap、Ace、Sortable、vuedraggable 等第三方组件，其版权归各自作者或公司所有，并遵循各自的许可证。使用者应自行查阅并遵守相应许可条款；对于需要商业授权、注册、付费或申请 Key 的组件（如 GoJS、TinyMCE 商业版等），**由使用者自行向权利人申请、购买并获取授权**，本项目不代为申请，亦不承担相关费用与责任。

3. **第三方服务需自行开通。** 微信登录、短信、邮件、DeepSeek/Ollama 等 AI 模型、Embedding、Milvus、对象存储等外部服务，均需使用者自行注册账号、申请 AppID/API Key、完成实名或企业认证，并自行承担服务费用与合规责任。`config.json` 中的示例密钥仅用于本地演示，不得用于生产环境。

4. **数据与安全责任。** 使用者应自行负责数据备份、账号与权限配置、网络安全防护、等级保护及行业合规、内容合法性审查。因配置不当、密钥泄露、误删除、数据丢失、业务中断、网络攻击等造成的损失，本项目不承担责任。

5. **二次开发与再分发。** 使用者对软件进行修改、二次开发或再分发时，应自行确保不侵犯第三方知识产权，保留必要的版权与许可声明，并独立承担由此产生的法律责任。

6. **使用即视为同意。** 下载、安装、部署或以其他方式使用本项目，即表示您已阅读、理解并同意本免责声明；如不同意，请停止使用并删除本软件及相关文件。

> 本免责声明不构成法律意见。涉及商业授权、数据合规等事项，请咨询专业法律顾问。

---

**默认登录信息**

```text
地址：http://127.0.0.1:8011/
账号：spring
密码：uieip.123
```