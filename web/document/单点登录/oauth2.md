# OAuth 2.0 网页登录

## 接口概览

| 接口名称            | 端点                            | HTTP方法 | 功能描述             |
| --------------- | ----------------------------- | ------ | ---------------- |
| 获取access\_token | `/connect/auth/gettoken`      | GET    | 获取应用访问令牌         |
| 构造网页授权链接        | `/connect/auth/authorize`     | GET    | 用户认证入口点          |
| 获取访问用户身份        | `/connect/auth/getuserinfo`   | GET    | 根据code获取用户UserID |
| 获取用户详细信息        | `/connect/auth/getuserdetail` | POST   | 获取用户详细信息         |
| 单点登出            | `/connect/auth/logout`        | GET    | 全局会话终止           |
| 令牌撤销            | `/connect/auth/revoketoken`   | POST   | 撤销access\_token（RFC 7009） |
| 预登录             | `/connect/auth/prelogin`      | POST   | 登录前预处理（获取登录配置）   |
| 登录              | `/connect/auth/login`         | POST   | 用户名/密码登录         |
| 获取验证码           | `/connect/auth/getverifcode`  | POST   | 获取图形/短信验证码       |
| 校验验证码           | `/connect/auth/checkverifcode`| POST   | 校验验证码            |
| 修改密码            | `/connect/auth/upppw`         | POST   | 修改用户密码           |
| 第三方授权参数         | `/connect/auth/third/params`        | POST | 获取第三方登录授权参数      |
| 第三方授权           | `/connect/auth/third/authorize`     | POST | 发起第三方授权          |
| 第三方令牌           | `/connect/auth/third/access_token`  | POST | 第三方授权码换取令牌并完成登录  |
| 第三方绑定信息         | `/connect/auth/third/linkinfo`      | POST | 查询当前用户的第三方绑定信息   |
| 第三方绑定           | `/connect/auth/third/link`          | POST | 绑定第三方账号         |
| 第三方解绑           | `/connect/auth/third/unlink`        | POST | 解绑第三方账号         |
| 第三方重定向          | `/connect/auth/third/redirect`      | GET  | 第三方授权回调重定向      |

## 1. 获取access\_token

access\_token相当于创建了一个登录凭证，其它的业务API接口，都需要依赖于access\_token来鉴权调用者身份。

- 请求方式： GET

```html
http://sso.uieip.com/connect/auth/gettoken?appid=ID&corpsecret=SECRET
```

- 参数说明：

| 参数                          | 必须 | 说明                  |
| --------------------------- | -- | ------------------- |
| appid 或 client\_id          | 是  | 应用的id               |
| corpsecret 或 client\_secret | 是  | 应用的凭证密钥，注意应用需要是启用状态 |

- 权限说明：
  每个应用有独立的appid，获取到的access\_token只能本应用使用，所以每个应用的access\_token应该分开来获取
  返回结果：

```json
{
   "errcode": 0,
   "errmsg": "ok",
   "access_token": "accesstoken000001",
   "expires_in": 7200
}
```

- 参数说明：

| 参数            | 说明                    |
| ------------- | --------------------- |
| errcode       | 出错返回码，为0表示成功，非0表示调用失败 |
| errmsg        | 返回码提示语                |
| access\_token | 获取到的凭证，最长为512字节       |
| expires\_in   | 凭证的有效时间（秒）            |

- 注意事项：
  开发者需要缓存access\_token，用于后续接口的调用（注意：不能频繁调用gettoken接口，否则会受到频率拦截）。当access\_token失效或过期时，需要重新获取。
  access\_token的有效期通过返回的expires\_in来传达，正常情况下为7200秒（2小时）。
  access\_token至少保留512字节的存储空间。

## 2. 构造网页授权链接

在浏览器中访问如下授权链接：

```html
http://sso.uieip.com/connect/auth/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=snsapi_base&state=STATE
```

- 参数说明

| 参数                 | 必需 | 说明                                                             |
| ------------------ | -- | -------------------------------------------------------------- |
| appid 或 client\_id | 是  | 应用的id                                                          |
| redirect\_uri      | 是  | 授权后重定向的回调链接地址，建议使用 urlencode 编码。其主机（host）必须命中应用的可信域名白名单，否则校验失败 |
| response\_type     | 否  | 返回类型。缺省自动补为 code，服务端不校验其取值，实际仅支持授权码（code）流程                    |
| scope              | 是  | 授权作用域标识。服务端只要求非空、不做取值校验，也不会弹出授权页，属于静默授权                        |
| state              | 否  | 重定向后会原样带回 state 参数，仅允许字母和数字，长度不可超过128个字节                       |
| nonce              | 否  | 用于防止重放攻击的随机值，会随授权码写入缓存（OAuth2 流程中不进入后续响应）                      |

