# LDAP 单点登录

为了支持 LDAP 模式登录验证的需求（如深信服 VPN），系统内置 LDAP Service，提供 Bind、Search 服务支持。

- **LDAP Version**：3
- **Base DN**：`dc=yqsite,dc=com`（可配置）
- **服务端口**：389（可配置）

## 用户验证模式

- **Username**：`cn=spring,dc=yqsite,dc=com`
- **Password**：密码
