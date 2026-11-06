# 一、密钥操作类
类名：PasswordEncoder,用于用户密码处理操作

支持的哈希类型（`hashTypes`）：`YUANQI`、`SHA256`、`SHA1`、`SHA512`

## 0. crypto.subtle 可用性保障
```javascript
// @description  确保 crypto.subtle 可用。安全上下文使用浏览器原生实现；非安全上下文（HTTP 非 localhost）用 js-sha1/js-sha256 库 polyfill
// @return       {Promise<void>}
export function ensureCryptoSubtle(): Promise<void>
```
- 安全上下文（HTTPS / localhost）下直接返回，使用浏览器原生 `crypto.subtle`
- 非安全上下文下自动加载 `/scripts/crypto/sha1.min.js`、`/scripts/crypto/sha256.min.js` 进行 polyfill
- polyfill 支持 `SHA-1`、`SHA-256`；`SHA-512` 在非安全上下文下会抛错（需 HTTPS 或额外 polyfill）
- 内部缓存 Promise，多次调用只加载一次

> 在调用 `computeStandardHash`、`hashYuanqi` 等依赖 `crypto.subtle.digest` 的方法前，框架已内部调用 `ensureCryptoSubtle()`，业务侧通常无需手动调用。

## 1. 生成存储在数据库中的Hash串
```javascript
    // @description  已知密码的明文，返回其Hash串。格式：[协议名] + [hash] + [salt]
    // @param        {string} passwd - 明文密码
    // @param        {HashType} saltType - 协议类型（YUANQI/SHA256/SHA1/SHA512，空值默认 YUANQI）
    // @return       {string} 可以存储在数据库中的Hash串
    static async passwdHash(passwd: string, saltType: string): Promise<string>
```
内部流程：调用 `salt(saltType)` 生成盐值 → 调用 `hashBase64(passwd, salt, saltType)` 计算哈希 → 返回 `"{saltType}" + hashed + salt`

示例：
```javascript
const encrypted = await PasswordEncoder.passwdHash("123456", "YUANQI");
console.log(encrypted);
```

## 2. 加密密码（哈希计算）
```javascript
    // 哈希函数 - 支持SHA1, SHA256, SHA512，使用URL安全的base64编码
    // @param {string} passwd - 要加密的密码
    // @param {string} salt - 盐值
    // @param {string} hashType - 哈希类型 (SHA1, SHA256, SHA512, YUANQI)
    // @returns {Promise<string>} 加密后的密码（base64 编码）
    static async hashBase64(passwd: string, salt: string, hashType: string): Promise<string>
```
- `hashType` 为 `YUANQI` 时调用 `hashYuanqi`（UTF-16 小端、盐在前、SHA-1、标准 base64）
- `hashType` 为 `SHA256`/`SHA1`/`SHA512` 时调用 `computeStandardHash`（UTF-8、密码+盐拼接、URL 安全 base64）
- `salt` 或 `hashType` 为空时直接返回原密码

示例：
```javascript
    const encrypted = await PasswordEncoder.hashBase64("123456", 'xxxx-xxx', "YUANQI");
    console.log(encrypted);
```

## 3. 生成盐值
```javascript
    // 生成特定字节长度的盐字符串（URL 安全 base64 编码）
    // @param {string} hashType - 哈希类型，决定盐字节长度
    // @returns {Promise<string>} URL 安全 base64 盐值（+ -> -, / -> _, 去掉末尾 =）
    static async salt(hashType: string): Promise<string>
```
盐字节长度按 `hashType` 决定：

| hashType | 字节长度 | 说明 |
|----------|----------|------|
| YUANQI   | 20       | SHA-1 hash size |
| SHA256   | 32       | SHA-256 hash size |
| SHA1     | 20       | SHA-1 hash size |
| SHA512   | 64       | SHA-512 hash size |
| 其他     | 32       | 默认 |

