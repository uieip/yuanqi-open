# SAML 2.0 单点登录协议接口文档

## 概述

SAML 2.0 (Security Assertion Markup Language) 是一种基于 XML 的开放标准协议，用于在身份提供者（IdP）和服务提供者（SP）之间交换身份认证和授权数据。本系统作为 SAML 2.0 IdP 提供服务。

### 支持的功能

- **SP 发起登录**：服务提供商通过 AuthnRequest 发起单点登录
- **HTTP-Redirect 绑定**：AuthnRequest 通过 GET 请求传递
- **HTTP-POST 绑定**：SAML Response 通过 HTML 表单自动 POST 提交
- **单点登出（SLO）**：支持 SP 发起的单点登出
- **IdP 元数据**：提供标准的 IdP 元数据 XML
- **属性断言**：支持用户属性（login、email、phone）在 SAML Assertion 中传递

---

## 接口概览

| 接口名称 | 端点 | HTTP方法 | 功能描述 |
|---------|------|----------|---------|
| IdP 元数据 | `/connect/saml/metadata` | GET | 获取 IdP 元数据 XML |
| 应用元数据 | `/connect/saml/appmetadata` | GET | 获取应用元数据（委托 metadata 处理） |
| 登录入口 | `/connect/saml/login` | GET | 接收 SP 发起的 AuthnRequest |
| 断言消费 | `/connect/saml/acs` | GET | 登录成功后的回调处理 |
| 单点登出 | `/connect/saml/logout` | GET / POST | 单点登出（详见 §4） |
| 接收断言 | `/connect/saml/receiveresponse` | POST | SP 接收 SAML Response 的端点 |
| 测试登录 | `/connect/saml/testlogin` | GET | 快速测试登录入口 |

---

## 1. IdP 元数据 - `/connect/saml/metadata`

### 说明

返回 SAML 2.0 IdP 元数据 XML，SP 可通过此端点自动配置 IdP 信息。`EntityDescriptor` 携带 `validUntil` 属性（取值 = 生成时刻 UTC 起 365 天），`entityID` 为 `{scheme}://{host}`。

### 请求示例

```
GET /connect/saml/metadata HTTP/1.1
Host: sso.example.com
```

### 响应示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="http://sso.example.com" validUntil="2025-01-01T00:00:00Z">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService index="0" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="http://sso.example.com/connect/saml/acs"/>
    <AssertionConsumerService index="1" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://sso.example.com/connect/saml/login"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="http://sso.example.com/connect/saml/logout"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://sso.example.com/connect/saml/logout"/>
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified</NameIDFormat>
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</NameIDFormat>
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</NameIDFormat>
  </SPSSODescriptor>
</EntityDescriptor>
```

---

## 2. 应用元数据 - `/connect/saml/appmetadata`

### 说明

获取应用元数据，内部委托 `SAML_HandleMetadata` 处理，返回内容与 §1 IdP 元数据一致。该端点供 SP 按应用维度获取元数据。

### 请求示例

```
GET /connect/saml/appmetadata HTTP/1.1
Host: sso.example.com
```

### 响应

与 §1 IdP 元数据响应格式一致，返回 SAML 2.0 元数据 XML。

---

## 3. 登录入口 - `/connect/saml/login`

### 说明

SP 通过 HTTP-Redirect 绑定将用户重定向到此端点，请求中包含 base64 编码的 SAML AuthnRequest。

### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `SAMLRequest` | string | 是 | Base64 编码的 AuthnRequest XML | `PD94bWwgdmVyc2lvbj0iMS4wIj8+...` |
| `RelayState` | string | 否 | 回调状态数据 | `https://sp.example.com/callback` |

### 处理流程

1. 解码并解析 SAML AuthnRequest XML
2. 校验 Issuer 非空（`validateSAMLApplication` 的应用级校验已实现但尚未接入本流程）
3. 缓存 SAML 请求状态（request_id、issuer、acs_url）
4. 检查用户是否已登录：
   - **已登录**：自动生成 SAML Response，通过 HTML 表单 POST 到 SP 的 ACS URL
   - **未登录**：重定向到系统登录页面，登录成功后回调到 `/connect/saml/acs`

### SP 端 AuthnRequest 示例

```xml
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    ID="_abc123" Version="2.0" IssueInstant="2024-01-01T00:00:00Z"
    Destination="https://sso.example.com/connect/saml/login"
    AssertionConsumerServiceURL="https://sp.example.com/saml/acs"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
    https://sp.example.com
  </saml:Issuer>
</samlp:AuthnRequest>
```

---

## 4. 断言消费 - `/connect/saml/acs`

### 说明

用户登录成功后回调此端点，生成 SAML Response 并自动 POST 到 SP 的 ACS URL。

### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `RequestID` | string | 是 | 缓存的 SAML 请求 ID | `_abc123` |

### 处理流程

1. 根据 RequestID 获取缓存的 SAML 请求状态
2. 检查用户登录状态（若未登录则重定向到登录页面）
3. 生成 SAML Response XML（包含断言、属性、条件等）
4. 返回包含 `SAMLResponse` 的 HTML 表单页面，自动 POST 提交到 SP 的 ACS URL

