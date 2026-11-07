# 部署与运维

## 注册为 Windows 服务

推荐使用 NSSM：

```powershell
nssm install uieip "D:\Spring\yuanqi-open\uieip-windows.exe"
nssm set uieip AppDirectory "D:\Spring\yuanqi-open"
nssm set uieip DisplayName "UIEIP Service"
nssm set uieip Start SERVICE_AUTO_START
nssm start uieip
```

常用命令：

```powershell
nssm stop uieip
nssm restart uieip
nssm remove uieip confirm
```

## Nginx 反向代理

生产环境建议在 UIEIP 前增加 Nginx，负责域名、HTTPS、上传大小限制与真实 IP 透传：

```nginx
upstream uieip {
    server 127.0.0.1:8011 weight=1 fail_timeout=5s max_fails=3;
}

server {
    listen 80;
    server_name your.domain.com;

    client_max_body_size 1024m;

    location / {
        proxy_pass http://uieip;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Scheme $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 系统监控等功能使用 WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 600s;
    }
}
```

### 启用 HTTPS

1. 在 Nginx 上配置证书，反向代理到 `127.0.0.1:8011`；
2. 将 `config.json` 的 `websvr.scheme` 改为 `https`，`websvr.host` 改为实际域名；
3. 重启服务。

### 系统监控（WebSocket）

监控页依赖 WebSocket，Nginx 需保留：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## 日志与监控

- 日志目录：`log.path`（默认 `D:\Spring\logfile`）
- 日志级别：DEBUG < INFO < WARNING < ERROR < CRITICAL，默认记录 WARNING 及以上
- 管理后台：**服务管理 → 系统监控 / 缓存管理 / 统计管理**
- 页面脚本里的 `console.log()` 输出到服务端日志

## 端口与防火墙

- 默认端口：`8011`
- 局域网访问：在 Windows 防火墙入站规则放行对应 TCP 端口
- 改端口：调整 `config.json` 中 `websvr.addr` 后重启

## 备份与恢复

1. 停止服务；
2. 备份 `data\`（SQLite 系统库）、`files\`（文件柜）与 `config.json`；
3. 恢复时覆盖回原目录并启动服务；
4. 定期演练恢复流程，确认备份可用。

## 文档站（MkDocs）

本站点由 MkDocs 构建，源码在仓库 `docs/`，配置为 `mkdocs.yml`：

```powershell
pip install -r requirements-docs.txt
mkdocs serve     # 本地预览 http://127.0.0.1:8000
mkdocs build     # 产物在 site/
```

### 自动发布

仓库内置 `.github/workflows/docs.yml`：向 `main` / `master` 推送 `docs/` 相关改动时，自动构建并发布到 `gh-pages` 分支。

- **GitHub Pages**：仓库 Settings → Pages，Source 选择 `gh-pages` 分支。
- **Gitee Pages**：Gitee 镜像同步 `gh-pages` 分支后，在 Gitee 仓库的 Pages 设置中选择该分支并更新部署（Gitee Pages 需仓库公开，且可能要求实名与审核，以 Gitee 控制台提示为准）。
- **Vercel**：导入 GitHub / Gitee 仓库，构建命令 `pip install -r requirements-docs.txt && mkdocs build`，输出目录 `site`。