示例：
```javascript
const salt = await PasswordEncoder.salt("SHA256");
console.log(salt);
```

## 4. 标准哈希计算（SHA1/SHA256/SHA512）
```javascript
    // 计算标准哈希，使用URL安全的base64编码
    // @param {string} passwd - 密码
    // @param {string} salt - 盐值
    // @param {string} hashType - 哈希类型 (SHA1/SHA256/SHA512)
    // @returns {Promise<string>} URL安全的base64编码哈希值
    static async computeStandardHash(passwd: string, salt: string, hashType: string): Promise<string>
```
- 使用 `TextEncoder` 将 `passwd + salt` 编码为 UTF-8 字节
- 内部调用 `ensureCryptoSubtle()` 确保 `crypto.subtle` 可用
- 计算失败时返回原密码（不抛错）

示例：
```javascript
const hash = await PasswordEncoder.computeStandardHash("123456", salt, "SHA256");
console.log(hash);
```

## 5. YUANQI 模式哈希
```javascript
    // YUANQI模式的哈希实现，与Go后端 hashYuanqi 行为保持一致
    // @param {string} passwd - 要加密的密码
    // @param {string} salt - 盐值
    // @returns {Promise<string>} 标准base64编码的哈希值
    static async hashYuanqi(passwd: string, salt: string): Promise<string>
```
实现细节：
1. 密码转换为 **UTF-16 小端字节序**
2. 盐值处理与 Go `base64.StdEncoding.DecodeString` 行为一致：仅当 salt 为合法标准 base64（长度为 4 的倍数、字符集合法、填充位置正确）时才解码，否则使用原始字符串字节（见 `isStandardBase64`）
3. 组合字节：**盐在前，密码在后**
4. 计算 **SHA-1** 哈希（通过 `ensureCryptoSubtle()` 保障 `crypto.subtle` 可用）
5. 返回**标准 base64**编码结果

示例：
```javascript
const hash = await PasswordEncoder.hashYuanqi("123456", "654321");
console.log(hash);
```

## 6. 判断合法标准 base64
```javascript
    // 判断字符串是否为合法的标准base64（与Go base64.StdEncoding一致）
    // @param {string} s - 待检测字符串
    // @returns {boolean} 是否为合法的标准base64
    static isStandardBase64(s: string): boolean
```
校验规则：
- 长度必须为 4 的倍数
- 字符集为 `A-Z a-z 0-9 + /`
- 末尾可有 0-2 个 `=` 填充，且 `=` 只能出现在末尾 1-2 位

示例：
```javascript
const ok = PasswordEncoder.isStandardBase64("dGVzdA==");
console.log(ok); // true
```

## 7. 十六进制转 ArrayBuffer
```javascript
    // 将十六进制字符串转换为ArrayBuffer
    // @param {string} hex - 十六进制字符串
    // @returns {ArrayBuffer} 转换后的ArrayBuffer
    static hexToBuffer(hex: string): ArrayBuffer
```
示例：
```javascript
const buf = PasswordEncoder.hexToBuffer("deadbeef");
console.log(buf);
```

# 二、前后端通讯类
类名：yqData,用于后台数据服务

## 1. 基本操作
- post请求
```javascript
const opts = {
       ajaxUrl: "/_db.html",
       dbname: "yqbase",                //数据库
       tbname: "",                       //表
       tempno: "-1"
      };
const res = await yqData.post(ajaxUrl, formData);
console.log(res);
```
ajaxUrl: 地址，string类型
formData: 提交数据，FormData类型
 
- 文件指纹计算 
与 Go 语言后端完全一致的实现
```javascript
const fingerprint = await yqData.fileFingerprint(file);
console.log(fingerprint);
```
file类型:file: File | string | ArrayBuffer

