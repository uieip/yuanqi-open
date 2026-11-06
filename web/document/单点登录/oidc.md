# OIDC (OpenID Connect) 身份认证

## 概述
OpenID Connect (OIDC) 是建立在 OAuth 2.0 协议之上的身份认证层，它允许客户端验证终端用户的身份，并获取基本的用户信息。
OIDC 通常遵循以下认证流程：
- 客户端发起认证请求
- 用户认证并授权
- 客户端获取 ID Token 和 Access Token
- 客户端验证 ID Token
- 客户端获取用户信息（可选）

## 接口概览
| 接口名称 | 端点 | HTTP方法 | 功能描述 |
|---------|------|----------|---------|
| OIDC配置发现端点 | `/connect/oidc/.well-known/openid-configuration` | GET | 获取OIDC服务元数据配置 |
| 授权端点 | `/connect/oidc/authorize` | 任意（不限） | 用户认证入口点，复用 OAuth2 授权逻辑（仅按 302 跳转驱动流程） |
| 令牌端点 | `/connect/oidc/token` | POST | 用授权码换取access_token和id_token |
| 令牌刷新 | `/connect/oidc/refreshtoken` | POST | 刷新访问令牌（注：当前实现不可用，恒返回 HTTP 400，详见 §5） |
| 令牌撤销 | `/connect/oidc/revoketoken` | POST | 撤销 access\_token / refresh\_token（RFC 7009） |
| 获取用户详细信息 | `/connect/oidc/userinfo` | 任意（不限） | 以 Bearer access_token 获取已认证用户信息 |
| 登录登出 | `/connect/oidc/logout` | GET | OIDC RP-Initiated Logout，清除用户会话 |

## 1. OIDC配置发现端点
- 请求方式：GET
```html
http://sso.uieip.com/connect/oidc/.well-known/openid-configuration
```
- 响应示例:
```json
{
	"issuer": "http://sso.uieip.com/connect/oidc",
	"authorization_endpoint": "http://sso.uieip.com/connect/oidc/authorize",
	"token_endpoint": "http://sso.uieip.com/connect/oidc/token",
	"userinfo_endpoint": "http://sso.uieip.com/connect/oidc/userinfo",
	"jwks_uri": "http://sso.uieip.com/connect/oidc/.well-known/jwks.json",
	"response_types_supported": ["code", "id_token", "token"],
	"subject_types_supported": ["public"],
	"id_token_signing_alg_values_supported": ["RS256"],
	"scopes_supported": ["openid", "profile", "email"],
	"claims_supported": ["sub", "name", "email", "preferred_username"]
}
```
## 2. 获取token_id 加密公钥
- 请求方式：GET
```html
http://sso.uieip.com/connect/oidc/.well-known/jwks.json
```
- 响应示例:
```json
{
	"keys": [{
		"alg": "RS256",
		"e": "AQAB",
		"kid": "sso:oidc:key:",
		"kty": "RSA",
		"n": "tlDs6nLqtG0Q4SQ0wBVCFvzNH2kFbd8AswOQGeg15FZLN9MevfZs3SKFuHOziVVtjZPQpI9fC2hPTc-Wq2trx9Q-ePoRfy0T9H9TNaWZi3YIq6IjTabX3pXybs0QQxY11aGo1hWMsIE0j6Fc91zWM3shUeZ0UpHRLyqRjFRAcJplRVk627mmbRYUwbT8w8FzW9_UU11hZeAjSNLv_I-zmbZE73FOYp48CTHi7o-B25xylIXa6klSz_rrv3taiv03vs8-lgSVvW_02jo80xWiEtv_cKYfG_w30LXrKwjl1YT60INe4y9CbFyBj06iiKwwZ6Iay3Tal-1rjCrgPph0EQ",
		"use": "sig"
	}]
}
```

## 3. 授权端点
- 请求方式：任意（路由不校验方法；实现复用 OAuth2 授权处理，仅读取 URL 查询参数）
```html
http://sso.uieip.com/connect/oidc/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=REDIRECT_URI&scope=openid&state=STATE&nonce=NONCE
```
- 参数说明

|参数|必需|说明|
|--|--|--|
|client_id|是|应用的id（等价别名 appid）|
|response_type|否|返回类型。缺省自动补为 code，服务端不校验其取值，仅支持授权码（code）流程|
|redirect_uri|是|授权后重定向的回调链接地址，建议 urlencode。其主机（host）必须命中应用的可信域名白名单（TrustedURLs），否则校验失败|
|scope|是|授权作用域标识。服务端只要求非空、不做取值校验，也不会弹出授权/确认页，属于静默授权；惯用取值如 openid、snsapi_base|
|state|否|重定向后会原样带回 state 参数，仅允许字母和数字，长度不可超过128个字节|
|nonce|否|用于防止重放攻击的随机值，会随授权码写入缓存，并进入 ID Token 的 nonce 声明|

- 流程说明（本端点不返回 JSON/页面，始终以 HTTP 302 跳转驱动流程）：
  - 参数或应用校验失败（如 redirect_uri 主机不在可信域名白名单时错误码为 10005）：302 到 `/login/sso_info.html?err=<错误码>&info=<错误说明>`；
  - 用户已处于单点登录会话：302 到 `redirect_uri?code=<一次性授权码>[&state=<state>]`。授权码只能使用一次，5分钟内有效，用于在令牌端点换取 token；
  - 用户未登录：302 到 `{scheme}://{host}/login/login.html?backurl=<完整授权链接>`，登录成功后服务端携带 backurl 重新进入授权流程。

