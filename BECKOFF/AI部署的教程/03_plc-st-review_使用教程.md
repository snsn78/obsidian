# plc-st-review 使用教程

本地路径：`E:\PLC_Coding\plc-st-review`

官方仓库：`https://github.com/HeytalePazguato/plc-st-review`

## 1. 它是干什么的

`plc-st-review` 是一个 IEC 61131-3 Structured Text 语义级 linter / code reviewer / team-style enforcer。

简单说：它不是普通文本检查，而是会解析 `.st` 文件，找 PLC 代码里的真实风险。

它能检查的问题包括：

- 数组越界
- 除零
- 无限循环
- 定时器/计数器参数大幅变化
- Function Block 实例读取但没有调用
- 输入变量被写入
- 全局变量被遮蔽
- 安全关键常量被修改
- 硬编码密码、IP、URL、OPC/MQTT/Modbus endpoint
- 复杂度过高
- 嵌套过深
- 死 POU / 没人调用的 Function Block
- PR 中调用点没有跟着函数签名变化同步修改

对 AI Agent 来说，它的价值是：

```text
AI 写 ST 代码
  -> plc-st-review 检查工业风险
  -> AI 根据报告修复
  -> 再检查
```

## 2. 当前部署状态

已完成：

```text
E:\PLC_Coding\plc-st-review
```

已验证：

```bash
cd /e/PLC_Coding/plc-st-review
git rev-parse --short HEAD
# 1f7730d
```

## 3. 当前 npm 安装失败原因

执行过：

```bash
cd /e/PLC_Coding/plc-st-review
npm install
```

失败原因不是项目本身，而是它依赖 `tree-sitter-iec61131-3-st`，这个包有 Windows 原生扩展，需要 C/C++ 编译工具。

报错关键句：

```text
You need to install the latest version of Visual Studio
including the "Desktop development with C++" workload.
```

所以要先安装：

```text
Visual Studio Build Tools 2022
Desktop development with C++
MSVC v143 x64/x86 build tools
Windows 10/11 SDK
```

## 4. 安装方式

### 方式 A：全局安装，最适合日常使用

补齐 C++ Build Tools 后执行：

```bash
npm install -g plc-st-review
plc-st-review --help
```

### 方式 B：在当前源码目录安装

```bash
cd /e/PLC_Coding/plc-st-review
npm install
npm run build
node dist/cli.js --help
```

### 方式 C：不用本地 Node 编译，直接用 GitHub Actions

如果你的 PLC 项目放 GitHub，可以在项目里加：

```yaml
name: lint
on: [push]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx plc-st-review --lint "src/**/*.st"
```

这样在云端跑，不受本机 Windows 编译环境影响。

## 5. 最基础使用：检查 ST 文件

假设你的 PLC 代码在：

```text
E:\PLC_Coding\my_plc_project\src
```

检查所有 `.st` 文件：

```bash
plc-st-review --lint "/e/PLC_Coding/my_plc_project/src/**/*.st"
```

如果在项目根目录执行：

```bash
cd /e/PLC_Coding/my_plc_project
plc-st-review --lint "src/**/*.st"
```

输出格式默认是终端可读报告。

## 6. 输出 JSON，方便 AI Agent 读取

```bash
plc-st-review --lint "src/**/*.st" --output json --out-file findings.json
```

Agent 可以读取 `findings.json`，根据每条 finding 的：

```text
文件
行号
严重等级
检查类别
问题描述
建议修复
```

自动生成修复补丁。

## 7. 指标模式：分析复杂度和死代码

```bash
plc-st-review --metrics src/
```

只看复杂度最高的 20 个 POU：

```bash
plc-st-review --metrics src/ --sort complexity --top 20
```

超过复杂度阈值就返回失败：

```bash
plc-st-review --metrics src/ --threshold complexity=25
```

导出 JSON：

```bash
plc-st-review --metrics src/ --format json > metrics.json
```

导出调用图 DOT：

```bash
plc-st-review --metrics src/ --format dot > deps.dot
```

如果安装了 Graphviz：

```bash
dot -Tsvg deps.dot -o deps.svg
```

## 8. 配置文件 `.plc-st-review.yml`

在 PLC 项目根目录创建：

```yaml
case_sensitive: false

safety_critical_prefixes:
  - SAFETY_
  - INTERLOCK_
  - SIL_
  - E_STOP_

reporting:
  fail_on_severity: error

parsing:
  max_file_size_bytes: 1048576

metrics:
  cyclomatic_complexity:
    warn: 15
    error: 25
  nesting_depth:
    warn: 4
    error: 6
  lines_of_code:
    warn: 300
    error: 600

forbidden_symbols:
  - DebugOverride
  - ForceOutput
  - BypassSafety
```

说明：

- TwinCAT / CODESYS 一般大小写不敏感，所以 `case_sensitive: false`。
- `SAFETY_`、`INTERLOCK_` 这类前缀会提高风险等级。
- `forbidden_symbols` 可以禁止项目中不允许出现的危险变量/函数名。

## 9. GitHub PR 自动审查

在 PLC 项目里创建：

```text
.github/workflows/plc-st-review.yml
```

内容：

```yaml
name: PLC ST Review
on:
  pull_request:
    paths: ['**/*.st', '**/*.ST']
permissions:
  contents: read
  pull-requests: write
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: HeytalePazguato/plc-st-review@v0
```

效果：PR 里改了 ST 文件后，它会自动在对应代码行下面评论风险。

## 10. 给 AI Agent 的封装方式

推荐封装成 3 个 Agent 工具：

### 工具 1：lint_st_code

输入：

```text
项目路径
glob，例如 src/**/*.st
```

执行：

```bash
plc-st-review --lint "src/**/*.st" --output json --out-file findings.json
```

输出：`findings.json`

### 工具 2：metrics_st_project

执行：

```bash
plc-st-review --metrics src/ --format json > metrics.json
```

输出：复杂度、嵌套、死代码、调用关系。

### 工具 3：review_st_diff

执行：

```bash
plc-st-review --base main --head HEAD --output json --out-file review.json
```

用于 PR / 分支改动审查。

## 11. 和 AI 生成代码的推荐流程

```text
1. 用户描述控制逻辑
2. AI 生成 ST 文件
3. plc-st-review --lint 检查
4. 如果有 error，AI 修复
5. plc-st-review --metrics 检查复杂度
6. 输出最终 ST 代码 + 检查报告
```

## 12. 常见错误

### 错误 1：`node-gyp` 找不到 Visual Studio

处理：安装 Visual Studio Build Tools 2022，勾选 Desktop development with C++。

### 错误 2：路径 glob 匹配不到文件

在 Git Bash 中推荐使用：

```bash
plc-st-review --lint "src/**/*.st"
```

不要用 Windows 反斜杠：

```text
src\**\*.st
```

### 错误 3：很多生成文件太大

加参数：

```bash
plc-st-review --lint "src/**/*.st" --max-file-size 0
```

或在 `.plc-st-review.yml` 设置更大值。

## 13. 最小学习路径

1. 补齐 Visual Studio Build Tools。
2. 运行：

```bash
npm install -g plc-st-review
plc-st-review --help
```

3. 用示例项目试跑：

```bash
cd /e/PLC_Coding/plc-st-review
plc-st-review --metrics examples/state-machine/
```

4. 在自己的 PLC 项目中运行：

```bash
plc-st-review --lint "src/**/*.st"
```

5. 把 JSON 输出接入 AI Agent。