## 2. 取得全部数据库
```javascript
const options = {
	ajaxUrl: "_db.html"
};
const res = await yqData.dbList(options);
console.log(res);
```
res数据格式
```json
{
    "error": 0,
    "rows": [{
        "master": true,
        "name": "yqbase",
        "db_type": "sqlite",
        "describe": "测试数据库"
    }, {
        "master": false,
        "name": "db2",
        "db_type": "postgres",
        "describe": "主数据库"
    }]
}
```
error==0，返回数据rows
error!=0，返回错误信息info

## 3. 数据表字段、模板
- 获取实体表title数据
```javascript
const opts = {
       ajaxUrl: "/_db.html",
       dbname: "yqbase",                //数据库
       tbname: "",                       //表
       tempno: "-1"
      };
const res = await yqData.tbTitle(opts);
console.log(res);
```
res 数据格式
```json
{
    "error": 0,
    "info": "ok",
    "titles": [
        {
            "name": "textbox",
            "ui_title": "Textbox",
            "fd_type": "nvarchar",
            "length": 50,
            "decimal": 0,
            "ui_type": 2,
            "ui_width": 90,
            "ui_visible": true,
            "ui_readonly": false,
            "ui_mask": {
                "default": "默认值",
                "min": 0,
                "max": 50,
                "blank": false,
                "format": ""
            }
        },
        {
            "name": "checkbox",
            "is_func": false,
            "ui_title": "Checkbox",
            "fd_type": "boolean",
            "length": 1,
            "decimal": 0,
            "ui_type": 3,
            "ui_width": 30,
            "ui_visible": true,
            "ui_readonly": false,
            "ui_mask": {
                "default": true
            }
        },
		...
    ]
}
```

- 获取实体表mobel数据
```javascript
const opts = {
        ajaxUrl: "/_db.html",
        dbname: "yqbase",                //数据库
        tbname: "",                       //表
        tempno: "-1"
     };
const res = await yqData.tbModel(opts);
console.log(res);
```
res 数据格式
```json
{
    "error": 0,
    "info": "ok",
    "model": "<table>...</table>"
}
```

## 4. 数据库操作
- **查询，不分页**
```javascript
const opts = {
      ajaxUrl: "/_db.html",
      dbname: "yqbase",                //数据库
      tbname: "",                      //表
      where: "",
      order: ""
     };
const res = await yqData.dbTbSelect(opts);
console.log(res);
```
- where格式参数(同：分页及数据查询)
$.c_userid：当前登录人，如：c_userid=$.c_userid

res 数据格式
```json
{
    "error": 0,
    "info": "ok",
    "rows": [
        {
            "sid": "sid-1",
            "lable": "Lable-1",
            "textbox": "Textbox-1",
            "checkbox": true,
            "datebox": "2022/11/04",
            "richbox": "Richbox-1",
            "combobox": 2,
            "foreignkey": "foreignkey-1",
            "treeselect1": 1,
            "treeselect2": 201,
            "treeselect3": 20101,
            "numberbox": 10001.0199,
            "numberspinner": 9,
            "timespinner": "11:11",
            "datetimebox": "2022/11/04 11:11",
            "isdel":true,
            "state":9
        },
        ...
    ]
}
```

- **查询，分页**
```javascript
const opts = {
        ajaxUrl: "/_db.html",
        dbname: "yqbase",                //数据库
        tbname: "",                      //表
        where: "",
        order: "",
        pagesize: 5,
        pageno: 1
     };
const res = await yqData.dbTbPaging(opts);
console.log(res);
```
res 数据格式
```json
{
    "error": 0,
    "info": "ok",
    "pageNo": 1,
    "pageSize": 5,
    "pageCount": 3,
    "recordCount": 13,
    "rows": [
        {
            "sid": "sid-1",
            "lable": "Lable-1",
            "textbox": "Textbox-1",
            "checkbox": true,
            "datebox": "2022/11/04",
            "richbox": "Richbox-1",
            "combobox": 2,
            "foreignkey": "sid-2",
            "numberbox": 10001.0199,
            "numberspinner": 9,
            "timespinner": "11:11",
            "datetimebox": "2022/11/04 11:11"
        },
        ...
    ]
}
```

