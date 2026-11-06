# PostgreSQL 安装与使用笔记

## 1. Docker 安装 PostgreSQL

```bash
# 拉取官方镜像（可指定版本，如 postgres:16）
docker pull postgres:16

# 启动容器
docker run -d \
  --name my-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres.123 \
  -e POSTGRES_DB=yqbase \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

验证安装

```bash
# 查看容器状态
docker ps

# 进入容器测试连接
docker exec -it my-postgres psql -U postgres -d yqbase
```
常用管理命令

```bash
# 查看容器状态
docker ps

# 进入容器测试连接
docker stop my-postgres    # 停止
docker start my-postgres   # 启动
docker logs my-postgres    # 查看日志
```

## 2. Windows 环境下安装 PG

- 安装文件下载地址：[https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
- 默认管理员：postgres，安装时设置管理员密码（记住密码）
- 默认数据库端口号：5432（可修改）

## 3. Ubuntu 环境下安装 PG

### 3.1 安装

**1、更新软件包列表**

确保你的系统软件包是最新的。

```bash
sudo apt update
sudo apt upgrade -y
```

**2、安装 PostgreSQL**

Ubuntu 默认仓库中包含 PostgreSQL，直接安装即可。

```bash
sudo apt install postgresql postgresql-contrib -y
```

- postgresql：主程序包
- postgresql-contrib：额外的扩展和工具

**3、检查 PostgreSQL 服务状态**

安装完成后，PostgreSQL 服务会自动启动。检查其状态：

```bash
sudo systemctl status postgresql
```

如果服务未运行，可以手动启动：

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql  # 设置开机自启
```

**4、连接到 PostgreSQL**

PostgreSQL 安装后会自动创建一个名为 postgres 的系统用户。切换到该用户：

```bash
sudo -i -u postgres
```

然后连接到数据库：

```bash
psql
```

或者直接使用：

```bash
sudo -u postgres psql
```

**5、基本操作（在 psql 中）**

- 查看所有数据库

```bash
\l
```

- 创建新数据库

```sql
CREATE DATABASE yqbase;
```

- 创建用户并设置密码

```sql
CREATE USER myuser WITH PASSWORD 'mypassword';
```

- 授予用户权限

```sql
GRANT ALL PRIVILEGES ON DATABASE yqbase TO myuser;
```

- 退出 psql

```bash
\q
```

### 3.2 配置

**1、为 postgres 用户设置密码**

- 进入 psql

```bash
sudo -u postgres psql
```

- 修改 postgres 用户的密码

```sql
ALTER USER postgres WITH PASSWORD 'your-new-password';
```

- 退出

```bash
\q
```

**2、修改 postgresql.conf 以监听远程连接**

- 打开 postgresql.conf 文件

```bash
sudo nano /etc/postgresql/<version>/main/postgresql.conf
```

- 找到 listen_addresses 并修改为

```conf
listen_addresses = '*'  # 监听所有 IP 地址
```

**3、修改 pg_hba.conf 以允许远程认证**

- 打开 pg_hba.conf

```bash
sudo nano /etc/postgresql/<version>/main/pg_hba.conf
```

- 在文件末尾添加一行，允许特定 IP 或所有 IP 连接

```conf
# 允许所有 IP 使用密码连接（生产环境建议限制 IP）
host    all             all             0.0.0.0/0               md5

# 或者仅允许特定 IP（如 192.168.1.100）
host    all             all             192.168.1.100/32        md5
```

## 4. 数据库开发工具

- 可视化数据库开发工具推荐使用：**DBeaver**
- 使用 psql 命令行模式

测试数据库连接：

```bash
psql -h 127.0.0.1  -p 5432 -U postgres -d postgres
psql -h 192.168.1.21  -p 5432 -U postgres -d postgres
```

修改数据库密码：

```bash
sudo -u postgres psql -c "\password postgres"
```

