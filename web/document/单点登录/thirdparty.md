# 第三方登录集成

目前**仅支持微信（weixin）**一种第三方登录。代码见 `svr/login/third_party.go`（类型分发）与 `svr/login/third_weixin.go`（微信实现）。

> `Third_party(name)` 只实现 `case "weixin"`；配置其他类型（如 `"qq"`）会直接报错：
> `Third party login configuration parameters[power:third:<name>] do not exist.`

## 微信

### 开通配置

需要同时具备两组微信应用资质：

- **微信公众号（服务号）**：https://mp.weixin.qq.com/
  - 在「开发 → 基本配置」获取开发者 ID（AppID）、开发者密码（AppSecret）
  - 功能设置中配置业务域名、JS 接口安全域名及**网页授权域名**
  - 用于**微信内置浏览器**内发起的网页授权（`scope=snsapi_userinfo`）
- **微信开放平台（网站应用）**：https://open.weixin.qq.com/
  - 创建「网站应用」后获取 APPID、AppSecret；在开发配置中设置安全域名并开通微信登录
  - 用于**微信之外的浏览器**发起的扫码登录（`scope=snsapi_login`）

### 系统配置

`power/third/weixin` 在 `config.json`（参考 `svr/config.json`）中是**长度为 2 的数组**，顺序与使用场景一一对应：

| 数组下标 | describe（示例） | AppID/Secret 归属 | 使用场景 |
|--|--|--|--|
| 0 | 微信中 | 微信公众号（服务号） | 微信内置浏览器网页授权 |
| 1 | 网页中 | 微信开放平台网站应用 | 外部浏览器二维码扫码 |

```json
{
  "power": {
    "third": {
      "weixin": [
        {
          "describe": "微信中",
          "appid": "公众号的AppID",
          "secret": "公众号的AppSecret"
        },
        {
          "describe": "网页中",
          "appid": "开放平台网站应用的AppID",
          "secret": "开放平台网站应用的AppSecret"
        }
      ]
    }
  }
}
```

说明：

- 代码通过 `config.GetString("power/third/weixin", "[]")` 读取并按 JSON 反序列化为 `tp_Weixin_key{Appid, Secret}` 数组，并注册 `config.RegisterEvent` 支持配置**热更新**
- `describe` 仅作可读描述，登录逻辑只使用 `appid`、`secret`
- 数组为空或 JSON 非法时加载失败，微信登录入口不可用
- 反序列化只认 `appid`/`secret` 两个字段，多余的配置项会被忽略

### 登录流程与代码行为

实现类为 `tp_Weixin_ST`（`svr/login/third_weixin.go`），绑定关系 `link_type = 1`。

1. **发起授权**（`Get_Code`）：按 User-Agent 判断分流
   - UA 含 `micromessenger`（`isWeixin` 判定，微信内置浏览器）→ 跳转 `https://open.weixin.qq.com/connect/oauth2/authorize`，使用下标 0 的公众号 appid，`scope=snsapi_userinfo`（带 `#wechat_redirect`）
   - 其他浏览器 → 跳转 `https://open.weixin.qq.com/connect/qrconnect`，使用下标 1 的网站应用 appid，`scope=snsapi_login`（带 `#wechat_redirect`）
   - 回传的 `state` 统一追加前缀：`state = "weixin@" + state`
2. **换取访问令牌**（`Get_Token`）：以微信回调 code 调 `https://api.weixin.qq.com/sns/oauth2/access_token`，按对应场景使用下标 0/1 的 appid、secret
3. **确定用户唯一标识**：优先取返回中的 `unionid` 作为第三方用户 ID；无 `unionid` 时退回 `openid`
4. **拉取资料并绑定**（`Set_Link`）：调 `https://api.weixin.qq.com/sns/userinfo`（`access_token` + `openid`）获取昵称、头像、性别（sex：1→男、2→女），随后写入第三方绑定表 **`hr_user_third_link`**
   - `link_type = 1`（1-微信，2 预留企业微信），见 `svr/login/data.go`
   - 支持解绑（`Delete_Link`）、查询绑定信息（`Get_LinkInfo`/`Check_Link`）

### 登录侧接入

第三方登录的分工是：**Go 登录模块只负责“出授权参数”，换取 token、绑定校验与完成本系统登录都在 JSVM 服务端函数中执行**（注册在 JSVM 全局对象 `login` 上，见 `svr/websvr/jsvm.func.login.go`）。

