# 场景教程：给业务加一个知识库问答

把内部文档、产品手册、工单记录变成可问答的知识库，并让回答带上业务数据。

## 1. 准备依赖

| 组件 | 说明 |
| --- | --- |
| 大模型 | DeepSeek、Ollama，或其他 OpenAI 兼容接口 |
| Embedding | 火山引擎、Ollama |
| 向量库 | Milvus |

## 2. 打开 AI 开关并配置模型

编辑 `config.json`：

```json
{
  "ai": {
    "status": true,
    "model_default": "deepseek",
    "model": {
      "deepseek": {
        "model_type": "deepseek",
        "api_key": "<你的 API Key>",
        "model": "deepseek-chat",
        "base_url": "https://api.deepseek.com",
        "timeout": 30
      }
    },
    "embedder": {
      "ollama": {
        "dirve_type": "ollama",
        "model": "nomic-embed-text",
        "baseUrl": "http://localhost:11434",
        "dimension": 768
      }
    },
    "milvusdb": {
      "addr": "localhost:19530",
      "username": "root",
      "password": "<Milvus 密码>"
    },
    "kbs": [
      {
        "name": "manual",
        "describe": "产品手册",
        "collection": "kb_manual",
        "dimension": 768,
        "db": "milvusdb",
        "embedder": "ollama"
      }
    ]
  }
}
```

> 具体键名以随包 `config.json` 为准；`ai.status` 默认 `false`，配置完成后再打开。

要点：

- **维度必须匹配**：`kbs.*.dimension` 要与 Embedding 模型输出维度一致，否则写入向量库会失败。
- **密钥不要提交**：`config.json` 含 API Key，不要推到公开仓库。

## 3. 建知识库并导入内容

1. 进入 **系统管理 → 知识库管理**（`/adp/bikbs.html`），确认知识库、集合、维度、Embedding 驱动与配置一致。
2. 导入文档内容（文本、Markdown、HTML 等），平台会切分、向量化并写入 Milvus。

## 4. 让业务数据也能被问答

在菜单「界面数据」中配置 `kbs_params`，把业务表内容同步到知识库，例如把「产品价格表」「常见问题表」同步为可检索的知识片段。这样回答可以同时引用静态文档与实时业务数据。

## 5. 使用

- AI 聊天入口：`/adp/ai-chat.html`
- 也可以在业务页面里通过服务端脚本调用 AI 能力，把问答结果嵌进业务流程

## 6. 调优建议

| 问题 | 调整方向 |
| --- | --- |
| 回答答非所问 | 检查切分粒度、Embedding 模型与查询改写 |
| 检索不到新内容 | 确认数据已同步到 Milvus，集合名与维度配置正确 |
| 回答太慢 | 换更小的 Embedding / 模型，或降低 topK |
| 回答编造 | 在提示词中要求“仅依据知识库内容回答”，并返回引用来源 |
| 成本过高 | 优先用本地 Ollama 做 Embedding，对话模型按场景分级 |
