# Yuanqi Low-Code Development Platform (UIEIP)

> Model-driven · Low-code · Integrated enterprise application platform
>
> Current version: **v1.0** (finalized on 2026-10-06)
>
> This release: **Windows + SQLite free open-source edition**, ready to run after extraction, with no database or runtime installation required.

English | [中文](readme.md)

---

## 1. Product Overview

UIEIP (Yuanqi Low-Code Development Platform) is a free open-source low-code platform for enterprise applications. Built around a **model-driven** core, it integrates data modeling, page building, permission control, workflow orchestration, single sign-on, portal/CMS, knowledge base, and AI capabilities into a single independently deployable service.

The server is written in **Golang** and shipped as a single binary. Pages and business logic use a **server-side JavaScript (ECMAScript 5.1)** template engine, while the front-end component library **YQWIN-Plus** is built on **Vue 3 + TypeScript + Element Plus**. The platform is not a wrapper around a third-party low-code framework; its core engines are self-developed and controllable.

This release includes a **Windows x64 executable + SQLite database + initial data + front-end assets**, so you can experience the full administration and development capabilities out of the box. The official edition supports multiple databases and any operating system. See [Open-Source Edition vs Official Edition](#13-open-source-edition-vs-official-edition).

---

## 2. Core Capabilities

| Capability | Description |
| --- | --- |
| Data engine (modeling engine) | Build data models from entities, fields, enumerations, foreign keys, and relationship diagrams; automatically generate tables and generic CRUD APIs; supports tree, sort, view, and in-table file models |
| Form engine | 20+ field and composite components (text, select, foreign key, grid, tree, properties, file, HTML, Markdown, CSV, function, etc.); template-based pages and drag-and-drop layouts |
| Permission engine | Multi-layer permission model covering organizations, departments, positions, users, roles, menus, and operation marks; controls UI entries, data scope, and business operations |
| Workflow engine | Visual workflow designer with Start, Return, Exec, Judge, Proc, End, Cancel, and Comment nodes; supports countersign (all-approve), or-sign (any-approve), percentage approval, return, delegated approval, To-Do / Done |
| Single sign-on (SSO) | Central authentication service supporting OAuth2, OIDC, CAS 2.0, SAML2, LDAP, the Yuanqi SSO compatible protocol, and WeChat third-party login |
| Portal / CMS | Sites, categories, navigation, articles, and templates, with built-in view, like, favorite, and comment statistics |
| Knowledge base and AI | Connects to DeepSeek, Ollama, and other LLMs; supports Milvus vector database, Volcengine/Ollama Embedding, knowledge-base Q&A, and integration with business data |
| Scripting language | Server-side JavaScript (ES5.1, advanced macro language) with built-in objects such as request, response, http, data, session, cache, and resource; write business logic directly in pages |
| File service | Database storage and local file-cabinet modes; image resize, crop, watermark, chunked upload, and file fingerprint |
| Multi-language | Built-in translation management (`sys_trans`); extensible language packs including Chinese and English |
| Operations management | Cache management, system monitoring, statistics, DNS, Nginx, NSQ, parameters, and other service-management functions |
| Component library | YQWIN-Plus: page framework, forms, data grids, trees, dialogs, charts (ECharts/D3/GoJS), Kanban, Gantt charts, and more |

---

## 3. Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                      Browser / Mobile                    │
│   YQWIN-Plus (Vue 3 + TypeScript + Element Plus) / HTML  │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP / JSON / File requests
┌───────────────────────────▼──────────────────────────────┐
│              uieip service (single Go binary)            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│  │ Routing /  │ │ Template & │ │ Data       │ │ Auth /  │ │
│  │ Static     │ │ Script     │ │ Engine     │ │ SSO     │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│  │ File       │ │ Workflow   │ │ Cache /    │ │ Logging │ │
│  │ Service    │ │ Engine     │ │ Session    │ │ Monitor │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
└───────────┬───────────────────────────────┬──────────────┘
            │                               │
   ┌─────────────────────┐              ┌────────────────┐
   │ SQLite (this pack)  │              │ Local file     │
   │ data/yqbase.sqlite  │              │ cabinet files/ │
   └─────────────────────┘              └────────────────┘
```

- Server: Golang, single binary, no external runtime dependencies
- Scripting: JavaScript (ECMAScript 5.1); `<script runat="server">` executes directly in pages
- Front end: YQWIN-Plus (Vue 3 + TypeScript + Element Plus)
- Database: SQLite in this pack; the official edition supports PostgreSQL, KingbaseES, and others, with more databases being adapted
- Cache / session: in-memory (default in this pack) or Redis
- Message queue: NSQ (optional)
- Reverse proxy: Nginx (optional, recommended for production)
- Vector database: Milvus (optional for AI knowledge bases)

---

## 4. Quick Start

### 4.1 Requirements

- Windows 10 / Windows 11, or Windows Server (x64)
- No need to install Go, Node.js, a database, or a web server
- Recommended: 2 GB RAM or more, 1 GB free disk space or more

### 4.2 Startup

1. Extract the release package to a fixed directory, for example:

   ```text
   D:\Spring\yuanqi-open
   ```

   > Important: `config.json` uses **absolute paths** for the site directory, database, logs, and other resources (defaulting to `D:\Spring\yuanqi-open`). If you extract the package elsewhere, update the relevant paths in `config.json` first. See [Configuration](#5-configuration).

2. Enter the directory and start the service:

   ```powershell
   cd D:\Spring\yuanqi-open
   .\uieip-windows.exe
   ```

   You can also double-click `uieip-windows.exe`. The service listens on port **8011** by default.

3. Open a browser:

   | Entry | URL |
   | --- | --- |
   | Site home | http://127.0.0.1:8011/ |
   | Admin console | http://127.0.0.1:8011/adp/ |
   | Login page | http://127.0.0.1:8011/login/ |
   | Component library examples | http://127.0.0.1:8011/yqvue/ |

4. Log in with the default account:

   ```text
   Username: spring
   Password: uieip.123
   ```

   > Change the default password immediately after the first deployment, and replace the third-party keys in `config.json`.

### 4.3 Stopping the Service

- Running in the foreground: press `Ctrl + C` in the console
- Running in the background or as a Windows service: stop the corresponding Windows service (see [Deployment and Operations](#8-deployment-and-operations))

---

## 5. Configuration

Main configuration file: `config.json`; DNS configuration file: `yqdns.json`.

### 5.1 Common Settings

| Setting | Description |
| --- | --- |
| `websvr.webtype` | Service type: `default` application site, `cms` website, `sso` single sign-on |
| `websvr.addr` | Listening port, default `8011` |
| `websvr.webpath` | Site root directory; must point to the `web` directory |
| `websvr.funcpath` | Backend program directory, default `web\svrfunc` |
| `websvr.debug` | Development mode; when `true`, output is not compressed, which is convenient for debugging |
| `websvr.timeout` | Request timeout in milliseconds |
| `websvr.cachetime` | Static page cache time in minutes |
| `websvr.checkhost` | Whether to validate the Host header; keep `false` for local access |
| `websvr.host` | Site domain name; change it to the actual domain for public deployment |
| `websvr.scheme` | `http` or `https` |
| `websvr.zip` | Whether to compress output when not in debug mode |
| `websvr.proxyurl` | Proxy address for outbound requests from the server (HTTP/SOCKS5) |
| `appauth.mode` | Client admission and signature validation: `off` (pass-through), `audit` (log only), `enforce` (reject) |
| `cache.type` | Cache type: `memory` or `redis` |
| `session.type` | Session type: `memory` or `redis`; `lifeTime` is the session duration in minutes |
| `log.path` | Log directory, default `D:\Spring\logfile` |
| `log.level` | Log level, default `0` |
| `db.lists` | Database list; **the first entry is the system database** |
| `db.yqbase.connStr` | System database connection string; a SQLite file path in this pack |
| `file.lists` | File cabinet list |
| `file.sqlite.fsPath` | Local file cabinet storage directory, default `files\` |
| `power.admin` | List of system administrator user SIDs |
| `power.sso` | Central authentication service URL, application ID, and secret |
| `power.third.weixin` | WeChat login AppID / Secret |
| `power.verif` | SMS and email verification code settings |
| `ai.status` | Whether to enable AI capabilities |
| `ai.model_default` | Default LLM, such as `deepseek` or `ollama` |
| `ai.model.*` | LLM API key, model name, base URL, and timeout |
| `ai.milvusdb` | Milvus vector database connection settings |
| `ai.embedder` | Embedding service (Volcengine / Ollama) |
| `ai.kbs` | Knowledge base definitions: name, collection, dimension, and embedding driver |
| `svradmin.dns` | Built-in DNS service settings |
| `svradmin.nginx` | Nginx installation directory |
| `svradmin.nsq` | NSQ addresses, email, and SMS channels |
| `svradmin.ldap` | Built-in LDAP service settings |

### 5.2 Paths to Update When Relocating the Installation

If the release package is not located at `D:\Spring\yuanqi-open`, update the following paths:

```json
{
  "websvr": {
    "webpath": "<new-dir>\\web",
    "funcpath": "<new-dir>\\web\\svrfunc"
  },
  "log": { "path": "<log-dir>" },
  "db": {
    "yqbase": { "connStr": "<new-dir>\\data\\yqbase.sqlite" }
  },
  "file": {
    "sqlite": {
      "connStr": "<new-dir>\\files\\filedb.sqlite",
      "fsPath": "<new-dir>\\files\\"
    }
  },
  "svradmin": { "dns": { "path": "<new-dir>\\yqdns.json" } },
  "ai": {
    "store": "<session-dir>",
    "workspace": "<workspace-dir>"
  }
}
```

### 5.3 Sensitive Configuration

`config.json` contains sensitive information such as database connections, AI API keys, SMS/email accounts, WeChat AppID/Secret, and SSO secrets. Before using it in production:

1. Change the default administrator password;
2. Replace third-party keys with your own and rotate any test keys that have been exposed;
3. Do not commit `config.json` to a public code repository;
4. Configure HTTPS through Nginx and restrict access to the admin console.

---

## 6. Directory Structure

```text
yuanqi-open/
├─ uieip-windows.exe      # Windows x64 main service executable (single file)
├─ config.json            # Main configuration (port, site, database, logs, AI, SSO, etc.)
├─ yqdns.json             # Built-in DNS service configuration
├─ data/
│  └─ yqbase.sqlite       # System database (models, menus, users, permissions, workflows, CMS, etc.)
├─ files/
│  ├─ filedb.sqlite       # File cabinet metadata
│  └─ YYYY/M/             # Local file storage (archived by year and month)
└─ web/                   # Site root directory
   ├─ index.html          # Site home (development and test navigation)
   ├─ adp/                # Admin console (data, menus, permissions, workflows, service management, etc.)
   ├─ login/              # Login, logout, and SSO pages
   ├─ account/            # Account center, view/like/favorite/comment statistics
   ├─ cms/                # Portal templates and pages
   ├─ api/                # API directory (request .json; the program is the same-named .html)
   ├─ jsvm/               # Server-side script examples and template engine tests
   ├─ yqvue/              # YQWIN-Plus component library (UMD and examples)
   ├─ scripts/            # Front-end dependencies: Vue, Element Plus, ECharts, D3, GoJS, etc.
   ├─ images/ icon/       # Site images and icons
   ├─ svrfunc/            # Server-side function programs
   └─ document/           # Product and development documentation (Markdown)
```

---

## 7. Routing and Template Engine

### 7.1 Route Conventions

| Mark / path | Purpose | Example |
| --- | --- | --- |
| `_file.html` | Handler program file (POST/GET processing) | `/_hello.html` |
| `!database_SID.ext` | File stored in the database | `/!yqbase_7f9aa457-....jpg` |
| `^cabinet_SID.ext` | File cabinet file | `/^sqlite_a4a29bc5-....png` |
| `@cabinet_SID.ext` | File cabinet image (watermark/resize supported) | `/@sqlite_a4a29bc5-....png?w=300&h=200&t=c&m=1` |
| `` `file.js/css `` | Server-processed JS/CSS | Request `` /cn/js/`area.js ``, backed by `` js/`area.html `` |
| `api/*.json` | API endpoint, mapped to the `api/*.html` program | `/api/hello.json` |
| `*.html` | Template file | `/cms/index.html` |
| Others | Static files | `/scripts/...` |

Image parameters: `w` width, `h` height, `t` resize mode (`a` stretch, `w` by width, `h` by height, `c` crop), `m` watermark position (`1` bottom-right, `2` bottom-left, `3` top-left, `4` top-right, `5` center, `0` no watermark).

### 7.2 Template Directives

```html
<!-- Page initialization: base = basic mode; login = login validation -->
<uieip type="page" value="base"></uieip>
<uieip type="page" value="login" debug="true" timeout="5000"></uieip>

<!-- Load built-in function modules -->
<uieip type="reg" value="console,login,session"></uieip>

<!-- Load files: inc / exec / js / css / jsvm / code -->
<uieip type="file" value="inc" src="/scripts/yqwin_inc.txt" cache="true" minute="1440"></uieip>

<!-- Template fragment with an optional JS data handler -->
<uieip id="nav" type="tmpl" value="cms.nav" js="bootstrap"></uieip>

<!-- Server-side script -->
<script runat="server">
    var url = request.url();
    var ip = request.ip();
</script>

<!-- Output a variable -->
<p><uieip>url</uieip></p>
```

Built-in server-side script objects: `request`, `response`, `http`, and `console`. Modules such as `data` (database), `session`, `cache`, `resource`, `login`, and `cms` can be loaded on demand.

### 7.3 API Example

`web/api/hello.html`:

```html
<uieip type="page" value="base"></uieip>
<script runat="server">
    response.contentType("application/json");
    response.write(JSON.stringify({ error: 0, info: "hello uieip" }));
</script>
```

Requesting `/api/hello.json` returns the JSON response.

---

## 8. Deployment and Operations

### 8.1 Run as a Windows Service

NSSM is recommended:

```powershell
nssm install uieip "D:\Spring\yuanqi-open\uieip-windows.exe"
nssm set uieip AppDirectory "D:\Spring\yuanqi-open"
nssm set uieip DisplayName "UIEIP Service"
nssm set uieip Start SERVICE_AUTO_START
nssm start uieip
```

Common commands:

```powershell
nssm stop uieip
nssm restart uieip
nssm remove uieip confirm
```

### 8.2 Nginx Reverse Proxy

In production, put Nginx in front of UIEIP to handle domains, HTTPS, upload size limits, and real client IP forwarding:

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

        # System monitoring and other features use WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 600s;
    }
}
```

### 8.3 Logging and Monitoring

- Log directory: `log.path` (default `D:\Spring\logfile`)
- Log levels: DEBUG < INFO < WARNING < ERROR < CRITICAL; WARNING and above are recorded by default
- Admin console: **Service Management → System Monitoring / Cache Management / Statistics**
- `console.log()` in page scripts is written to the server log

### 8.4 Ports and Firewall

- Default port: `8011`
- For LAN access, allow the corresponding TCP port in Windows Firewall inbound rules
- To change the port, update `websvr.addr` in `config.json` and restart the service

---

## 9. Workflow

The workflow uses a "node + edge" state-machine model:

| Node | Description |
| --- | --- |
| Start | Starts the workflow |
| Return | Returns to a specified state |
| Exec | Execution/approval node; assignees can be specified by user, position, department + position, initiator's department + position, or code |
| Judge | Decision node; branches according to outgoing edge expressions |
| Proc | Program node; calls APIs or messages |
| End | Ends the workflow |
| Cancel | Cancels the workflow |
| Comment | Canvas annotation; not part of the flow |

Execution nodes support:

- Approval modes: single approver, minimum approval count, minimum approval percentage, all approve
- Assignee changes, automatic approval, delegated approval
- Return count statistics, global parameters, submission history
- To-Do, Done, and My Workflows

Workflow runtime data is stored in `wf_info`, `wf_json`, `wf_todo`, and `wf_comp`. Business table status fields are written back automatically according to the workflow version configuration.

---

## 10. Single Sign-On and Security

### 10.1 Supported Authentication Methods

- Local username/password login
- Graphic captcha
- SMS verification code and email verification code
- WeChat third-party login (in-app authorization / Open Platform QR code)
- Standard protocols: OAuth2, OIDC, CAS 2.0, SAML2
- LDAP (Bind/Search)
- Yuanqi SSO compatible protocol

### 10.2 Password Storage

OpenLDAP-compatible salted hash format:

```text
{algorithm}Hash(password + server salt) + server salt
```

Supports `SHA1`, `SHA256`, `SHA512`, and `YUANQI` compatibility modes. The client can hash the password before transmission, combined with a one-time client salt to prevent replay attacks.

### 10.3 Security Recommendations

1. Change the password of the default account `spring`, or create a new administrator and disable the default account
2. Enable HTTPS to prevent passwords and tokens from being transmitted in plaintext
3. Set `appauth.mode` to `enforce` (the default in this pack) and configure trusted sites/IP allowlists as needed
4. Protect `config.json` and rotate third-party keys regularly
5. Restrict admin console access to the intranet or specified IP addresses
6. Back up `data` and `files` regularly and verify the restore process
7. Disable `websvr.debug` in production

---

## 11. AI and Knowledge Base

The platform includes an AI integration layer that combines LLMs with business data and knowledge bases:

- LLMs: DeepSeek, Ollama, and other OpenAI-compatible APIs
- Vector database: Milvus
- Embedding: Volcengine, Ollama
- Knowledge bases: define the knowledge base, collection, dimension, and embedding driver in `ai.kbs`
- Dataset: configure `kbs_params` in the **UI Data** menu to synchronize business table content to the knowledge base
- Admin entry: **System Management → Knowledge Base Management**
- AI chat: `web/adp/ai-chat.html`

`ai.status = false` by default in this release. Before enabling it, configure the model, embedding service, and Milvus, and replace the sample API key.

---

## 12. Feature Entry Quick Reference

| Feature | Path |
| --- | --- |
| Admin console home | `/adp/` |
| Data management | `/adp/data.html` |
| Field/model configuration | `/adp/fields.html` |
| Menu management | `/adp/menu.html` |
| Portal management | `/adp/cms.html` |
| File management | `/adp/file.html` |
| System parameters | `/adp/param.html` |
| Knowledge base management | `/adp/bikbs.html` |
| Workflow management | `/adp/wfedit.html` |
| My workflows / To-Do / Done | `/adp/wf_my.html`, `/adp/wf_todo.html`, `/adp/wf_comp.html` |
| Departments / Positions / Users | `/adp/hr_org.html`, `/adp/hr_post.html`, `/adp/hr_user.html` |
| Permission management | `/adp/roles.html` |
| Application management / License management | `/adp/app.html`, `/adp/license.html` |
| Service management | `/adp/svradmin/` (cache, monitoring, statistics, DNS, Nginx, NSQ, parameters) |
| Translation management | `/adp/translist.html` |
| Account center | `/account/` |
| Component library | `/yqvue/` |
| Server-side script tests | `/jsvm/` |
| API example | `/api/hello.json` |

---

## 13. Open-Source Edition vs Official Edition

| Item | Free open-source edition (this release) | Official edition |
| --- | --- | --- |
| Operating system | Windows x64 | Windows / Linux / macOS, etc. |
| Database | SQLite | Multiple databases; SQLite, PostgreSQL, and KingbaseES are supported, with MySQL, openGauss, GaussDB, OceanBase, TiDB, and others being adapted |
| Deployment | Single binary, ready after extraction | Service-based and containerized deployment |
| Use cases | Learning, prototyping, lightweight applications for small and medium businesses | Production, enterprise applications, and domestic/localized environments |
| Technical support | Community | Provided under license |

Platform goals:

- Cross-platform server deployment on Linux, Windows Server, and macOS
- Support for mainstream and domestic databases
- Suitability for both embedded IoT device services and management support platforms
- Open-source or self-developed core architecture, independently controllable

> This release is a free open-source runtime package. The multi-database, cross-platform, and enhanced capabilities of the official edition are subject to the actual release and license terms.

---

## 14. Documentation Index

Product and development documentation is located in `web/document/`:

| Document | Path |
| --- | --- |
| Product overview | [web/readme.md](web/readme.md) |
| Changelog | [web/document/note.md](web/document/note.md) |
| Server overview and build | [web/document/server/概述.md](web/document/server/概述.md) |
| Installation and configuration | [web/document/server/安装配置.md](web/document/server/安装配置.md) |
| Service installation (Docker/Redis/Nginx/NSQ/FRP/DNS/NSSM) | [web/document/server/服务安装.md](web/document/server/服务安装.md) |
| Service routing rules | [web/document/server/服务路由规则.md](web/document/server/服务路由规则.md) |
| Workflow | [web/document/server/工作流.md](web/document/server/工作流.md) |
| Logging | [web/document/server/日志管理.md](web/document/server/日志管理.md) |
| System architecture | [web/document/系统架构/概述.md](web/document/系统架构/概述.md) |
| User login and passwords | [web/document/系统架构/用户登录.md](web/document/系统架构/用户登录.md) |
| Component types | [web/document/系统架构/组件类型.md](web/document/系统架构/组件类型.md) |
| File storage | [web/document/系统架构/文件.md](web/document/系统架构/文件.md) |
| Database overview | [web/document/数据库/概述.md](web/document/数据库/概述.md) |
| Database script programs | [web/document/数据库/脚本程序.md](web/document/数据库/脚本程序.md) |
| SSO overview | [web/document/单点登录/概述.md](web/document/单点登录/概述.md) |
| OAuth2 / OIDC / CAS / LDAP / SAML | `web/document/单点登录/` |
| Web framework | [web/document/WEB框架/概述.md](web/document/WEB框架/概述.md) |
| Scripting language | [web/document/脚本语言/概述.md](web/document/脚本语言/概述.md) |
| AI and knowledge base notes | `web/document/笔记/AI/` |
| BI notes | `web/document/笔记/BI/` |

---

## 15. FAQ

**Q1: The browser cannot access the service after startup.**

1. Run `.\uieip-windows.exe` from the installation directory in PowerShell and check the console for errors;
2. Confirm that `uieip-windows.exe` is running and has not exited;
3. Confirm that you are accessing `http://127.0.0.1:8011/`;
4. Check whether port 8011 is already in use: `netstat -ano | findstr 8011`;
5. Check whether Windows Firewall allows the port;
6. If you moved the directory, verify the absolute paths in `config.json`, such as `webpath` and `db.connStr`.