- **获取授权参数**：`LoginHandlerST.thirdParams`（`svr/login/handler.go:716`）响应前端 `POST _login.html` 的表单 `action=thirdparams&type=weixin&backurl=...`（`ToDo` 按 `action` 分发，`svr/login/handler.go:62`）。type 为空返回 `{error:99}`；否则把 `backurl`（缺省 `/index.html`）写入会话键 `login:backurl`，经 `Third_party(type)` 取实现类后调 `Get_Pamas("state")`，成功返回 `{appid, state, error:0}`。微信的 `Get_Pamas`（`svr/login/third_weixin.go:46`）固定返回**下标 1 的网站应用** appid，state 统一为 `"weixin@" + 入参`。
- **发起授权**：扫码页 `webvue/src/components/login/LoginThird.vue` 拿 `appid`/`state` 渲染 WxLogin 二维码，redirect_uri 指向 `/login/login_third.html`；JSVM 页面 `webvue/login/login_third.html` 也可直接调 `login.third_login(type, redirect_uri, state)` 由服务端 302 跳转发起授权（`svr/websvr/jsvm.func.login.go:169`）。微信实现 `Get_Code`（`svr/login/third_weixin.go:35`）按 UA 是否微信内置浏览器分流：`micromessenger` 用下标 0 公众号（`snsapi_userinfo`），其余浏览器用下标 1 网站应用（`snsapi_login`）。
- **完成登录**：授权后微信回跳 `webvue/login/login_third.html?code=..&state=weixin@..`，该页服务端脚本从 `state` 的 `split("@")` 还原 `link_type`，自会话 `login:backurl` 取回跳地址（无则 `/index.html`），再调 `login.third_check(type, code)`（`svr/websvr/jsvm.func.login.go:248`）：内部先 `Get_Token(code)` 换取访问令牌并确定唯一用户 ID（优先 `unionid`、退回 `openid`，失败 `error:91`）；再 `Check_Link(user_id)` 反查绑定表得到本系统 `sid`（未绑定 `error:92`）；成功后把 `sid` 写入会话 `userId` 并调 `UserLoginSet` 完成登录（成功 `{error:0, info:"登录成功"}`，写会话失败 `error:93`），页面据此 302 回跳或转登录页。
- **绑定/解绑**：把**已登录**账号与微信绑定时调用 `login.third_link(type, code)`（先 `Get_Token` 再 `Set_Link` 写 `hr_user_third_link`，成功 `{error:0, info:"关联成功"}`，`svr/websvr/jsvm.func.login.go:314`）；查询绑定信息与解绑对应 `login.third_linkinfo(type)`、`login.third_delete(type)`。

## OAuth2 协议端点（`/connect/auth/third/*`）

除上述 JSVM 服务端函数方式外，第三方登录相关操作也可通过 OAuth2 协议端点访问。这些端点统一经 `auth_checkParams` 校验应用凭证（`appid/corpsecret` 或 `client_id/client_secret`），通过后委托 `login.LoginHandlerST` 执行与上述 JSVM 函数完全一致的业务逻辑。

源代码：[oauth2\_login.go](../../svr/sso/oauth2_login.go)

| 端点 | HTTP方法 | 对应 JSVM 函数 | 功能 |
|-----|---------|--------------|------|
| `/connect/auth/third/params` | POST | `login.thirdParams` | 获取第三方登录授权参数 |
| `/connect/auth/third/authorize` | POST | `login.ThirdAuthorize` | 发起第三方授权（服务端 302 跳转） |
| `/connect/auth/third/access_token` | POST | `login.ThirdCheck` | 第三方授权码换取令牌并完成登录 |
| `/connect/auth/third/linkinfo` | POST | `login.ThirdLinkInfo` | 查询当前用户的第三方绑定信息 |
| `/connect/auth/third/link` | POST | `login.ThirdLink` | 绑定第三方账号 |
| `/connect/auth/third/unlink` | POST | `login.ThirdUnLink` | 解绑第三方账号 |
| `/connect/auth/third/redirect` | GET | — | 第三方授权回调重定向（校验 backurl 域名白名单，拒绝非标准 URI 格式） |

> `/connect/auth/third/redirect` 不需要应用凭证参数，但会校验 `backurl` 的域名是否在应用可信域名白名单中，并拒绝非标准 URI 格式（如 `https:evil.com`）以防止域名校验绕过。其余端点均需在 URL query string 中携带应用凭证参数。
