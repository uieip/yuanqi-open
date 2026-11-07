# 场景教程：从零搭一个客户管理应用

目标：客户档案 + 联系人 + 跟进记录，带菜单、权限、列表页、接口与统计图表。

## 1. 数据建模

在 **数据管理**（`/adp/data.html`）建立三张表，并用外键关联：

| 表 | 关键字段 | 关系 |
| --- | --- | --- |
| `crm_customer` | 名称、行业、等级、负责人、状态 | 主表 |
| `crm_contact` | 姓名、电话、职位、客户 | 外键 → `crm_customer.sid` |
| `crm_follow` | 跟进时间、方式、内容、客户 | 外键 → `crm_customer.sid` |

建模时的常用能力：

- 枚举：行业、等级、状态
- 树形模型：客户分组、区域
- 排序字段：列表默认排序
- 视图：为不同角色配置不同的列表列与筛选条件
- 表内文件：合同、附件

## 2. 菜单与权限

1. **菜单管理**（`/adp/menu.html`）：新增「客户管理」目录与「客户档案 / 联系人 / 跟进记录」菜单，绑定数据页面。
2. **权限管理**（`/adp/roles.html`）：为角色勾选菜单与操作标识（新增、修改、删除、导出）。
3. **组织与人员**：`/adp/hr_org.html`、`/adp/hr_post.html`、`/adp/hr_user.html` 维护部门、岗位、人员。

权限生效范围包括：UI 入口是否可见、可见数据范围、业务操作是否允许。

## 3. 页面搭建

两种方式，按需选择：

| 方式 | 适用 |
| --- | --- |
| 模板化页面 | 直接使用平台内置的列表 / 表单模板，改配置即可 |
| 拖拽搭建 | 空白页面上通过拖拽 YQWIN-Plus 组件完成布局，适合个性化界面 |

组件库可先在 `/yqvue/` 里试：表单组件、数据表格、树、弹窗、图表（ECharts / D3 / GoJS）、看板、甘特图、Markdown、代码编辑器等。

## 4. 写接口

需要额外业务逻辑时，在 `web/api/` 下新增程序文件，例如 `web/api/customer.html`，通过 `data` 模块访问数据库：

```html
<uieip type="page" value="base"></uieip>
<uieip type="reg" value="data"></uieip>
<script runat="server">
    response.contentType("application/json");

    var keyword = request.param("keyword") || "";
    var sql = "select sid, name, industry, level, state from crm_customer where name like $1";
    var result = data.query("yqbase", sql, ["%" + keyword + "%"]);

    if (result.error != 0) {
        response.write(JSON.stringify(result));
    } else {
        response.write(JSON.stringify({ error: 0, rows: result.rows }));
    }
</script>
```

前端请求 `/api/customer.json?keyword=xxx` 即可。脚本还提供 `session`、`cache`、`http`、`resource` 等模块，按需在 `<uieip type="reg">` 中加载。

## 5. 统计与看板

- 用 ECharts / D3 组件做仪表盘与趋势图
- 访问、点赞、收藏、评论统计在 `/account/` 与后台统计管理中查看
- 数据量较大时，为报表单独建视图或按需缓存（`cache` 模块）

## 6. 自检清单

- [ ] 表结构、外键、枚举是否与业务一致
- [ ] 菜单是否绑定到正确页面，角色是否勾选
- [ ] 列表默认排序、视图列是否符合使用习惯
- [ ] 接口是否做了参数校验与分页
- [ ] 关键操作是否有操作日志与数据备份
