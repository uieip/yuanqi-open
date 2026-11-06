# YUANQI SSO 网页登录

兼容远齐科技 asp.net 旧版系统的网页登录协议，供存量业务系统平滑对接。

密码迁移格式：`{YUANQI}` + 密码哈希 + 盐（兼容 asp.net 端生成的密文，验证算法为 SHA1(UTF-16LE 密码 + 盐) 后 Base64 编码）。例如：

```
{YUANQI}ZjiX8F5XSNM6701a1Eh7MUuRKLQ=54HaFprO-G7I7Kv7O1vGPOX6YEE=
```

## 概述

- 本协议为远齐自研 SSO 兼容协议，端点以 `/sso/` 开头；另有根级 `/_login.html`、`/_accinfo.html` 兼容入口。
- 路径匹配大小写不敏感；HTTP 方法与下表不符时返回 `405 Method Not Allowed`，`/sso/` 前缀下未匹配任何端点时返回 `404 无效的请求路径`。
- 授权的域名校验、访问者 IP 白名单校验均依据应用注册表（app_client）：应用状态须为启用（1）或测试（2）；测试状态跳过频率与密钥类校验；启用状态受调用频控约束（每分钟窗口）。

## 接口概览

| 接口名称 | 端点 | HTTP方法 | 功能描述 |
|---------|------|----------|---------|
| 网页授权（获取Token） | `/sso/userlogin.html`（别名 `/sso/userlogin1.html`、`/sso/gettoken.html`） | GET | 用户认证入口：已登录则生成一次性授权码并回跳 BackURL，未登录则跳转统一登录页 |
| 获取访问用户身份 | `/sso/_accinfo.html` | POST | 用一次性授权码（Token）换取登录用户身份信息 |
| 登录兼容 | `/_login.html?ctype=...`（根级） | POST | 旧系统直连的用户名/密码登录入口 |
| 单点登出 | `/sso/clstoken.html` | GET | 删除当前会话的 `userId`，并重定向回 BackURL（不影响其他系统会话） |

## 1. 网页授权 - 获取Token

Token 相当于一次性登录凭证：业务系统将用户引导到授权入口，登录成功后系统会把 Token 追加到业务系统的 BackURL 并回跳，业务系统再用该 Token 换取用户身份。

- 请求方式：GET

```http
GET /sso/userlogin.html?BackURL=http%3A%2F%2Fwww.uieip.com%2Fsso%2Flogin.html HTTP/1.1
Host: sso.uieip.com
```

- 参数说明：

| 参数 | 必须 | 说明 |
|--|--|--|
| BackURL | 是 | 授权成功后跳转回的业务系统地址（参数名不区分大小写，也可写作 `backurl`）。若取值以 `http%3A%2F%2F` 或 `https%3A%2F%2F`（即 `http://`/`https://` 的 URL 编码）开头，服务端会先做一次 URL 解码；否则原样使用 |

### 处理流程

1. 校验 `BackURL`：为空时 302 到 `/login/sso_info.html?err=6000&info=BackURL不能为空`。
2. 域名校验：按 BackURL 的 host 查找应用注册表，应用不存在、未启用或超频时，302 到 `/login/sso_info.html?err=6001&info=<原因>`。
3. 已登录用户：生成一次性授权码（有效期 5 分钟），构造回跳 URL 并 302 返回；构造失败时 302 到 `err=6002`。
4. 未登录用户：302 到统一登录页 `/login/login.html?backurl=<scheme>://<host>/sso/userlogin.html?BackURL=<原值>`，用户登录成功后按 backurl 回到本端点，再执行第 3 步回跳业务系统；构造授权 URL 失败时 302 到 `err=6003`。

### 回跳 URL

Token 与客户端 IP 以两种方式写入 BackURL（[buildYqBackURL](../svr/sso/yuanqi_sso.go) 实现）：

- 若 BackURL 中含 `$Token$` 占位符，则直接替换为授权码；否则在 URL 后追加 `Token=<授权码>` 查询参数。
- 若 BackURL 中含 `$IP$` 占位符，则直接替换为访问者 IP；否则追加 `IP=<访问者IP>` 查询参数。
- 两种占位均命中时不再追加任何查询参数，原样返回。

跳转示例：

```http
HTTP/1.1 302 Found
Location: http://www.uieip.com/sso/login.html?Token=AAAAAAgG333qs9EdaPbCAP1VaOrjuNkiAZHTWgaWsZQ&IP=127.0.0.1
```

## 2. 获取访问用户身份 - `/sso/_accinfo.html`

根据第 1 步拿到的 Token 换取登录用户身份信息。

- 请求方式：POST（仅支持 POST，且根级 `/_accinfo.html` 同样可访问）
- 请求地址：

```http
POST /sso/_accinfo.html?action=token&token=AAAAAAgG333qs9EdaPbCAP1VaOrjuNkiAZHTWgaWsZQ HTTP/1.1
Host: sso.uieip.com
```

参数均放在 query string，请求包体可为空。

- 参数说明：

| 参数 | 必须 | 说明 |
|--|--|--|
| action | 否 | 固定为 `token`（缺省即 `token`）。其余取值返回 HTTP 400 `Invalid action` |
| token | 是 | 一次性授权码。只能使用一次，使用后立即作废；5 分钟未被使用自动过期 |
| tag | 否 | 缺省 `server`；置为 `local`（本地联调）时可跳过访问者 IP 白名单校验 |

