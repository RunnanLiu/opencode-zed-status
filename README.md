# opencode-zed-status

为 [opencode](https://opencode.ai) 提供 Zed 终端状态反馈的两个 server 插件(零依赖、单文件):

| 文件 | 导出 | 作用 |
|---|---|---|
| `zed-bell.js` | `ZedBell` | 任务完成 / 等待授权时向终端写 BEL(`\x07`),Zed 未聚焦时弹通知 + 蓝点 |
| `zed-title.js` | `ZedTitle` | 会话 busy 时在终端标题(OSC 0)轮换动画帧,空闲停笔 |

两者互不冲突(BEL vs OSC 0),可同时使用。

## 安装

### 方式一:npm(推荐)

```sh
opencode plugin add opencode-zed-status
```

或在 `opencode.json` 的 `plugin` 数组中加入包名后重启:

```json
{
  "plugin": ["opencode-zed-status"]
}
```

### 方式二:install 脚本

下载两个文件到 `~/.config/opencode/plugins/`:

Windows(PowerShell):

```powershell
irm https://raw.githubusercontent.com/RunnanLiu/opencode-zed-status/main/install.ps1 | iex
```

macOS / Linux:

```sh
curl -fsSL https://raw.githubusercontent.com/RunnanLiu/opencode-zed-status/main/install.sh | sh
```

**任一方式完成后重启 opencode 生效。**

## 使用

在 Zed 的 Terminal Threads 中正常使用 opencode 即可,无需额外配置:

- 标题动画:busy / retry 时标题左侧旋转 `▘ ▝ ▗ ▖`(200ms/帧),空闲恢复 `OC | 标题`(标题截断 40 字符)
- 响铃:任务完成或等待授权时终端响铃,未聚焦时 Zed 弹通知

## 卸载

- npm 方式:`opencode plugin remove opencode-zed-status` 并重启
- 脚本方式:删除 `~/.config/opencode/plugins/zed-bell.js` 与 `zed-title.js`,重启 opencode

注意:两种方式不要混用,否则插件会加载两份(双动画/双响铃)。