- 流程说明（本端点不返回 JSON/页面，始终以 HTTP 302 跳转驱动流程）：
  - 参数或应用校验失败（如 redirect\_uri 不在白名单时错误码为 10005）：302 到 `/login/sso_info.html?err=<错误码>&info=<错误说明>`；
  - 用户已处于单点登录会话：302 到 `redirect_uri?code=<一次性授权码>[&state=<state>]`。授权码只能使用一次，5分钟内有效，用于换取 access\_token；
  - 用户未登录：302 到 `{scheme}://{host}/login/login.html?backurl=<完整授权链接>`，登录成功后服务端携带 backurl 重新进入授权流程。

## 3. 获取访问用户身份

根据code获取成员信息。

- 请求方式：GET
- 请求地址：

```html
http://sso.uieip.com/connect/auth/getuserinfo?appid=ID&access_token=ACCESS_TOKEN&code=CODE
```

- 参数说明：

| 参数                                                                                                                                                                            | 必需     | 说明                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| appid 或 client\_id                                                                                                                                                            | 是      | 应用的id                                                             |
| access\_token                                                                                                                                                                 | 是      | 调用接口凭证                                                            |
| code                                                                                                                                                                          | 是      | 通过成员授权获取到的code，最大为512字节。每次成员授权带上的code将不一样，code只能使用一次，5分钟未被使用自动过期。 |
| 权限说明：                                                                                                                                                                         | <br /> | <br />                                                            |
| 服务端按请求来源校验应用可信域名（TrustedURLs）：优先取请求头 `Origin`，缺失时回退解析 `Referer` 中的 `scheme://host`，来源不在白名单内返回错误码 **10006 域名未授权**。服务器之间的直连调用（不带 Origin/Referer 来源头）不受域名白名单限制，放行（但仍受 IP 白名单约束）。 | <br /> | <br />                                                            |
| 返回结果：                                                                                                                                                                         | <br /> | <br />                                                            |

```json
{
   "errcode": 0,
   "errmsg": "ok",
   "userid":"USERID"
}
```

出错返回示例：
本接口出错时统一返回 HTTP 200（非 4xx/5xx），响应体固定包含 4 个字段（`errcode`/`errmsg`/`access_token`/`expires_in`，出错时后两者为空串和 0），不省略任何键。以下为 code 无效或已过期时的返回：

```json
{
   "errcode": 10020,
   "errmsg": "无效的code：XXXXXXXXXXXXXXXX",
   "access_token": "",
   "expires_in": 0
}
```

## 4. 获取用户详细信息

- 请求方式：POST

```html
http://sso.uieip.com/connect/auth/getuserdetail?appid=ID&access_token=ACCESS_TOKEN
```

| 参数                 | 必需 | 说明     |
| ------------------ | -- | ------ |
| appid 或 client\_id | 是  | 应用的id  |
| access\_token      | 是  | 调用接口凭证 |

- 请求包体：

```json
{
   "userid": "USERID"
}
```

返回结果：
接口成功时直接返回用户字段 JSON 对象（**不包裹** errcode/errmsg）。字段取自 `hr_user` 表对应记录，仅返回非空字段，并剔除 `sid`、`user_id`、`c_userid`、`c_username`、`createtime`、`m_userid`、`m_username`、`modifytime` 等内部字段；若该用户存在登录账号（`hr_user_login`），会附带 `login_name`、`login_phone`、`login_email`（均为空则不带）。示例：

```json
{
   "userid": "lisi",
   "user_type": 1,
   "code": "lisi",
   "name": "李四",
   "gender": 1,
   "birthday": "1990-01-01",
   "phone": "010-88886666",
   "mobile": "13800000000",
   "email": "lisi@yqsite.com",
   "chat": "",
   "remark": "",
   "isdel": false,
   "ent_id": "00000000000000000000000000000000",
   "login_name": "lisi",
   "login_phone": "13910000000",
   "login_email": "lisi@yqsite.com"
}
```

出错时（如 token 无效、userid 不存在）同样返回 HTTP 200 + 固定 4 字段载体，`errcode` 为 10021/10022 等。

