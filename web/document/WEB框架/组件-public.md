# YqIcon
图标组件
- 属性
``` javascript
{
  icon?: string | object
  size?: string
  color?: string
  className?: string,
  title?: string
  disabled?: boolean
}
```
# YqMenu
菜单组件
- **属性**
``` javascript
{
    type?: 'inline' | 'vertical' // 菜单类型：inline（水平）或vertical（垂直）
    menuItems?: YqMenuIF[];
    mini?: boolean;
    /** 多语言菜单字典
    示例
    {
        "demo": {
            "zh-CN": { "label": "添加", "toptip": "添加新记录" },
            "en":    { "label": "Add",  "toptip": "Add new record" }
        }
    }
    */
    labelDict?: Record<string, Record<string, { label?: string, toptip?: string }>>;
}
```
YqMenuIF 数据类型
``` javascript
export interface YqMenuIF {
    name?: string,
    label?: string,
    toptip?: string,
    icon?: string,
    type?: "primary" | "success" | "danger" | "info" | "warning",
    divided?: boolean,
    disabled?: (() => boolean),
    click?: (event?: any) => void,
    children?: YqMenuIF[],
}
```
# YqFlowEdit
流程编辑组件
- **属性**
``` javascript
{
  modelValue?: {
    info?: Record<string, any>;
    node?: Array<Record<string, any>>;
    link?: Array<Record<string, any>>;
  };
  mini?: boolean;         // 是否迷你模式
  isEdit?: boolean;
  onSave?: (event: any, data: any) => void;  // 保存回调
}
```
- **事件**
``` javascript
const emit = defineEmits<{
  'update:modelValue': [value: { info: Record<string, any>; node: any[]; link: any[] }];
  'change': [value: { info: Record<string, any>; node: any[]; link: any[] }];
}>();
```
 
# YqFlowView
流程查看(执行)组件