- 返回行数据
```javascript
const opts = {
         ajaxUrl: "/_db.html",
         dbname: "yqbase",                //数据库
         tbname: "ab_test",               //表
         keyid: "sid",
         keyval: "sid-1"
    };
const res = await yqData.dbTbRow(opts);
console.log(res);
```
res 数据格式
```json
{
    "error": 0,
    "info": "ok",
    "row": {
            "sid": "sid-1",
            "lable": "Lable-1",
            "textbox": "Textbox-1",
            "checkbox": true,
            "datebox": "2022/11/04",
            "richbox": "Richbox-1",
            "combobox": 2,
            "foreignkey": "sid-2",
            "numberbox": 10001.0199,
            "numberspinner": 9,
            "timespinner": "11:11",
            "datetimebox": "2022/11/04 11:11"
     }
}
```
- **取外键值**
```javascript
/*
   rows: [{ 
              dbname: "yqbase",      //数据库
              tbname: "a_test_tb",   //表
              field:"foreignkey",           //关键字段
              keyid:"sid",           //关键字段
              ids: ["id1", "id2"] }, //ids
           { 
              dbname: "yqbase",
              tbname: "a_test_tb2", 
              field:"foreignkey",
              keyid:"sid",
              ids: ["id-3", "id-4"] }
         ]
*/

const opts = {
             ajaxUrl: "_db.html",
             rows: [],
      };
const res = await yqData.dbTbForienKey(opts);
console.log(res);

```
res 数据格式
```json
[{
		"dbname": "yqbase",
		"tbname": "a_test_tb",
		"field": "foreignkey",
		"keyid": "sid",
		"rows": [{
			"sid": "id-1",
			"name": "name111"
		}, {
			"sid": "id-2",
			"name": "name222"
		}]
	},
	{
		"dbname": "yqbase",
		"tbname": "a_test_tb2",
		"field": "foreignkey",
		"keyid": "sid",
		"rows": [{
			"sid": "id-3",
			"name": "name333"
		}, {
			"sid": "id-4",
			"name": "name444"
		}]
	}
]
```
- **数据操作**
```javascript
/*
rows:[{"action":"add",row:{"name":"name1","code":"code1"}},...]
  添加
   {
      "action": "add",
      "row": {
                "name": "name1",
                ...
      }
   }

  修改
   {
      "action": "upp",
      "row": {
          "sid": "sid-1",
          "name": "name1",
          ...
      }
   }

  删除：
   {
      "action": "del",
      "row": {
          "sid": "sid-6"
      }
   }

  粘贴：
   {
      "action": "paste",
      "row": {
          "pid_field": "pid",
          "sid": "sid-6",
          "pid": "sid-7-1",
          "pid_old": "sid-7"
      }
   }

  移动：
   {
      "action": "move",
      "row": {
          "binding_field":"mm_id",
          "mm_id":"aaaaaaaa",
          "pid_field":"pid",
          "pid":"bbbbbbbbbbb",
          "ids": ["sid-1", "sid-4", "sid-3", "sid-2"]
      }
   }

  注销：可以应用 修改单一属性值接口
   {
       "action":"upp_",
       "row":{
            "sid":"sid-1",
            "isdel":false
       }
   }

  修改单一属性值：
   {
       "action":"upp_",
       "row":{
            "sid":"sid-1",
            "name":"name1",
            "code":"code1"
       }
   }
*/

const opts = {
         ajaxUrl: "/_db.html",
         action: "action",
         dbname: "yqbase",               //数据库
         tbname: "",                     //表
         rows: [],
         fileparm: null                  //文件参 {field_name:"",sto_type:1,sto_name:"12"}
    };
const res = await yqData.dbAction(opts);
console.log(res);
```
res 数据格式
```json
{
	"error": 0,
	"info": "ok",
	"rows": [{
			"error": 0,
			"info": "ok",
			"action": "add",
			"sid": "id-1"
		},
		...
	]
}
```

