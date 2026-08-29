# opencode-zed-status

为 [opencode](https://opencode.ai) 提供 Zed 终端状态反馈的两个 server 插件(零依赖、单文件):

| 文件 | 导出 | 作用 |
|---|---|---|
| `zed-bell.js` | `ZedBell` | 任务完成 / 等待授权时向终端写 BEL(`\x07`),Zed 未聚焦时弹通知 + 蓝点 |
| `zed-title.js` | `ZedTitle` | 会话 busy 时在终端标题(OSC 0)轮换动画帧,空闲停笔 |

两者互不冲突(BEL vs OSC 0),可同时使用。

## 安装

### Windows(PowerShell)

```powershell
irm https://raw.githubusercontent.com/RunnanLiu/opencode-zed-status/main/install.ps1 | iex
```

### macOS / Linux

```sh
curl -fsSL https://raw.githubusercontent.com/RunnanLiu/opencode-zed-status/main/install.sh | sh
```

脚本会把两个插件下载到 `~/.config/opencode/plugins/`。**重启 opencode 后生效。**

### 手动安装

将 `zed-bell.js` 与 `zed-title.js` 放入 `~/.config/opencode/plugins/`,重启 opencode。

## 使用

在 Zed 的 Terminal Threads 中正常使用 opencode 即可,无需额外配置:

- 标题动画:busy / retry 时标题左侧旋转 `▘ ▝ ▗ ▖`(200ms/帧),空闲恢复 `OC | 标题`(标题截断 40 字符)
- 响铃:任务完成或等待授权时终端响铃,未聚焦时 Zed 弹通知

## 卸载

删除 `~/.config/opencode/plugins/zed-bell.js` 与 `zed-title.js`,重启 opencode。

## License

MIT © 2026 RunnanLiu