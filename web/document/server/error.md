# Log日志类型定义
- DEBUG：程序调试bug时使用。
- INFO：程序正常运行时使用，运行消息提示。
- WARNING：程序未按预期运行时使用，但并不是错误，如:用户登录密码错误。
- ERROR：程序出错误时使用，如:IO操作失败。
- CRITICAL：特别严重的问题，导致程序不能再继续运行时使用，如:磁盘空间为空，一般很少使用。

默认的是WARNING等级，当在WARNING或WARNING之上等级的才记录日志信息。
日志等级从低到高的顺序是: DEBUG < INFO < WARNING < ERROR < CRITICAL

# 系统错误定义
返回客户端json格式，error为0时，返回数据正确；大于0时，错误。
```json
{
	"error":404,
	"info":"用户未登录"
}
```
- 404：用户未登录
前台处理，跳转到登录
backurl=