## 5. 文件数据信息
- 取得全部文件数据库
```javascript
const opts = {
       ajaxUrl: '/_file.html'
    };
const res = await yqData.fileList(opts);
console.log(res);
```
res 数据格式
```json
{
	"error": 0,
	"rows": [{
		"name": "yqbase",
		"type": 1,
		"db_type": "sqlite",
		"fs_type": "",
		"describe": "测试数据库"
	}, {
		"name": "db2",
		"type": 1,
		"db_type": "postgres",
		"fs_type": "",
		"describe": "主数据库"
	},
	...
	]
}
```

- **文件关联类型列表**
```javascript
const options = {
       ajaxUrl: '/_file.html',
       sto_type: 2,         //1-数据库存储，2-外部存储
       sto_name: null,      //外部存储库名
    };
const res = await yqData.fileRelTypes(opts);
console.log(res);
```
res 数据格式
```json
{
	"error": 0,
	"rows": [{
		"db_name": "yqbase",
		"tb_name": "cms_oneshot"
	}, {
		"db_name": "yqbase",
		"tb_name": "ab_test_html"
	}, {
		"db_name": "yqbase",
		"tb_name": "ab_test_file"
	}, {
		"db_name": "yqbase",
		"tb_name": "cms_news"
	}]
}
```
- 文件关联文件查询
```javascript
const opts = {
        ajaxUrl: '/_file.html',
        sto_type: 2,         //1-数据库存储，2-外部存储
        sto_name: null,       //外部存储库名
        where: "",
        order: "",
        pagesize: 5,
        pageno: 1
   };
const res = await yqData.fileRelPaging(opts);
console.log(res);
```
res 数据格式
```json
{
	"error": 0,
	"info": "OK",
	"rows": [{
		"c_userid": "22bd7aed-f114-4c59-9590-204e7d563245",
		"c_username": "spring",
		"createtime": "2023-03-10 14:52:32",
		"file_id": "836e80db-cc5f-4234-9625-e7313649bc72",
		"finger": "MdNlNtADh-XYu_s_EBk3faLltccGywDkfpfP9vFFTDo=",
		"linknum": 1,
		"name": "group.png",
		"sid": "009fe970-78f7-40d9-b54a-e4b358a76c5c",
		"size": 559,
		"tb_field": "icon",
		"tb_id": "9d9c54c2-6174-4d92-bbb6-396caf36df0b",
		"tb_name": "sys_menu",
		"type": "image/png"
	},
	...
	],
	"pageSize": 25,
	"pageNo": 1,
	"pageCount": 1,
	"recordCount": 13
}
```

- 未关联文件查询
```javascript
const opts = {
         ajaxUrl: '/_file.html',
         sto_type: 2,         //1-数据库存储，2-外部存储
         sto_name: null,       //外部存储库名
         where: "",
         order: "",
         pagesize: 5,
         pageno: 1
    };
const res = await yqData.fileNullPaging(opts);
console.log(res);
```
res 数据格式
```json
{
	"error": 0,
	"info": "OK",
	"rows": [{
		"c_userid": "22bd7aed-f114-4c59-9590-204e7d563245",
		"c_username": "spring",
		"createtime": "2023-03-10 14:52:32",
		"file_id": "836e80db-cc5f-4234-9625-e7313649bc72",
		"finger": "MdNlNtADh-XYu_s_EBk3faLltccGywDkfpfP9vFFTDo=",
		"linknum": 1,
		"name": "group.png",
		"sid": "009fe970-78f7-40d9-b54a-e4b358a76c5c",
		"size": 559,
		"tb_field": "icon",
		"tb_id": "9d9c54c2-6174-4d92-bbb6-396caf36df0b",
		"tb_name": "sys_menu",
		"type": "image/png"
	},
	...
	],
	"pageSize": 25,
	"pageNo": 1,
	"pageCount": 0,
	"recordCount": 0
}
```

