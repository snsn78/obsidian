# truST Platform 使用教程

本地路径：`E:\PLC_Coding\trust-platform`

官方仓库：`https://github.com/johannesPettersson80/trust-platform`

官方文档：`https://johannespettersson80.github.io/trust-platform/`

## 1. 它是干什么的

truST Platform 是一个开放的 IEC 61131-3 Structured Text 控制工作区，目标是把 PLC 编程、运行、调试、HMI、Agent API 统一起来。

它包含这些核心组件：

| 组件 | 二进制/模块 | 用途 |
|---|---|---|
| Language Server | `trust-lsp` | ST 诊断、跳转、格式化、重命名、补全 |
| Runtime | `trust-runtime` | 运行 ST 项目、提供 Web IDE / HMI |
| Developer Workbench | `trust-dev` | 开发工具，包括 agent、test、docs、项目辅助命令 |
| Debug Adapter | `trust-debug` | VS Code 调试适配器 |
| Bundle Tool | `trust-bundle-gen` | 生成 STBC bundle |

对 AI Agent 来说，truST 的价值非常高：它不是单纯的语法包，而是“PLC IDE + Runtime + Debug + Agent API”的组合。

## 2. 当前部署状态

已完成：

```text
E:\PLC_Coding\trust-platform
```

已验证：

```bash
cd /e/PLC_Coding/trust-platform
git rev-parse --short HEAD
# a0c7cd91
```

Rust 已安装：

```bash
export PATH="$HOME/.cargo/bin:$PATH"
cargo --version
rustc --version
```

当前机器实测结果：

```text
cargo 1.97.0
rustc 1.97.0
```

## 3. 当前不能完整编译的原因

truST 是 Rust 工作区，`Cargo.toml` 写明：

```toml
rust-version = "1.95"
```

当前 Rust 版本满足要求，但 Windows 上完整编译还需要：

- Visual Studio Build Tools
- Desktop development with C++ workload
- Windows SDK，里面要有 `kernel32.lib`

当前机器没有找到：

```text
C:\Program Files (x86)\Windows Kits\...\kernel32.lib
```

所以现在 `cargo check` / `cargo build` 会在链接阶段失败。

## 4. 补齐依赖

安装 Visual Studio Build Tools 2022，组件勾选：

```text
Desktop development with C++
MSVC v143 x64/x86 build tools
Windows 10/11 SDK
CMake tools for Windows 可选
```

装好后重启 Hermes / Git Bash，然后检查：

```bash
find '/c/Program Files (x86)/Windows Kits' -name kernel32.lib | head
```

能看到路径就说明 Windows SDK 就绪。

## 5. 推荐构建命令

进入项目：

```bash
cd /e/PLC_Coding/trust-platform
export PATH="$HOME/.cargo/bin:$PATH"
```

因为当前仓库配置可能尝试使用 `sccache`，如果本机没有 `sccache`，先清掉 wrapper：

```bash
unset RUSTC_WRAPPER
export CARGO_BUILD_RUSTC_WRAPPER=""
```

先做轻量检查：

```bash
cargo check -p trust-syntax
cargo check -p trust-lsp
cargo check -p trust-runtime
cargo check -p trust-dev
```

构建 release：

```bash
cargo build --release -p trust-lsp
cargo build --release -p trust-runtime
cargo build --release -p trust-dev
cargo build --release -p trust-debug
```

生成的二进制通常在：

```text
E:\PLC_Coding\trust-platform\target\release\
```

例如：

```text
trust-lsp.exe
trust-runtime.exe
trust-dev.exe
trust-debug.exe
```

## 6. VS Code 插件使用

官方 README 推荐直接从 Marketplace 安装：

```bash
code --install-extension trust-platform.trust-lsp
```

如果命令行没有 `code`，就在 VS Code 里：

```text
Extensions -> 搜索 truST -> 安装 trust-platform.trust-lsp
```

安装后打开包含 `.st` / `.ST` / `.pou` 文件的目录，就可以获得 ST 语言支持。

## 7. 本地源码版 LSP 配置

如果你自己编译出了 `trust-lsp.exe`，在 VS Code 设置里配置：

```json
{
  "trust.languageServer.executablePath": "E:\\PLC_Coding\\trust-platform\\target\\release\\trust-lsp.exe"
}
```

这样 VS Code 插件会使用你本地编译的语言服务器。

## 8. 对 AI Agent 的用法

可以把 truST 作为 Agent 的 PLC 后端：

```text
AI 生成 ST 代码
  -> trust-lsp 做诊断、跳转、格式化、符号查询
  -> trust-runtime 运行/仿真项目
  -> trust-debug 做断点/调试
  -> trust-dev 做 agent/test/docs/workbench 操作
```

Agent 可以利用的能力包括：

- 读取诊断信息
- 获取 hover 信息
- 获取定义/引用
- 获取 workspace symbols
- 应用格式化
- 获取 code actions
- 操作 HMI layout
- 启动 debug

这些能力在 VS Code 扩展的 `package.json` 里以 `onLanguageModelTool:trust_*` 形式暴露，例如：

```text
trust_get_diagnostics
trust_get_definition
trust_get_references
trust_get_completions
trust_get_formatting_edits
trust_apply_edits
trust_debug_start
trust_hmi_validate
```

## 9. 常见错误

### 错误 1：`sccache program not found`

处理：

```bash
unset RUSTC_WRAPPER
export CARGO_BUILD_RUSTC_WRAPPER=""
```

### 错误 2：`kernel32.lib no such file or directory`

原因：缺 Windows SDK。

处理：安装 Visual Studio Build Tools 2022，并勾选 Windows SDK。

### 错误 3：`link.exe extra operand`

在 Git Bash 中可能误调用 `/usr/bin/link`，不是 MSVC 的 `link.exe`。

处理：安装 Visual Studio Build Tools 后，最好用 VS Developer Command Prompt 或确保 MSVC linker 在 PATH 前面。

## 10. 最小学习路径

1. 先安装 VS Code 插件：`trust-platform.trust-lsp`
2. 打开示例目录：

```text
E:\PLC_Coding\trust-platform\examples
```

3. 找 `.st` 文件阅读诊断和跳转。
4. 补齐 Visual Studio Build Tools。
5. 编译 `trust-lsp` / `trust-runtime`。
6. 再让 AI Agent 调用它做诊断和格式化。