## 5. 退出

```html
http://sso.uieip.com/connect/auth/logout?appid=CORPID&redirect_uri=REDIRECT_URI
```

## 6. 令牌撤销（RFC 7009）

撤销已颁发的 access\_token，使令牌立即失效。遵循 [RFC 7009](https://datatracker.ietf.org/doc/html/rfc7009) 规范。

- 请求方式：POST

```html
http://sso.uieip.com/connect/auth/revoketoken
```

- 参数说明：

| 参数            | 必须 | 说明                          |
| ------------- | -- | --------------------------- |
| client\_id    | 是  | 应用的id                        |
| client\_secret | 是  | 应用的凭证密钥                      |
| token         | 是  | 需要撤销的 access\_token          |

- 返回结果：

```json
{
   "errcode": 0,
   "errmsg": "ok"
}
```

- 说明：
  - 令牌按 appID 存储（同一应用仅持有一个活跃令牌），撤销即删除该缓存键，令牌立即失效。
  - 遵循 RFC 7009：令牌不存在或已过期时仍返回成功（`errcode: 0`），避免泄露令牌状态信息。
  - 客户端凭证校验失败时返回对应错误码（10001/10002/10005/10006 等）。

## 7. 登录相关端点

以下端点统一经 `auth_checkParams` 校验应用凭证（支持 `appid/corpsecret` 与 `client_id/client_secret` 两套参数），校验通过后委托登录模块（`login.LoginHandlerST`）执行实际业务。请求参数和返回格式与登录模块一致。

| 端点 | HTTP方法 | 功能 |
|-----|---------|------|
| `/connect/auth/prelogin` | POST | 预登录：获取登录页配置（验证码类型、第三方登录选项等） |
| `/connect/auth/login` | POST | 用户名/密码登录 |
| `/connect/auth/getverifcode` | POST | 获取验证码（图形验证码/短信验证码） |
| `/connect/auth/checkverifcode` | POST | 校验验证码 |
| `/connect/auth/upppw` | POST | 修改用户密码 |

> 凭证参数放在 URL query string 中（`appid`/`corpsecret` 或 `client_id`/`client_secret`），业务参数放在 POST 包体中，具体格式参见登录模块接口。

## 8. 第三方登录授权端点

以下端点同样经 `auth_checkParams` 校验应用凭证后，委托登录模块处理第三方登录（目前仅支持微信）。详细的第三方登录流程参见 [thirdparty.md](thirdparty.md)。

| 端点 | HTTP方法 | 功能 |
|-----|---------|------|
| `/connect/auth/third/params` | POST | 获取第三方登录授权参数（appid、state 等） |
| `/connect/auth/third/authorize` | POST | 发起第三方授权（服务端 302 跳转到第三方授权页） |
| `/connect/auth/third/access_token` | POST | 第三方授权码换取令牌并完成登录 |
| `/connect/auth/third/linkinfo` | POST | 查询当前已登录用户的第三方绑定信息 |
| `/connect/auth/third/link` | POST | 将已登录账号与第三方账号绑定 |
| `/connect/auth/third/unlink` | POST | 解除第三方账号绑定 |
| `/connect/auth/third/redirect` | GET | 第三方授权回调重定向（校验 backurl 域名白名单后 302 跳转） |

> `/connect/auth/third/redirect` 不需要应用凭证参数，但会校验 `backurl` 参数的域名是否在应用可信域名白名单中，并拒绝非标准 URI 格式（如 `https:evil.com`）以防止域名校验绕过。

## 二、常见错误

| 错误码   | 说明                |
| ----- | ----------------- |
| 10000 | 参数不存在             |
| 10001 | 应用凭证无效            |
| 10002 | 应用已禁用             |
| 10003 | 应用凭证无效            |
| 10004 | 调用频率超限            |
| 10005 | IP未授权             |
| 10006 | 域名未授权             |
| 10010 | 生成token失败         |
| 10011 | appid不能为空         |
| 10012 | redirect\_uri不能为空 |
| 10013 | scope不能为空         |
| 10014 | state长度不能超过%d字节   |
| 10015 | state只能包含字母和数字    |
| 10018 | 生成回调URL失败         |
| 10019 | 构造授权URL失败         |
| 10020 | 无效的授权码            |
| 10021 | 无效的访问令牌           |
| 10022 | 无效的用户ID           |