## 5. 数据库程序

### 5.1 PL/pgSQL 块结构示例

```sql
DO
$$
DECLARE
  counter integer := 0;
BEGIN
    counter := counter + 1;
    RAISE NOTICE 'The current value of counter is %', counter;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 PL/pgSQL 子结构块

```sql
DO $$
<<outer_block>>
DECLARE
  counter integer := 0;
BEGIN
   counter := counter + 1;
   RAISE NOTICE 'The current value of counter is %', counter;

   DECLARE
       counter integer := 0;
   BEGIN
       counter := counter + 10;
       RAISE NOTICE 'The current value of counter in the subblock is %', counter;
       RAISE NOTICE 'The current value of counter in the outer block is %', outer_block.counter;
   END;

   RAISE NOTICE 'The current value of counter in the outer block is %', counter;

END outer_block;
$$ LANGUAGE plpgsql;
```

### 5.3 RAISE 函数

RAISE 函数打印字符串，使用 RAISE 语句报告消息以及抛出错误，自定义错误信息。

```sql
RAISE level 'format' [, expression [, ...]];
```

level 选项指定了错误的严重性。允许的级别有 DEBUG、LOG、INFO、NOTICE、WARNING 以及 EXCEPTION，默认级别是 EXCEPTION。

用法如下：

```sql
RAISE NOTICE 'My name is %, I am a %.', 'ABCC', 'coder';
```

### 5.4 JSON

```sql
-- -> 返回 json
SELECT '[{"a":"foo"},{"b":"bar"},{"c":"baz"}]'::json -> 2;      -- 输出 {"c":"baz"}
SELECT '{"a": {"b":"foo"}, "c":{"a": "aaa"}}'::json -> 'a';     -- 输出 {"b":"foo"}

-- ->> 返回文本
SELECT '[{"a":"foo"},{"b":"bar"},{"c":"baz"}]'::json ->> 2;      -- 输出 {"c":"baz"}
SELECT '{"a": {"b":"foo"}, "c":{"a": "aaa"}}'::json ->> 'a';    -- 输出 {"b":"foo"}

-- #> 获取 json 子对象
SELECT '{"a": {"b":{"c": "foo"}}}'::json #> '{a,b}';            -- 输出 {"c": "foo"}
SELECT '{"a": {"b":{"c": "foo"}}}'::json #>> '{a,b}';           -- 输出 {"c": "foo"}

-- @> 判断第一个 json 是否包含第二个
SELECT '{"a":1, "b":2}'::jsonb @> '{"b":2}'::jsonb;             -- 输出 true

-- <@ 判断第一个 json 是否包含于第二个
SELECT '{"b":2}'::jsonb <@ '{"a":1, "b":2}'::jsonb;             -- 输出 true
```

常用操作符：

| 序号 | json & jsonb | 右侧操作符类型 | 备注 |
|--|--|--|--|
| 1 | -> | int | 获取 json 数组的元素 |
| 2 | -> | text | 通过 key 获取 json 对象字段 |
| 3 | ->> | int | 获取 json 数组元素为字符串 |
| 4 | ->> | text | 获取 json 对象字段为字符串 |
| 5 | #> | text[] | 在指定路径下获取 json 对象 |
| 6 | #>> | text[] | 在指定路径下获取 json 对象为字符串 |

（*使用时需要测试验证）

### 5.5 读取 JSON 数组

```sql
SELECT T::json ->> 'a' AS A,
       T::json ->> 'b' AS B
  FROM json_array_elements('[{"a":"foo1","b":"bar1"},{"a":"foo2","b":"bar2"}]') AS T;
```

```sql
DO
$$
DECLARE
  jsons json := '[{"action":"add","row":{"textbox":"123456","checkbox":false}}
                 ,{"action":"upp","row":{"sid":"73472c6d-3889-7d4f-3a07-41a100a43b62","textbox":"upsssssss","checkbox":false}}
                 ,{"action":"del","row":{"sid":"4dae0265-5829-a59e-f00c-8bdf479dfe6b"}}]';

  _action   varchar;
  _sid      varchar;
  _textbox  varchar;
  _checkbox boolean;

  test_cur refcursor;
