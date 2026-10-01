# opencode-zed-status

[English](README.md) | [简体中文](README.zh-CN.md)

OpenCode **V2** CLI 插件,为 Zed 终端提供状态反馈(零依赖、零构建):

- **标题**(OSC 0):空闲显示静态 `▣` 图标,任务运行中显示四象限 spinner(`▘▝▗▖`,200ms/帧)。Zed 的 Threads 侧栏图标位会同步显示并旋转 `▣`。
- **响铃**:顶层任务完成、或需要权限/表单输入时向终端写入 BEL(`\x07`);终端未聚焦时 Zed 弹出通知 + 蓝点。

> 需要 OpenCode **v2**(V2 CLI 插件 API)。OpenCode v1 请使用 `opencode-zed-status@1.1.3`,v2 不兼容 V1 插件 API。

## 安装

### 方式一:npm(推荐)

```sh
opencode plugin add opencode-zed-status
```

或在 `~/.config/opencode/cli.json` 的 `plugins` 中加入包名:

```json
{
  "plugins": ["opencode-zed-status"],
  "terminal": { "title": false }
}
```

- `terminal.title: false`(等价于在命令面板执行一次 **Disable terminal title**)会关闭 opencode 内置标题写入器,让本插件成为**唯一标题所有者**。不关闭的话两者会竞争写入,内置更新后 `▣` 前缀可能短暂丢失(插件 ≤1s 自愈,但没必要打架)。
- 安装后重启 opencode;TUI 运行中保存 `cli.json` 会热重载。

### 方式二:本地目录

克隆或下载本仓库,然后在 `cli.json` 中指向目录(仓库即可直接使用,加载器解析物理 `tui.js`):

```json
{
  "plugins": ["file:///D:/Artifact/OC-Zed-Status"]
}
```

## 行为

- 空闲标题:`▣ <会话标题>`;默认/未命名会话显示 `▣ OpenCode`
- 运行中:左侧四象限 spinner `▘ ▝ ▗ ▖`,200ms/帧——启停**即时**(状态迁移由事件驱动)
- 自愈:标题每秒至少重写一次,任何覆盖(复制文本、其他工具、忘记关闭的内置写入器)都会在 ≤1s 内被修复;200ms 轮询仅作为下限,覆盖路由探测、帧动画与自愈
- 响铃:**仅顶层会话**完成(`succeeded`/`interrupted`/`failed`)时响;`permission` / 表单提示**全层级**响;**子 agent 完成不响**
- 标题截断至 40 字符(省略号 `…`);`▣` 图标本身即在 Zed 侧栏标识 OpenCode 会话

### 与 opencode 内置 attention 的关系

OpenCode v2 原生提供系统通知与提示音(`cli.json` 的 `attention` 设置及内置插件 `opencode.notifications`)。本插件**不重复**这些能力——只补充 BEL 通道(让 Zed 蓝点生效的协议通道)。需要系统通知/提示音的话,保持 `attention.notifications` / `attention.sound` 开启即可。

## 关闭或卸载

二者是同一个动作:从 `cli.json` 的 `plugins` 中移除条目(npm 安装也可用 `opencode plugin remove opencode-zed-status`)。如需内置标题,恢复 `terminal.title`。本插件不设独立开关。

## 文件

| 文件 | 职责 |
|---|---|
| `tui.js` | 插件入口(`{ id, setup }`,即 V2 `./tui` 契约);组合两个模块并聚合清理函数 |
| `title.js` | 终端标题:双调度器——状态迁移由事件触发即时重算;轮询作为下限(路由、帧动画、自愈) |
| `bell.js` | BEL 响铃;事件集镜像内置 `opencode.notifications`(含去重) |

## 开发

`npm test` 运行零依赖的 mock 契约测试(`test.mjs`):模拟 OpenCode V2 插件宿主,断言完整行为矩阵——包括针对 v2.0.21 宿主源码验证过的事件名与负载结构,因此也是对抗未来 opencode 版本漂移的哨兵。需要 Node 18+,无需安装依赖。