### 生成的 SAML Response 示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    ID="_def456" Version="2.0" IssueInstant="2024-01-01T00:01:00Z"
    Destination="https://sp.example.com/saml/acs"
    InResponseTo="_abc123">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
    https://sso.example.com/connect/saml
  </saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
      ID="_ghi789" IssueInstant="2024-01-01T00:01:00Z" Version="2.0">
    <saml:Issuer>https://sso.example.com/connect/saml</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">
        user-id-123
      </saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData InResponseTo="_abc123"
            NotOnOrAfter="2024-01-01T00:06:00Z"
            Recipient="https://sp.example.com/saml/acs"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="2024-01-01T00:01:00Z"
        NotOnOrAfter="2024-01-01T00:06:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>https://sp.example.com</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="2024-01-01T00:01:00Z"
        SessionIndex="_session123">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>
          urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport
        </saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="login" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"
          FriendlyName="Login">
        <saml:AttributeValue>john.doe</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"
          FriendlyName="Email">
        <saml:AttributeValue>john@example.com</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
```

---

## 5. 单点登出 - `/connect/saml/logout`

### 说明

支持 SP 发起的单点登出（SLO），GET 和 POST 两种方式均已注册路由，均可正常访问。清除本端登录会话后，按 `RelayState`（或 `redirect`）参数重定向，缺省回到站点根 URL。

POST 方式处理 `SAMLRequest` LogoutRequest 并自动回发 LogoutResponse；GET 方式直接清除会话并重定向。

### 请求参数（GET 方式）

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `RelayState` | string | 否 | 登出后的重定向地址 | `https://sp.example.com` |

### 请求参数（POST 方式）

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `SAMLRequest` | string | 是 | Base64 编码的 LogoutRequest XML |
| `RelayState` | string | 否 | 回调状态数据 |

---

## 6. 接收断言 - `/connect/saml/receiveresponse`

### 说明

SP 接收 SAML Response 后，可调用此端点解析并验证返回的用户信息（用于测试场景）。

### 请求方式：POST

### 请求参数（Form Data）

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| `SAMLResponse` | string | 是 | Base64 编码的 SAML Response XML | `PD94bWwgdmVyc2lvbj0iMS4wIj8+...` |
| `RelayState` | string | 否 | 回调状态数据 |

### 成功响应

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "userid": "22bd7aed-f114-4c59-9590-204e7d563245",
  "relayState": "https://sp.example.com",
  "attributes": {
    "login": "spring",
    "email": "dengzw@yqsite.com",
    "phone": "15210221375"
  }
}
```

---

## 7. 测试登录 - `/connect/saml/testlogin`

### 说明

用于快速测试 SAML 登录流程，自动生成 AuthnRequest 并重定向到登录入口。

### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 默认值 |
|--------|------|------|------|--------|
| `issuer` | string | 否 | SP 实体标识 | `http://www.uieip.com/` |
| `acs` | string | 否 | SP 的 ACS URL | `{issuer}/saml/acs` |

> 说明：`issuer` 缺省时默认取 `http://www.uieip.com/`（末尾带 `/`）；`acs` 缺省时由代码将 `issuer` 与 `/saml/acs` 直接字符串拼接，若 `issuer` 以 `/` 结尾会产生双斜杠地址。

---

## SP 端集成指南

### 基本配置步骤

1. **获取 IdP 元数据**：从 `/connect/saml/metadata` 获取 IdP 元数据 XML
2. **配置 SP**：将 IdP 元数据导入 SP 的 SAML 配置
3. **配置 ACS URL**：在 SP 中设置 ACS URL 为接受的断言消费端点
4. **配置 Entity ID**：在 SP 中设置 Entity ID（Issuer）
5. **发起登录**：用户访问 SP 受保护资源时，SP 生成 AuthnRequest 并重定向到 IdP

### 集成注意事项

- **NameID 格式**：默认使用 `unspecified` 格式，用户 ID 作为 NameID
- **属性映射**：支持 `login`、`email`、`phone` 等标准属性
- **签名验证**：当前实现未使用 XML 签名（`AuthnRequestsSigned=false`, `WantAssertionsSigned=false`），建议在生产环境中启用
- **会话管理**：登录会话默认有效期为 1 小时
- **断言有效期**：SAML Assertion 默认有效期为 5 分钟

---

## 错误码

| 错误码 | 说明 | 实际返回情况 |
|--------|------|------|
| 70001 | 请求参数无效 | 预留，当前无触发路径 |
| 70002 | 应用不存在或已禁用 | 预留（`validateSAMLApplication` 未接入），当前无触发路径 |
| 70003 | SAML Response 无效 | receiveresponse 实际返回 |
| 70004 | 会话无效或已过期 | 预留，当前无触发路径 |
| 70005 | ACS URL 无效 | 预留，当前无触发路径 |
| 70006 | Issuer 无效 | 预留，当前无触发路径 |
| 70007 | 断言验证失败 | receiveresponse 实际返回 |

> 说明：
> - `70003`/`70007` 由 `/connect/saml/receiveresponse` 返回（HTTP 200 + JSON，沿用统一 token 响应结构体，含空的 `access_token`/`expires_in` 字段）；
> - `/connect/saml/login`、`acs`、`logout` 等端点的参数缺失、Base64 编码错误、XML 解析错误等一律返回 **HTTP 400 纯文本**错误信息（`metadata`/`testlogin` 内部生成失败返回 HTTP 500），不使用上表错误码。
