# RuSTy 使用教程

本地路径：`E:\PLC_Coding\rusty`

官方仓库：`https://github.com/PLC-lang/rusty`

官方文档：`https://plc-lang.github.io/rusty/`

## 1. 它是干什么的

RuSTy 是一个用 Rust 编写的 IEC 61131-3 Structured Text 编译器，目标是成为现代、开源、工业级的 ST 编译器。

它的核心价值：

```text
AI 生成 ST 代码
  -> RuSTy 编译/检查
  -> 如果编译失败，AI 根据错误信息修复
  -> 直到代码达到可编译状态
```

对 PLC Agent 来说，RuSTy 可以作为“生成后验证器”。这比只让模型凭感觉写 ST 代码可靠很多。

## 2. 当前部署状态

已完成：

```text
E:\PLC_Coding\rusty
```

已验证：

```bash
cd /e/PLC_Coding/rusty
git rev-parse --short HEAD
# d10de01bbd
```

Rust 已安装：

```bash
export PATH="$HOME/.cargo/bin:$PATH"
cargo --version
rustc --version
```

当前机器实测：

```text
cargo 1.97.0
rustc 1.97.0
```

## 3. 当前不能完整编译的原因

执行过：

```bash
cd /e/PLC_Coding/rusty
export PATH="$HOME/.cargo/bin:$PATH"
cargo check -p plc_ast
```

结果失败在 Windows 原生链接阶段。

主要原因：

1. 当前机器缺 Visual Studio Build Tools / Windows SDK。
2. MSVC 目标需要 `kernel32.lib`、`ntdll.lib`、`userenv.lib`、`ws2_32.lib`、`dbghelp.lib` 等 Windows SDK 库。
3. Git Bash 中还可能把 `/usr/bin/link` 当成 Windows linker，导致 `link: extra operand`。
4. 后续完整编译 RuSTy 还可能需要 LLVM 21，因为 `Cargo.toml` 中使用：

```toml
inkwell = { version = "0.9", features = ["llvm21-1"] }
```

## 4. 补齐依赖

### 第一步：安装 Visual Studio Build Tools

安装 Visual Studio Build Tools 2022，组件勾选：

```text
Desktop development with C++
MSVC v143 x64/x86 build tools
Windows 10/11 SDK
CMake tools for Windows 可选
```

装好后检查：

```bash
find '/c/Program Files (x86)/Windows Kits' -name kernel32.lib | head
```

### 第二步：确认 Rust

```bash
export PATH="$HOME/.cargo/bin:$PATH"
rustup show
cargo --version
rustc --version
```

### 第三步：准备 LLVM

RuSTy 使用 LLVM 后端，推荐查看官方构建文档：

```text
https://plc-lang.github.io/rusty/build_and_install.html
```

如果本机没有 LLVM 21，后续 `cargo build` 可能会在 `llvm-sys` / `inkwell` 阶段失败。

## 5. 推荐构建命令

进入目录：

```bash
cd /e/PLC_Coding/rusty
export PATH="$HOME/.cargo/bin:$PATH"
```

先检查轻量 crate：

```bash
cargo check -p plc_ast
cargo check -p plc_source
cargo check -p plc_diagnostics
```

再构建主编译器：

```bash
cargo build --release
```

如果官方文档要求指定 LLVM 环境变量，常见形式类似：

```bash
export LLVM_SYS_211_PREFIX="C:/Program Files/LLVM"
cargo build --release
```

具体变量名以官方 `build_and_install.html` 为准。

## 6. 如何用它检查 ST 代码

完整构建成功后，先查二进制：

```bash
find /e/PLC_Coding/rusty/target/release -maxdepth 1 -type f
```

常见入口可能是编译器 driver 或 `plc` / `plc-driver` 类二进制，具体以构建产物为准。

可以准备一个最小 ST 文件：

```st
PROGRAM Main
VAR
    counter : INT := 0;
END_VAR

counter := counter + 1;
END_PROGRAM
```

保存为：

```text
E:\PLC_Coding\samples\main.st
```

然后用 RuSTy 编译器检查它。命令以实际二进制 `--help` 为准：

```bash
/e/PLC_Coding/rusty/target/release/<compiler>.exe --help
/e/PLC_Coding/rusty/target/release/<compiler>.exe /e/PLC_Coding/samples/main.st
```

## 7. 给 AI Agent 的用法

把 RuSTy 封装成 Agent 的“编译检查工具”：

```text
输入：AI 生成的 .st 文件
动作：调用 RuSTy 编译
输出：编译成功/失败、错误行号、错误原因
AI：根据错误信息修改代码，再次编译
```

适合场景：

- 生成 Function Block 后检查语法。
- 检查变量声明是否缺失。
- 检查类型是否不匹配。
- 把 ST 作为中间语言转成更底层表示。
- 和 `plc-st-review` 组合，一个负责“能不能编译”，一个负责“工业风险”。

## 8. 和 [[03_plc-st-review_使用教程|plc-st-review]] 的区别

| 工具 | 关注点 |
|---|---|
| RuSTy | 编译器：语法、类型、代码生成、可编译性 |
| plc-st-review | 审查器：风险、复杂度、调用点漂移、安全检查、团队规范 |

推荐顺序：

```text
tree-sitter 解析结构
  -> plc-st-review 查风险
  -> RuSTy 编译验证
```

## 9. 常见错误

### 错误 1：`link.exe extra operand`

原因：Git Bash 里调用了 `/usr/bin/link`。

处理：使用 VS Developer Command Prompt，或确保 Visual Studio 的 linker 在 PATH 前面。

### 错误 2：`kernel32.lib no such file or directory`

原因：缺 Windows SDK。

处理：安装 Visual Studio Build Tools + Windows SDK。

### 错误 3：LLVM 相关错误

表现可能是：

```text
could not find native static library LLVM
llvm-config not found
LLVM_SYS_XXX_PREFIX not set
```

处理：按官方文档安装 LLVM 21，并设置对应环境变量。

## 10. 最小学习路径

1. 先阅读：`E:\PLC_Coding\rusty\examples`
2. 阅读官方文档：`https://plc-lang.github.io/rusty/`
3. 补齐 Visual Studio Build Tools。
4. 尝试 `cargo check -p plc_ast`。
5. 解决 LLVM 依赖。
6. 构建 release。
7. 把编译命令接入 AI Agent 的“生成后验证”流程。