BEGIN
    OPEN test_cur FOR
        SELECT
            T::json ->> 'action',
            T::json #> '{row}' ->> 'sid',
            T::json #> '{row}' ->> 'textbox',
            T::json #> '{row}' ->> 'checkbox'
          FROM json_array_elements(jsons) AS T;

    LOOP
        FETCH test_cur INTO _action, _sid, _textbox, _checkbox;

        IF FOUND THEN
            RAISE NOTICE 'action=% sid=% textbox=% checkbox=%', _action, _sid, _textbox, _checkbox;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    CLOSE test_cur;
END;
$$ LANGUAGE plpgsql;
```

### 5.6 读取 JSON 对象

```sql
SELECT '{"a":"avalue","b1":"b1value"}'::json ->> 'a';
```

### 5.7 程序执行

```sql
SELECT sys.sys_menu_infos(0, '', '*', '*') AS jsons;
```

### 5.8 查询

**树形查询**

```sql
WITH RECURSIVE
cte1(
    sid,
    pid,
    name,
    code,
    queue
) AS (
    SELECT
        sid,
        pid,
        name,
        code,
        queue
    FROM ab_test_tree
    WHERE pid IS NULL
    UNION ALL
    SELECT
        t1.sid,
        t1.pid,
        t1.name,
        t1.code,
        t1.queue
    FROM ab_test_tree t1
    INNER JOIN cte1
    ON t1.pid = cte1.sid
)
SELECT * FROM cte1;
```

**树形遍历查询生成 t_level、t_path**

```sql
WITH RECURSIVE
tree0 AS (SELECT
        sid,
        pid,
        name,
        code,
        1 t_level,
        REPLACE(to_char(queue, '99'), ' ', '0') t_path,
        queue
    FROM ab_test_tree
    WHERE pid IS NULL),
tree1(
        sid,
        pid,
        name,
        code,
        t_level,
        t_path,
        queue
) AS (
    SELECT
        sid,
        pid,
        name,
        code,
        t_level,
        t_path,
        queue
    FROM tree0
    UNION ALL
    SELECT
        t1.sid,
        t1.pid,
        t1.name,
        t1.code,
        _t1.t_level + 1 t_level,
        _t1.t_path || REPLACE(to_char(t1.queue, '99'), ' ', '0') t_path,
        t1.queue
    FROM ab_test_tree t1
    INNER JOIN tree1 _t1
    ON t1.pid = _t1.sid
)
SELECT * FROM tree1 ORDER BY t_path;
```

**树形遍历查询生成 t_level、t_path，并更新**

```sql
WITH RECURSIVE
tree0 AS (SELECT
        sid,
        pid,
        1 t_level,
        REPLACE(to_char(queue, '99'), ' ', '0') t_path
    FROM ab_test_tree
    WHERE pid IS NULL),
