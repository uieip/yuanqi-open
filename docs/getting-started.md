# 快速开始

## 运行环境

- Windows 10 / Windows 11，或 Windows Server（x64）
- 无需安装 Go、Node.js、数据库或 Web 服务器
- 建议内存 2 GB 以上，磁盘可用空间 1 GB 以上

## 启动

1. 将发布包解压到固定目录，例如 `D:\Spring\yuanqi-open`。

    > 随包 `config.json` 中的站点目录、数据库、日志等均为**绝对路径**（默认 `D:\Spring\yuanqi-open`）。解压到其他目录时，必须先修改这些路径，见下文「换目录」。

2. 进入目录并启动：

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

4. 默认账号：

    ```text
    用户名：spring
    密码：uieip.123
    ```

    > 首次部署后请立即修改默认密码，并替换 `config.json` 中的第三方密钥。

## 停止

- 前台运行：控制台按 `Ctrl + C`
- 以 Windows 服务运行：停止对应服务（见[部署与运维](deploy.md)）

## 配置说明

主配置文件：`config.json`；DNS 配置：`yqdns.json`。

### 常用配置项

| 配置项 | 说明 |
| --- | --- |
| `websvr.webtype` | 服务类型：`default` 应用站点、`cms` 网站、`sso` 单点登录 |
| `websvr.addr` | 监听端口，默认 `8011` |
| `websvr.webpath` | 站点根目录，必须指向 `web` 目录 |
| `websvr.funcpath` | 后台程序目录，默认 `web\svrfunc` |
| `websvr.debug` | 开发模式；为 `true` 时不压缩输出，便于调试 |
| `websvr.timeout` | 请求超时，单位毫秒 |
| `websvr.cachetime` | 静态页面缓存时间，单位分钟 |
| `websvr.checkhost` | 是否校验 Host；本地访问建议保持 `false` |
| `websvr.host` / `websvr.scheme` | 站点域名与协议（`http` / `https`），公网部署时修改 |
| `websvr.zip` | 非调试模式下是否压缩输出 |
| `websvr.proxyurl` | 服务端访问外网时的代理地址（HTTP/SOCKS5） |
| `appauth.mode` | 客户端准入与签名校验：`off` 直通、`audit` 只记录、`enforce` 强制拒绝 |
| `cache.type` / `session.type` | `memory` 或 `redis`；`session.lifeTime` 为会话时长（分钟） |
| `log.path` / `log.level` | 日志目录（默认 `D:\Spring\logfile`）与级别 |
| `db.lists` | 数据库列表，**第一个为系统数据库** |
| `db.yqbase.connStr` | 系统数据库连接串，本包为 SQLite 文件路径 |
| `file.lists` / `file.sqlite.fsPath` | 文件柜列表与本地存储目录（默认 `files\`） |
| `power.admin` | 系统管理员用户 SID 列表 |
| `power.sso` / `power.third.weixin` / `power.verif` | 统一认证、微信登录、短信/邮件验证码配置 |
| `ai.*` | AI 开关、默认模型、API Key、Milvus、Embedding、知识库定义 |
| `svradmin.*` | 内置 DNS、Nginx、NSQ、LDAP 等服务管理配置 |

### 换目录

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

### 改端口

修改 `config.json` 中的 `websvr.addr`（例如 `8020`），重启服务，并同步调整 Nginx 反向代理端口。

### 敏感配置

`config.json` 包含数据库连接、AI API Key、短信/邮件账号、微信 AppID/Secret、SSO 密钥等敏感信息。用于生产环境前请务必：

1. 修改默认管理员密码；
2. 替换为自有第三方平台密钥，并轮换已公开的测试密钥；
3. 不要将 `config.json` 提交到公开代码仓库；
4. 通过 Nginx 配置 HTTPS，并限制管理后台访问来源。