`tag` 非 `local` 时会校验访问者 IP 是否命中应用 IP 白名单，未通过返回 `6004`。

- 成功返回（字段 `error`、`userId`、`changePass`、`checkPE`、`token` 为固定字段，其余为 hr_user 资料字段与扩展字段的并集，不含 `sid`、`user_id`、`login_pass`、`createtime` 等内部字段）：

```json
{
   "error": 0,
   "userId": "22bd7aed-f114-4c59-9590-204e7d563245",
   "changePass": false,
   "checkPE": false,
   "token": "code",
   "nickname": "ocean",
   "loginName": "spring",
   "phone": "13910000000",
   "email": "spring@yqsite.com",
   "modifyTime": "2025/01/12 12:04:23"
}
```

  - `error`：0 表示成功。
  - `token`：恒为字符串 `"code"`（旧版占位值，业务系统以 `userId` 为准）。
  - `nickname`/`loginName`/`phone`/`email`：取自 hr_login 资料，存在才返回。
  - `modifyTime`：等于 hr_user 的修改时间。

- 出错返回（沿用 OAuth2 统一的 token 响应结构体，因此始终带有空的 `access_token`/`expires_in` 字段）：

```json
{
   "errcode": 6005,
   "errmsg": "无效的code：AAAAAAgG333qs9EdaPbCAP1VaOrjuNkiAZHTWgaWsZQ",
   "access_token": "",
   "expires_in": 0
}
```

  - `6004`：访问者 IP 未授权。
  - `6005`：Token 无效、已使用或用户信息读取失败。

## 3. 登录兼容 - `/_login.html`

供旧系统以用户名/密码直接换取登录用户身份（请求必须携带 `ctype` 参数并走 POST，否则按常规登录页面处理）。

- 请求方式：POST

```http
POST /_login.html?ctype=1&name=spring HTTP/1.1
Host: sso.uieip.com

{明文密码}
```

- 参数说明：

| 参数 | 必须 | 说明 |
|--|--|--|
| ctype | 是 | 存在即进入本登录兼容处理（取值不校验） |
| name | 是 | 登录用户名 |
| tag | 否 | 同第 2 节，`local` 时跳过 IP 白名单校验 |
| action | 否 | 缺省 `login`；`getsvr`/`linksvr` 恒返回 `{"error":9,"info":"不允许创建连接"}`，其余取值返回 HTTP 400 `Invalid action` |

密码放在 POST 包体中（可为空串触发校验失败）；若密码以 `{spring}` 开头，该前缀会被剥离后再校验。

- 成功返回：JSON 结构同第 2 节成功返回（无额外 `info` 字段）。
- 失败返回：JSON 结构同第 2 节出错返回，错误码对应关系：

| 错误码 | 说明 |
|--|--|
| 6004 | 访问者 IP 未授权 |
| 6006 | 用户名或密码不能为空 / 用户不存在 |
| 6007 | 用户已被删除 |
| 6008 | 用户未设置密码 |
| 6009 | 密码错误 |
| 6010 | 用户不存在（读取用户详情失败时） |

## 4. 单点登出 - `/sso/clstoken.html`

- 请求方式：GET

```http
GET /sso/clstoken.html?BackURL=http%3A%2F%2Fwww.uieip.com%2F HTTP/1.1
Host: sso.uieip.com
```

- 参数说明：

| 参数 | 必须 | 说明 |
|--|--|--|
| BackURL | 否 | 登出后重定向地址（参数名不区分大小写）。为空时回跳服务端根 URL `scheme://host/` |

行为：删除当前会话中的 `userId`（仅清除本认证中心的登录态，不涉及其他系统会话），随后 302 到 BackURL。

## 二、常见错误

`err` 错误码与出现位置：

| 错误码 | 说明 | 出现位置 |
|--|--|--|
| 6000 | BackURL 参数不存在 | 授权入口：302 到 `/login/sso_info.html?err=6000` |
| 6001 | 域名不匹配（含应用未启用/调用超频） | 授权入口：302 到 `/login/sso_info.html?err=6001` |
| 6002 | 构造回调 URL 错误 | 授权入口：302 到 `/login/sso_info.html?err=6002` |
| 6003 | 构造授权 URL 错误 | 授权入口：302 到 `/login/sso_info.html?err=6003` |
| 6004 | IP 地址不允许 | accinfo / 登录兼容：JSON 返回 |
| 6005 | 获取并验证用户信息错误 | accinfo：JSON 返回 |
| 6006 | 用户名或密码错误 | 登录兼容：JSON 返回 |
| 6007 | 用户已被注销 | 登录兼容：JSON 返回 |
| 6008 | 用户未设置密码 | 登录兼容：JSON 返回 |
| 6009 | 密码错误 | 登录兼容：JSON 返回 |
| 6010 | 用户不存在 | 登录兼容：JSON 返回 |

> 区分方式：授权入口（`/sso/userlogin*.html`、`/sso/gettoken.html`）的错误以 `302 + sso_info.html` 页面呈现；`_accinfo.html` 与 `/_login.html` 的错误以 JSON 返回，字段为 `errcode`/`errmsg`（非旧文档中的 `error`/`info`）。