## 4. 令牌端点
- 请求方式：POST
```html
http://sso.uieip.com/connect/oidc/token?grant_type=GRANT_TYPE&code=CODE&client_id=CLIENT_ID&client_secret=CLIENT_SECRET
```
- 参数说明

|参数|必需|描述|
|--|--|--|
|grant_type|是|必须为"authorization_code"|
|code|是|从授权端点获取的授权码|
|client_id|是|应用的id|
|client_secret|是|应用密钥(如果客户端是机密客户端)|

- 响应示例:
```json
{
	"id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiI2Zj....",
	"access_token": "b66fcd08c19e47cb9076ff7679d3b72822bd7aed-f114-4c59-9590-204e7d563245",
	"token_type": "Bearer",
	"expires_in": 3600
}
```
- 说明：`id_token` 由服务端以 RS256（RSA 私钥）签名，示例中首段 Header `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9` 解码后为 `{"alg":"RS256","typ":"JWT"}`；其验签公钥可通过 §2 的 jwks 端点获取。

## 5. 令牌刷新
> **当前不可用**：令牌端点（§4）的响应结构不含 `refresh_token`，刷新令牌仅由本处理器内部签发，因此外部请求携带的刷新令牌必然校验失败。当前任何对本端点的请求都返回 HTTP 400 错误，不存在可用的成功路径。
- 请求方式：POST
```html
http://sso.uieip.com/connect/oidc/refreshtoken?grant_type=GRANT_TYPE&refresh_token=SlAV32hkKG&client_id=CLIENT_ID&client_secret=CLIENT_SECRET
```
- 参数说明

|参数|必需|描述|
|--|--|--|
|grant_type|是|必须为"refresh_token"|
|refresh_token|是|需要刷新的token|
|client_id|是|应用的id|
|client_secret|是|应用密钥(如果客户端是机密客户端)|

> 以下请求参数与成功响应仅为协议示意（与内部成功分支一致），实际因上述原因不可达，任何请求均返回 HTTP 400。
- 响应示例:
```json
{
  "access_token": "new-SlAV32hkKG",
  "token_type": "Bearer",
  "refresh_token": "SlAV32hkKG",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 5.5 令牌撤销
- 请求方式：POST
```html
http://sso.uieip.com/connect/oidc/revoketoken
```
- 参数说明

|参数|必需|描述|
|--|--|--|
|token|是|需要撤销的 access_token / refresh_token|
|token_type_hint|否|令牌类型提示，如 access_token 或 refresh_token|
|client_id|是|应用的id|
|client_secret|是|应用密钥(如果客户端是机密客户端)|

- 响应示例:
```json
{
   "errcode": 0,
   "errmsg": "ok"
}
```
- 说明：遵循 RFC 7009，成功撤销返回 HTTP 200。令牌不存在或已过期时仍返回成功，避免泄露令牌状态。`token_type_hint` 可选，未提供时依次尝试 access\_token 和 refresh\_token 两种令牌类型。

## 6. 获取用户详细信息
- 请求方式：GET / POST
```html
http://sso.uieip.com/connect/oidc/userinfo
```
- 请求头
```
Authorization: Bearer {access_token}
```
-  响应示例
```json
{
  "sub": "22bd7aed-f114-4c59-9590-204e7d563245",
  "user_type": 1,
  "code": "lisi",
  "name": "李四",
  "gender": 1,
  "birthday": "1990-01-01",
  "phone": "010-88886666",
  "mobile": "13800000000",
  "email": "lisi@yqsite.com",
  "login_name": "lisi",
  "login_phone": "13910000000",
  "login_email": "lisi@yqsite.com"
}
```
- 说明：仅返回非空字段。`sub` 即用户的 `userid`（原 userid 键被替换为 sub），其余字段来自 `hr_user` 与 `hr_user_login` 表，与 OAuth2 getuserdetail 的字段集一致，不包含 OIDC 标准的 given_name/family_name/preferred_username/picture 等声明。

## 7. 登录退出
- 请求方式：GET
```html
http://sso.uieip.com/connect/oidc/logout?client_id=CLIENT_ID&post_logout_redirect_uri=REDIRECT_URI&state=STATE
```
- 参数说明

|参数|必需|描述|
|--|--|--|
| client_id | 是 | 应用的id |
| post_logout_redirect_uri |否| 登录退出返回地址 |
| state | 否 | 若同时提供了 post_logout_redirect_uri，则原样追加到重定向 URL 中带回；服务端不校验其取值、长度或字符集 |

## 8. ID Token 结构
ID Token 是JWT格式，使用 **RS256** 签名算法（私钥签名，公钥验证），包含以下标准声明：

| 声明 | 固定/可选 | 描述 |
|------|----------|------|
| iss | 固定 | 签发者，格式为 `{scheme}://{host}/connect/oidc` |
| sub | 固定 | 用户唯一标识（userid） |
| aud | 固定 | 目标受众（client_id） |
| exp | 固定 | 过期时间（Unix时间戳，有效期60分钟） |
| iat | 固定 | 签发时间（Unix时间戳） |
| nonce | 固定 | 防重放随机值，与授权请求中的nonce一致 |
| name | 可选 | 用户姓名 |
| code | 可选 | 用户编码 |
| gender | 可选 | 性别 |
| birthday | 可选 | 生日 |
| login_name | 可选 | 登录名 |
| login_phone | 可选 | 手机号 |
| login_email | 可选 | 登录邮箱（与 login_name/login_phone 相同，非空时才写入） |

## 二、常见错误
参见 OAuth2 常见错误