**Q2: The port is already in use. What should I do?**

Change `websvr.addr` in `config.json` (for example, to `8020`), restart the service, and update the Nginx reverse proxy port accordingly.

**Q3: After moving the directory, pages return 404 or the database cannot be opened.**

`config.json` uses absolute paths under `D:\Spring\yuanqi-open` by default. After relocation, update each path as described in [Paths to Update When Relocating the Installation](#52-paths-to-update-when-relocating-the-installation).

**Q4: What is the default account, and how do I change the password?**

The default account is `spring` with password `uieip.123`. After logging in, open the **Change Password** page, or ask an administrator to reset it in user management. If the first-login password change policy is enabled, new users must change their password on first login.

**Q5: Large file uploads fail.**

Check Nginx's `client_max_body_size` and ensure sufficient disk space. Files are stored under `files\` by default, with metadata in `files\filedb.sqlite`.

**Q6: How do I connect MySQL / PostgreSQL?**

This package includes only the SQLite driver and initialization database. The official edition provides PostgreSQL, KingbaseES, and other database support, and can generate table creation scripts and stored procedures/script programs for each database type.

**Q7: How do I enable HTTPS?**

Configure a certificate in Nginx and proxy requests to `127.0.0.1:8011`. Then set `websvr.scheme` to `https` and `websvr.host` to the actual domain in `config.json`.

**Q8: The system monitoring page reports WebSocket errors.**

Enable WebSocket support in Nginx:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Q9: Where are the logs?**

By default, logs are written to `D:\Spring\logfile`, configured by `log.path`. `console.log()` in page scripts is written to the server log.

**Q10: How do I back up and restore data?**

Stop the service, then back up `data\`, `files\`, and `config.json`. To restore, copy them back to the original directory and start the service.

---

## 16. Version History

| Date | Changes |
| --- | --- |
| 2026-10-06 | Version 1.0 finalized |
| 2026-09-20 | Refactored login and SSO programs; added caching for data directory tables and field retrieval |
| 2026-04-17 | Vue + Element Plus front end completed, v1.0.0 |
| 2025-10-05 | Excel export supports merged cells (`yq.datagrid.js`, `yq.data.js`) |
| 2025-09-01 | Added user creation, initial password setup, and first-login password change |
| 2025-08-15 | Improved SSO; added OAuth2, OIDC, CAS, and LDAP support |
| 2025-02-01 | Added secondary department field to `hr_org_user_rel` |
| 2024-11-17 | Third-party account login API and WeChat login example |
| 2024-10-08 | Change history started |

### Planned

- More database adapters (MySQL, openGauss, GaussDB, OceanBase, TiDB, etc.)
- Multi-factor authentication (MFA)
- Automatic synchronization with external AD / HR directories
- Continued workflow engine improvements
- Mobile adaptation and more industry templates

---

## 17. Open Source and Acknowledgements

UIEIP is a free open-source project dedicated to building an independently controllable low-code and enterprise management support platform. Contributions through issues, documentation improvements, templates, and components are welcome.

> Read and comply with the license terms in the project release notes before use. Third-party components (Vue, Element Plus, ECharts, D3.js, GoJS, TinyMCE, Marked, etc.) are governed by their respective licenses. See the [Disclaimer](#18-disclaimer).

---

## 18. Disclaimer

1. **The software is provided "as is".** The project makes no express or implied warranties regarding the completeness, accuracy, reliability, fitness for a particular purpose, or uninterrupted operation of the software. The project authors and contributors shall not be liable for any direct or indirect loss arising from the use of or inability to use the software.

2. **Users must obtain their own licenses for third-party components.** This platform uses third-party components including Vue, Element Plus, ECharts, D3.js, GoJS, TinyMCE, Marked, jQuery, Bootstrap, Ace, Sortable, and vuedraggable. Copyright in these components belongs to their respective authors or companies, and they are governed by their respective licenses. Users must review and comply with the applicable license terms. For components that require a commercial license, registration, payment, or a key (such as GoJS or TinyMCE commercial editions), **users must apply to, purchase from, and obtain authorization directly from the rights holder**. This project does not apply for such licenses on users' behalf and bears no related fees or liability.

3. **Third-party services must be activated by users.** External services such as WeChat login, SMS, email, AI models such as DeepSeek/Ollama, Embedding, Milvus, and object storage require users to register accounts, apply for AppIDs/API keys, complete real-name or enterprise verification, and bear the related service fees and compliance responsibilities. The sample keys in `config.json` are for local demonstration only and must not be used in production.

4. **Data and security responsibility.** Users are responsible for data backup, account and permission configuration, network security protection, cybersecurity classified protection (MLPS) and industry compliance, and content legality review. The project is not liable for loss caused by improper configuration, key leakage, accidental deletion, data loss, service interruption, network attacks, or similar events.

5. **Secondary development and redistribution.** When modifying, further developing, or redistributing the software, users must ensure that they do not infringe third-party intellectual property rights, retain the necessary copyright and license notices, and independently bear the resulting legal responsibilities.

6. **Use constitutes acceptance.** By downloading, installing, deploying, or otherwise using this project, you acknowledge that you have read, understood, and agreed to this disclaimer. If you do not agree, stop using the software and delete it and related files.

> This disclaimer does not constitute legal advice. Consult a qualified legal professional for matters involving commercial licensing, data compliance, and similar issues.

---

**Default Login**

```text
URL: http://127.0.0.1:8011/
Username: spring
Password: uieip.123
```