# 会话操作（session）
# 一、函数
## 1.1 获取SessionId
```javascript
var session_id=session.getSessionId()
```
返回
undefined：不存在
string值：存在
## 1.2 获取值
```javascript
var session_id=session.getValue("key1")
```
返回
undefined：不存在
## 1.3 获取值（string类型）
```javascript
var session_id=session.getString("key1")
```
返回
undefined：不存在
## 1.4 获取值（int类型）
```javascript
var session_id=session.getInt("key1")
```
返回
undefined：不存在
## 1.5 获取值（int64类型）
```javascript
var session_id=session.getInt64("key1")
```
返回
undefined：不存在
## 1.6 获取值（float64类型）
```javascript
var session_id=session.getFloat64("key1")
```
返回
undefined：不存在
## 1.7 获取值（bool类型）
```javascript
var session_id=session.getBool("key1")
```
返回
undefined：不存在
## 1.8 设置值
```javascript
var ok1=session.set("key1","val1");
var ok2=session.set("key2",1);
var ok2=session.set("key3",1.1);
var ok2=session.set("key4",true);
var ok2=session.set("key4",{name:"name",code:"code"});
var ok2=session.set("key4",[{name:"name",code:"code"}.{name:"name2",code:"code2"}]);
```
返回
true：成功
false：失败
## 1.9 删除缓存
```javascript
session.delete("key1")
```
返回
undefined：不存在
## 1.10 注销缓存
```javascript
session.destroy()
```
返回
undefined：不存在