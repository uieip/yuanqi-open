# CAS 2.0 单点登录协议接口文档

## 概述
CAS 2.0 (Central Authentication Service) 是一种基于 Web 的单点登录协议标准，提供统一身份认证服务。本文档描述 CAS Server 的核心接口规范。

## 接口概览
| 接口名称 | 端点 | HTTP方法 | 功能描述 |
|---------|------|----------|---------|
| 认证入口 | `/connect/cas/login` | GET | 用户认证入口点 |
| 票据验证 | `/connect/cas/servicevalidate` | GET | 服务票据验证 |
| 代理流程 | `/connect/cas/proxy` | GET | 代理票据（PT）/代理授予票据（PGT）流程 |
| 获取用户详细信息 | `/connect/cas/getuserdetail` | POST | 获取用户详细信息 |
| 单点登出 | `/connect/cas/logout` | GET | 全局会话终止 |

## 1. 认证接口 - `/connect/cas/login`

### 请求参数
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `service` | string | 是 | 认证后重定向的目标服务URL | `http://www.uieip.com/callback` |

### 响应
- **认证成功**：HTTP 302重定向到`service`参数指定的URL，附加`ticket`参数
```http
  Location: http://www.uieip.com/callback?ticket=1234567890abcdef
```

- **认证失败**：
  - 用户未登录：HTTP 302 重定向到 `{scheme}://{host}/login/login.html?backurl=<认证入口链接>`，登录成功后再经 backurl 回到本端点并携带 `ticket` 跳回 service；
  - 应用校验失败（service 缺失、域名未授权等）：HTTP 500 返回错误文本。

## 2. 票据验证接口 - `/connect/cas/servicevalidate`
- 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `ticket` | string | 是 | 服务票据(ST) | `1234567890abcdef` |
| `service` | string | 是 | 关联的服务URL | `http://www.uieip.com/callback` |
| `format` | string | 否 | 响应格式，仅支持 `json`/`xml`（大小写敏感），缺省或非法时按 `xml` 处理 | `json` |

- 成功响应（XML格式）
```xml
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
  <cas:authenticationSuccess>
    <cas:user>username</cas:user>
    <cas:attributes>
	  <cas:login>user@example.com</cas:login>
      <cas:phone>1234567890</cas:phone>
      <cas:email>user@example.com</cas:email>
    </cas:attributes>
    <cas:proxyGrantingTicket>1234567890abcdef</cas:proxyGrantingTicket>
  </cas:authenticationSuccess>
</cas:serviceResponse>
```

- 失败响应（XML格式）
```xml
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
  <cas:authenticationFailure code="INVALID_TICKET">
    invalid ticket
  </cas:authenticationFailure>
</cas:serviceResponse>
```
  说明：`code` 属性取值与错误码映射关系为 `INVALID_TICKET`（票据无效）、`INVALID_SERVICE`（service 缺失/域名未授权）、`INVALID_REQUEST`（参数错误）、`INTERNAL_ERROR`（其他未知错误）；元素文本为错误描述。

- 成功响应（JSON格式）
```json
{
	"errcode": 0,
	"errmsg": "ok",
	"ticket": "1234567890abcdef",
	"user": "username",
	"attributes":{
		"login":"user@example.com",
		"phone":"1234567890",
		"email":"user@example.com"
	}
}
```

- 失败响应（JSON格式）
```json
{
	"errcode": 50001,
	"errmsg": "invalid ticket",
	"access_token": "",
	"expires_in": 0
}
```
  说明：失败响应沿用 OAuth2 统一的 token 响应结构体，因此始终包含空的 `access_token`/`expires_in` 字段。本端点（servicevalidate）失败时 `errcode` 为 `50001`（票据缺失或无效，对应 `INVALID_TICKET`）或 `40001`（service 校验失败，对应 `INVALID_SERVICE`）。

## 3. 代理流程 - `/connect/cas/proxy`

处理 CAS 代理流程，使用代理授予票据（PGT）换取代理票据（PT），供代理服务访问目标服务。

- 请求方式：GET

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `pgt` | string | 是 | 代理授予票据 | `PGT-1234567890` |
| `targetService` | string | 是 | 目标服务 URL | `http://app.uieip.com/service` |
| `format` | string | 否 | 响应格式，仅支持 `json`/`xml`，缺省按 `xml` 处理 | `json` |

- 成功响应（XML格式）
```xml
<cas:proxySuccess xmlns:cas="http://www.yale.edu/tp/cas">
  <cas:proxyTicket>PT-1234567890abcdef</cas:proxyTicket>
</cas:proxySuccess>
```

- 成功响应（JSON格式）
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "proxyTicket": "PT-1234567890abcdef",
  "proxyGrantingTicket": "PGT-1234567890"
}
```

- 失败响应：参数缺失或 PGT 无效时返回错误（XML/JSON 格式同 §2 失败响应结构，`errcode` 为 `50001`）。

## 4. 获取用户详细信息 - `/connect/cas/getuserdetail`
- 请求方式：POST
- url请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `service` | string | 是 | 关联的服务URL | `http://www.uieip.com/callback` |

- 请求包体：
```json
{
   "userid": "USER"
}
```

返回结果：
```json
{
	"errcode": 0,
	"errmsg": "ok",
	"attributes": {
		"code": "1",
		"gender": 1,
		"login_email": "dengzw@yqsite.com",
		"login_name": "spring",
		"login_phone": "15210221375",
		"name": "spring",
		"user_type": 1,
		"userid": "22bd7aed-f114-4c59-9590-204e7d563245"
	}
}
```

## 5. 单点登出接口 - `/connect/cas/logout`
- 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `service` | string | 否 | 登出后重定向URL | `https://www.uieip.com/logout` |

