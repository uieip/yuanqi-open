**Milvus-向量数据库**
- Milvus 可以实现混合搜索，即同时包含文本搜索和向量搜索的查询。

# 一、Milvus安装
## 1.1 在 Linux 或 WSL 2 中
```bash
# 如果在 Windows 中，PowerShell 进入 WSL 2
wsl

# 下载安装脚本
curl -sfL https://raw.githubusercontent.com/milvus-io/milvus/master/scripts/standalone_embed.sh -o standalone_embed.sh

# 启动 Milvus
bash standalone_embed.sh start
```

## 1.2 可视化工具 Attu（可选）

Attu 是 Milvus 官方提供的图形化管理工具，可以方便地查看和管理数据。

- 下载安装

访问 Attu GitHub Releases  
[下载 Windows 版本的 .exe 安装](https://github.com/zilliztech/attu/releases)包  
双击安装，启动后输入 localhost:19530 连接 Milvus 数据库  
默认用户名密码：root/Milvus

- 修改密码

通过 Attu 可视化工具修改

[下载并安装](https://github.com/zilliztech/attu/releases) Attu：官方 GitHub Releases 页面。  
打开 Attu，填写连接信息并勾选“认证”（Authentication）：  
Milvus 地址: localhost:19530  
用户名: root  
密码: Milvus  
连接成功后，在左侧导航栏找到 权限管理。  
点击 root 用户右侧的 “Update password” 按钮，输入新密码即可。

核心概念澄清  
Milvus 默认的超级管理员账户是 root，密码是 Milvus。首次部署时，如果未开启认证功能，可以直接连接无需密码。出于安全考虑，强烈建议在初次使用时启用认证并修改默认密码。

## 2.2 Docker Compose 部署 Milvus 实例
Milvus 持续更新，建议使用最新版本的 compose 文件。

```bash
# 下载v3.x compose文件
wget https://github.com/milvus-io/milvus/releases/download/v3.0.5/milvus-standalone-docker-compose.yml -O docker-compose.yml

# 启动（会拉起 milvus-etcd、milvus-minio、milvus-standalone 3个容器）
docker compose up -d

# 3. 退出容器并重启服务使其生效
docker restart milvus-standalone
```

默认没有开启认证功能，需要手动开启，如何开启请使用ai助手。

# 二、向量数据集定义

## 2.1集合 Schema（Collection Schema）

| 字段名 | 数据类型 | 说明 |
|--------|---------|------|
| `id` | VarChar(36) | 主键，唯一标识 |
| `pid` | VarChar(36) | 所属文档/分组 ID |
| `timestamp` | VarChar(19) | 时间戳，格式如 `2006-01-02 15:04:05` |
| `content` | VarChar | 文本内容，启用标准分词器（`standard` analyzer） |
| `metadata` | JSON | 元数据，存储文档附属信息 |
| `vector` | FloatVector(dim) | 稠密向量，维度由配置动态决定 |
| `sparse_vector` | SparseVector | 稀疏向量，由 BM25 函数自动生成 |

## 2.2 函数（Function）

| 函数名 | 类型 | 输入字段 | 输出字段 | 说明 |
|--------|------|---------|---------|------|
| `bm25_search` | BM25 | `content` | `sparse_vector` | 对文本内容计算 BM25 稀疏向量，用于全文检索 |

## 2.3索引（Index）

| 字段 | 索引类型 | 度量类型 | 参数 | 说明 |
|------|---------|---------|------|------|
| `vector` | HNSW | COSINE | M=16, efConstruction=200 | 稠密向量索引，用于向量相似度搜索 |
| `sparse_vector` | SparseInvertedIndex | IP | drop_ratio=0.2 | 稀疏向量索引，仅支持 IP（内积）度量类型，用于全文检索

## 2.4 数据集维度（Dimension Setup）

`content` 字段长度、文档块大小和重叠量根据向量维度自动适配，各维度对应的参数如下：

| 向量维度 | content 字段长度 | 默认文档块大小 | 默认重叠量 |
|---------|----------------|--------------|-----------|
| 768 | 2048 | 256 | 25 |
| 1024 | 4096 | 512 | 50 |
| 1536 | 8192 | 768 | 76 |
| 2048 | 8192 | 1024 | 100 |

> 注：`ContentLength` 始终保证 ≥ `DefaultChunkSize × 3`，确保数据库字段不会截断切分后的文档块。默认维度为 1024。

# 三、文档分割转换

文档入库前经过分割转换处理，将长文本按语义切割为合适大小的文档块，并转换为向量存入 Milvus。

## 3.1 执行流程

```
Transform (Eino 接口入口)
  └─ cleanDocument     — 文本规范化清洗
  └─ splitContent      — 递归分割入口
        ├─ splitByPriority   — 按优先级分隔符递归切割为语义片段
        └─ combineSegments   — 将片段合并为 ≤chunkSize 的块，块间 overlap 重叠
```

## 3.2 文本清洗（cleanDocument）

对原始文本进行规范化处理，消除格式噪声：

| 步骤 | 处理规则 | 说明 |
|------|---------|------|
| 1 | 连续空白（制表符/空格）→ 单空格 | 消除多余空白字符 |
| 2 | 连续 3+ 空行 → 双换行段落分隔 | 保留段落结构，消除过多空行 |
| 3 | 段落内换行 → 空格 | 清除软换行，将多行段落合并为单行 |
| 4 | 压缩多余空格、去首尾空白 | 规整化文本 |
| 5 | 中文间空格删除 | 中文与中文之间的空格无意义，直接删除；中英/中数间的空格保留 |

## 3.3 递归分割（splitByPriority）

按分隔符优先级递归切割文本，优先保留语义完整性：

| 优先级 | 分隔符 | 语义层次 | 说明 |
|--------|-------|---------|------|
| 1 | `\n\n` | 段落 | 双换行分隔的段落级切割 |
| 2 | `。` | 句子 | 中文句号 |
| 3 | `.` | 句子 | 英文句点 |
| 4 | `！` | 句子 | 中文感叹句 |
| 5 | `？` | 句子 | 中文疑问句 |
| 6 | `；` | 子句 | 中文分号 |
| 7 | `,` | 子句 | 英文逗号 |
| 8 | `，` | 子句 | 中文逗号 |
| 9 | ` ` | 词 | 空格（英文单词边界） |
| 10 | `""` | 字符 | 无合适分隔符时，按固定字符数切分 |

> 分割时分隔符保留在片段末尾，确保语义完整。当前级别无法有效分割时自动降级到下一级。

## 3.4 片段合并（combineSegments）

将递归分割得到的语义片段合并为文档块：

- **块大小（chunkSize）**：每个文档块不超过指定字符数（按 rune 计数）
- **重叠量（overlap）**：相邻块之间共享若干字符，保持上下文连贯
- **合并策略**：按顺序累加片段到不超过 chunkSize 时截断，再从上一块末尾取 overlap 字符数的片段作为下一块起始

## 3.5 默认参数

| 参数 | 默认值 | 说明 |
|------|-------|------|
| chunkSize | 512 | 每块最大字符数 |
| overlap | 50 | 相邻块间重叠字符数 |

> 参数可通过 `newTransformer` 传入自定义值。若 `overlap ≥ chunkSize`，自动修正为 `chunkSize / 4`。

## 3.6 输出元数据

每个分割后的文档块携带以下元数据：

| 元数据字段 | 类型 | 说明 |
|-----------|------|------|
| `_chunk_index` | int | 当前块在原文档中的序号（从 0 开始） |
| `_chunk_count` | int | 原文档被分割的总块数 |

