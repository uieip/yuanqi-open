金仓数据库 KingbaseES
# 安装

## 创建数据库实例
- 兼容模式：pg，即创建postgresql兼容模式数据库
- 新建系统数据库：
  使用 数仓 数据库开发工具 KStudio 创建用户“postgres”，设置权限为数据库管理员，创建“yqbase”数据库，设置数据库的管理用户为“postgres”。
  由于KStudio不显示名称为“sys”的模式，请用DBeaver连接数据库，并恢复数据库实例（DBeaver用postgres模式连接）。

## uieip的config数据库连接配置示例:
```json
{
    ... 
    "db": {
        "lists": [
            "yqbase"
        ],
        "wf": "yqbase",
        "yqbase": {
            "dbType": "kingbase",
            "describe": "主数据库-KingbaseES",
            "connStr": "host=127.0.0.1 port=54320 user=postgres password=postgres.123 dbname=yqbase sslmode=disable connect_timeout=3 statement_timeout=30000 application_name=kingbase-official",
            "maxOpenConns": 50,
            "maxIdleConns": 50,
            "maxLiftTime": 5,
            "maxIdleTime": 5
        },
		...
    },
    "file": {
        "lists": [
            "sqlite",
            "kbfile"
        ],
        ...
        "kbfile": {
            "describe": "KingbaseES 数据库",
            "dbType": "kingbase",
            "connStr": "host=127.0.0.1 port=54320 user=postgres password=postgres.123 dbname=yqbase sslmode=disable connect_timeout=3 statement_timeout=30000 application_name=kingbase-official",
            "fsType": "local",
            "fsPath": "D:\\Spring\\yuanqi.go\\files2\\",
            "maxOpenConns": 25,
            "maxIdleConns": 25,
            "maxLiftTime": 10,
            "maxIdleTime": 10
        }
    },
   ...
}
```


# golang驱动开发配置
将“Kingbase安装目录\ES\V9\Interface\golang”下的gokb解压，拷贝到项目跟目录“local-deps\kingbase.com"，文件结构：
```
+ local-deps
    + kingbase.com
   	  + gokb
	  		driver.go
			go.mod
			oid.a
			scram.a
			sm3.a
		gokb.a
```
- local-deps\kingbase.com\gokb 下添加driver.go、go.mod

driver.go
```go
package gokb

import (
	"database/sql"
	"database/sql/driver"
)

// Kingbase 驱动
type KingbaseDriver struct{}

func (d *KingbaseDriver) Open(name string) (driver.Conn, error) {
	return nil, nil
}

func init() {
	sql.Register("kingbase", &KingbaseDriver{})
}
```
go.mod
```
module kingbase.com/gokb

go 1.24.2
```

- 项目根目文件 go.mod 文件内添加gokb引用
```
require kingbase.com/gokb v1.0.0
replace kingbase.com/gokb v1.0.0 => ./local-deps/kingbase.com/gokb
```

- 开发中使用方法

```go
package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "kingbase.com/gokb"
)

const (
	host     = "127.0.0.1"
	port     = "54320"
	user     = "postgres"
	password = "postgres.123"
	dbname   = "yqbase"
)

func main() {
	// 构建 KingbaseES 连接字符串
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable connect_timeout=3 statement_timeout=30000 application_name=kingbase-official",
		host, port, user, password, dbname)

	fmt.Println("🚀 KingbaseES 接口测试开始")
	fmt.Printf("连接: %s@%s:%s/%s\n", user, host, port, dbname)

	// 使用 KingbaseES 原生驱动连接
	db, err := sql.Open("kingbase", connStr)
	if err != nil {
		log.Fatalf("❌ 连接失败: %v", err)
	}
	defer db.Close()
	
	//其它方法
}

```