tree1(
        sid,
        pid,
        t_level,
        t_path
) AS (
    SELECT
        sid,
        pid,
        t_level,
        t_path
    FROM tree0
    UNION ALL
    SELECT
        t1.sid,
        t1.pid,
        _t1.t_level + 1 t_level,
        _t1.t_path || REPLACE(to_char(t1.queue, '99'), ' ', '0') t_path
    FROM ab_test_tree t1
    INNER JOIN tree1 _t1
    ON t1.pid = _t1.sid
)
UPDATE ab_test_tree t0 SET t_level = t1.t_level, t_path = t1.t_path
FROM tree1 t1 WHERE t0.sid = t1.sid;
```

**按人员查询部门 / 岗位 / 人员权限（标记 mask_no）**

```sql
WITH RECURSIVE
    -- 部门 || 岗位 || 人员，type=1 表示部门
    user_to_org AS (
        SELECT org_id FROM sys.hr_org_user_rel WHERE user_id = 'b21313cb-5db7-430f-8ffe-d9281589b6fa'
    ),
    up_orgs(
        sid,
        pid
    ) AS (
        SELECT
            sid,
            pid
        FROM sys.hr_org
        WHERE sid IN (SELECT org_id FROM user_to_org)
        UNION
        SELECT
            t1.sid,
            t1.pid
        FROM sys.hr_org t1
        INNER JOIN up_orgs
        ON t1.sid = up_orgs.pid
    ),
    org_power AS (
        SELECT mask."no" mask_no
          FROM sys.sys_roles_mark_rel markrel
               INNER JOIN sys.sys_roles_org_rel orlrel ON markrel.roles_id = orlrel.roles_id
               INNER JOIN sys.sys_menu_mark mask ON markrel.mark_id = mask.sid
         WHERE mask.mark_type = 1 AND mask.menu_id = 'b1769ccd-36fc-4918-bc45-6facc3d7c8ae'
           AND orlrel.org_id IN (SELECT sid FROM up_orgs)
    ),
    -- 部门 || 岗位 || 人员，type=1 表示岗位
    user_to_post AS (
        SELECT post_id sid FROM sys.hr_org_user_rel WHERE user_id = 'b21313cb-5db7-430f-8ffe-d9281589b6fa'
    ),
    post_power AS (
        SELECT mask."no" mask_no
          FROM sys.sys_roles_mark_rel markrel
               INNER JOIN sys.sys_roles_post_rel postrel ON markrel.roles_id = postrel.roles_id
               INNER JOIN sys.sys_menu_mark mask ON markrel.mark_id = mask.sid
         WHERE mask.mark_type = 1 AND mask.menu_id = 'b1769ccd-36fc-4918-bc45-6facc3d7c8ae'
           AND postrel.post_id IN (SELECT sid FROM user_to_post)
    ),
    -- 部门 || 岗位 || 人员，type=1 表示人员
    user_power AS (
        SELECT mask."no" mask_no
          FROM sys.sys_roles_mark_rel markrel
               INNER JOIN sys.sys_roles_user_rel userrel ON markrel.roles_id = userrel.roles_id
               INNER JOIN sys.sys_menu_mark mask ON markrel.mark_id = mask.sid
         WHERE mask.mark_type = 1 AND mask.menu_id = 'b1769ccd-36fc-4918-bc45-6facc3d7c8ae'
           AND userrel.user_id = 'b21313cb-5db7-430f-8ffe-d9281589b6fa'
    ),
    marks AS (
        SELECT * FROM org_power
        UNION
        SELECT * FROM post_power
        UNION
        SELECT * FROM user_power
    )
SELECT json_agg(row_to_json(result)) FROM marks AS result;
```

```sql
-- 判断 json 数组中是否存在指定 mask_no
-- SELECT EXISTS(SELECT T::json ->> 'mask_no' AS mask_no
--          FROM json_array_elements('[{"mask_no":1},{"mask_no":2}]') AS T
--          WHERE  T ->> 'mask_no' = CAST(3 AS CHARACTER));
```

### 5.9 存储过程调用

```sql
DO
$$
DECLARE
  jsons    json;
  userid   character varying;
  username character varying;
  error    character varying;
BEGIN
    jsons := '[{"action":"add","row":{"textbox":"12345","checkbox":false}},{"action":"add","row":{"textbox":"67890","checkbox":true}}]';
    userid := '111-111';
    username := 'ocean';
    error := '';

    SELECT * INTO jsons, error FROM sys.ab_test_ui_type_action(jsons, userid, username, error);

    RAISE NOTICE 'error: %, jsons: %.', error, jsons;
END;
$$ LANGUAGE plpgsql;
```