- 文件上传
```javascript
const opts = {
        ajaxUrl: '/_file.html',
        sto_type: 2,          //1-数据库存储，2-外部存储
        sto_name: null,       //外部存储库名
        success: function (res) { },  // 上传完成
    }；
$.yqData.fileUpload(file, opts);
```

- 文件信息
```javascript
const opts = {
       ajaxUrl: '/_file.html',
       sto_type: 2,         //1-数据库存储，2-外部存储
       sto_name: null,       //外部存储库名
       sid: null,
    };
const res = await yqData.fileInfo(opts);
console.log(res);
```

## 6. 数据导出
```javascript
const opts = {  
       header: [
             { name: "a", title: "A" },
             { name: "b", title: "B" },
             { name: "c", title: "C" }],
       data: [
             { a: "a1", b: "b1", c: 1 },
             { a: "a2", b: "b2", c: 2 },
             { a: "a3", b: "b3", c: 3 }],
       mergeCells: [{
                    index: 0,
                    field: "a",
                    rowspan: 2,
                    colspan: 1
                }, {
                    index: 2,
                    field: "a",
                    rowspan: 1,
                    colspan: 2
                }],
       filename: "download.xls",
       ajaxUrl: "/_db.html"
   };
const res = await yqData.dataToExcel(opts);
console.log(res);
```

## 7. 导航信息
- 获取系统信息
```javascript
const opts = {
      ajaxUrl: "/_db.html",
      appnos: [1,2]   //系统nos
  };
const res = await yqData.dbApps(opts);
console.log(res);
```

- 取得菜单信息
```javascript
const opts = {
      ajaxUrl: "/_db.html",
      appno: 1                //系统no
  };
const res = await yqData.dbMenus(opts);
console.log(res);
```

## 8. 用户信息、退出操作
- 取得登录状态（当前登录用户）
```javascript
const res = await yqData.loginstate();
console.log(res);
```

- 退出
```javascript
const res = await yqData.logout();
console.log(res);
```

## 9. 实际表、字段信息
- 表信息
```javascript
const opts = {
      ajaxUrl: "/_db.html",
      dbname: "yqbase",                //数据库
      tbname: "",                       //表
  };
const res = await yqData.tbInfo(opts);
console.log(res);
```

- 字段信息
```javascript
const opts = {
      ajaxUrl: "/_db.html",
      dbname: "yqbase",                //数据库
      tbname: "",                       //表
   };
const res = await yqData.tbFields(opts);
console.log(res);
```

## 10. 存储过程操作
- 获取存储过程模版
```javascript
const opts = {
      ajaxUrl: "/_db.html",
      dbname: "yqbase",                //数据库
      tbname: "",                      //表
      actionval: 'add',                //操作值
   };
const res = await yqData.procModel(opts);
console.log(res);
```

- 存储过程信息
```javascript
const opts = {
      ajaxUrl: "/_db.html",
      dbname: "yqbase",                //数据库
      tbname: "",                      //表
      procname: 'abc_add',             //存储过程名
   };
const res = await yqData.procInfo(opts);
console.log(res);
```

- 保存存储过程
```javascript
const opts = {
      ajaxUrl: "/_db.html",
      dbname: "yqbase",                //数据库
      tbname: "",                      //表
      proc: '',                        //存储过程
   };
const res = await yqData.procSave(opts);
console.log(res);
```

# 三、ui操作类
类名：yqUiPub，ui处理相关方法

## 1. 属性定义

