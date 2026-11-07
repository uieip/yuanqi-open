# 常见问题

**Q1：启动后浏览器无法访问？**

1. 在 PowerShell 中进入安装目录运行 `.\uieip-windows.exe`，查看控制台报错；
2. 确认进程仍在运行；
3. 确认访问地址为 `http://127.0.0.1:8011/`；
4. 检查 8011 端口是否被占用：`netstat -ano | findstr 8011`；
5. 检查 Windows 防火墙是否放行；
6. 若改过目录，检查 `config.json` 的 `webpath`、`db.connStr` 等绝对路径。

**Q2：端口被占用怎么办？**

修改 `config.json` 中 `websvr.addr`（如 `8020`）后重启，并同步调整 Nginx 反向代理端口。

**Q3：换了目录后页面 404 或数据库打不开？**

`config.json` 默认使用 `D:\Spring\yuanqi-open` 绝对路径。迁移后按[快速开始](getting-started.md#换目录)逐项修改。

**Q4：默认账号是什么？如何修改密码？**

默认账号 `spring`，密码 `uieip.123`。登录后进入修改密码页面，或由管理员在人员管理中重置。若开启首次登录改密策略，新用户首次登录会被要求修改密码。

**Q5：上传大文件失败？**

检查 Nginx 的 `client_max_body_size`，并确认磁盘空间充足。文件默认保存在 `files\`，元数据在 `files\filedb.sqlite`。

**Q6：如何接入 MySQL / PostgreSQL？**

本包仅内置 SQLite 驱动与初始化库。正式版提供 PostgreSQL、KingbaseES 等支持，并可按数据库类型生成建表脚本与存储过程/脚本程序。

**Q7：如何启用 HTTPS？**

在 Nginx 上配置证书并反向代理到 `127.0.0.1:8011`，同时将 `websvr.scheme` 改为 `https`、`websvr.host` 改为实际域名。

**Q8：系统监控页面 WebSocket 报错？**

Nginx 需开启 WebSocket 支持：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Q9：日志在哪里？**

默认 `D:\Spring\logfile`，由 `log.path` 配置。页面脚本中的 `console.log()` 会写入服务端日志。

**Q10：数据如何备份和恢复？**

停止服务后备份 `data\`、`files\` 和 `config.json`；恢复时覆盖回原目录并启动。

**Q11：为什么截图里界面是深色？**

YQWIN-Plus 支持浅色/深色/深蓝与跟随系统，组件库里可切换；后台界面主题跟随当前配置。

**Q12：能在 Linux 上跑吗？**

本发布包仅提供 Windows x64 二进制。服务端本身用 Golang 编写，正式版支持 Linux、Windows Server、macOS 等跨平台部署。
