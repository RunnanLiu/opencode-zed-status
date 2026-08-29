#!/usr/bin/env sh
set -eu

PLUGIN_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/plugins"
mkdir -p "$PLUGIN_DIR"

BASE="https://raw.githubusercontent.com/RunnanLiu/opencode-zed-status/main"
for f in zed-bell.js zed-title.js; do
    curl -fsSL "$BASE/$f" -o "$PLUGIN_DIR/$f"
    [ -s "$PLUGIN_DIR/$f" ] || { echo "下载失败: $f" >&2; exit 1; }
    echo "已安装 $f"
done

echo "已安装到 $PLUGIN_DIR,重启 opencode 生效。"