- **UI类型列表**
```javascript
uiTypes: Array<{no: number, name: string}>
```
包含以下UI类型：
| no | name | 说明 |
|----|------|------|
| 1 | Lable | 标签 |
| 2 | Textbox | 文本框 |
| 3 | Checkbox | 复选框 |
| 4 | Datetbox | 日期框 |
| 5 | Richbox | 富文本框 |
| 6 | Combobox | 下拉框 |
| 7 | ForeignKey | 外键 |
| 8 | TreeSelect | 树选择 |
| 9 | Numberbox | 数字框 |
| 10 | Numberspinner | 数字微调 |
| 11 | TimeSpinner | 时间微调 |
| 12 | DateTimebox | 日期时间框 |
| 13 | NCheckBox | 多选框 |
| 14 | NForeignKey | 多外键 |
| 15 | Table | 表格 |
| 16 | Tree | 树形 |
| 17 | Attr | 属性 |
| 18 | File | 文件 |
| 19 | Html | HTML |
| 20 | SCV | CSV |
| 21 | Func | 函数 |
| 900 | uiMask | 掩码 |

- **RichTextBox格式类型**
```javascript
uiType5Types: Array<{no: number, name: string}>
```
包含：base, html, aspx, js, css, txt, json, sql

## 2. 核心方法

- **转换位置值**
```javascript
convertWindowValue(value: any): number
```
将CSS单位值转换为数字：
- 像素值 (如 "50px")
- 百分比值 (如 "50%")
- 视窗高度单位 (如 "50vh")
- 视窗宽度单位 (如 "50vw")

- **格式化UI标题**
```javascript
formatUiTitles(title: yqDataIF.tbTitle[]): { titles: yqDataIF.tbTitle[], params: Record<string, any[]> }
```
处理UI标题的默认值、对齐方式等。

- **加载前格式化ui_mask**
```javascript
uiMaskLoadInit(ui_type: number, ui_mask: any): any
```
根据不同UI类型设置默认的ui_mask配置。

- **保存前格式化ui_mask**
```javascript
uiMaskSaveInit(ui_type: number, ui_mask: any): any
```
清理默认值，只保留非默认配置。

- **格式化行数据**
```javascript
formatRows(titles: any[], rows: any[]): any[]
formatRow(titles: any[], row: any): any
```

- **格式化值**
```javascript
formatValue(ui_type: number, uiMask: any, val: any): any
```
根据UI类型格式化单个值。

- **验证值**
```javascript
checkValue(ui_type: number, uiMask: any, val: any): { error: boolean, msg: string }
```
验证值是否符合规则。

- **获取默认行数据**
```javascript
getDefaultRow(titles: yqDataIF.tbTitle[]): any
```
根据titles配置生成默认行数据。

- **获取外键数据**
```javascript
async getForeignkeys(opts: {
    ajaxUrl?: string,
    rows: any[],
    titles: any[],
    fk_rows?: any[]
}, isDemo: boolean = false): Promise<any[]>
```
批量获取外键数据。

## 3. 日期处理

- **转换为日期对象**
```javascript
convert_todate(value: any): Date | null
```
支持多种日期格式转换。

- **格式化为RFC3339**
```javascript
formatDateToRFC3339(date: any): string | null
```
输出示例：`"2025-10-19T15:30:00+08:00"`

- **通用日期格式化**
```javascript
formatDate(date: Date, format: string): string
```
支持的格式标记：
- `yyyy` - 年
- `MM` - 月
- `dd` - 日
- `hh` - 时
- `mm` - 分
- `ss` - 秒
- `q` - 季度
- `S` - 毫秒

## 4. 格式化方法

- **格式化为bool**
```javascript
formattercheckbox(value: any): boolean | null
```

- **格式化日期框**
```javascript
formatterdatebox(value: any, format?: string): string | null
```

- **格式化外键显示**
```javascript
formatterforeignkey(value: any, fk_rows: any[], dbname: string, tbname: string, keyid: string): string | null
```

- **格式化外键数据**
```javascript
formatForienKeys(rows: any[], titles: any[]): any[]
```

## 5. 类型转换

- **转换为整数**
```javascript
toInt(val: any): number | null
```

- **转换为数字**
```javascript
toNumber(val: any): number | null
```
 