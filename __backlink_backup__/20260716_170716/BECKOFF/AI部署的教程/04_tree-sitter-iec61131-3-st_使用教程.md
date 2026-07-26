# tree-sitter-iec61131-3-st 使用教程

本地路径：`E:\PLC_Coding\tree-sitter-iec61131-3-st`

官方仓库：`https://github.com/HeytalePazguato/tree-sitter-iec61131-3-st`

npm 包：`tree-sitter-iec61131-3-st`

PyPI 包：`tree-sitter-iec61131-3-st`

## 1. 它是干什么的

`tree-sitter-iec61131-3-st` 是 IEC 61131-3 Structured Text 的 Tree-sitter 语法解析器。

它不负责编译，也不负责判断类型是否正确。它的作用是把 ST 代码变成结构化语法树。

比如这段 ST：

```st
FUNCTION_BLOCK PID
VAR_INPUT
    setpoint, process_var : REAL;
    Kp, Ki, Kd            : REAL;
END_VAR
VAR_OUTPUT
    output : REAL;
END_VAR
VAR
    error, prev_error, integral : REAL;
END_VAR

error := setpoint - process_var;
integral := integral + error;
output := Kp * error + Ki * integral + Kd * (error - prev_error);
prev_error := error;
END_FUNCTION_BLOCK
```

Tree-sitter 可以把它解析成类似这样的结构：

```text
function_block_declaration
  var_input
  var_output
  var_block
  assignment_statement
  binary_expression
```

对 AI Agent 来说，这非常重要，因为它让 Agent 不再靠正则硬猜代码结构。

## 2. 当前部署状态

已完成：

```text
E:\PLC_Coding\tree-sitter-iec61131-3-st
```

已验证：

```bash
cd /e/PLC_Coding/tree-sitter-iec61131-3-st
git rev-parse --short HEAD
# 00e24f5
```

## 3. 当前不能直接 npm/pip 安装的原因

已经尝试过：

```bash
cd /e/PLC_Coding/tree-sitter-iec61131-3-st
npm install
```

失败原因：`tree-sitter` 的 Node 原生扩展需要 Windows C++ 编译工具。

关键报错：

```text
You need to install the latest version of Visual Studio
including the "Desktop development with C++" workload.
```

也尝试过：

```bash
pip install tree-sitter tree-sitter-iec61131-3-st
```

同样失败，关键报错：

```text
Microsoft Visual C++ 14.0 or greater is required.
```

结论：需要先安装 Visual Studio Build Tools 2022。

## 4. 补齐依赖

安装 Visual Studio Build Tools 2022，勾选：

```text
Desktop development with C++
MSVC v143 x64/x86 build tools
Windows 10/11 SDK
```

安装后重启 Hermes / Git Bash，再验证：

```bash
find '/c/Program Files (x86)/Windows Kits' -name kernel32.lib | head
```

能找到 `kernel32.lib` 后，再继续安装。

## 5. Node 方式安装

### 方式 A：作为项目依赖

```bash
cd /e/PLC_Coding/tree-sitter-iec61131-3-st
npm install
npm test
```

### 方式 B：在自己的工具项目里使用

```bash
npm install tree-sitter tree-sitter-iec61131-3-st
```

示例 JS：

```js
import Parser from 'tree-sitter';
import IEC61131ST from 'tree-sitter-iec61131-3-st';

const parser = new Parser();
parser.setLanguage(IEC61131ST);

const source = `PROGRAM Hello
VAR
    counter : INT;
END_VAR
counter := counter + 1;
END_PROGRAM`;

const tree = parser.parse(source);
console.log(tree.rootNode.toString());
```

## 6. Python 方式安装

```bash
pip install tree-sitter tree-sitter-iec61131-3-st
```

示例 Python：

```python
import tree_sitter
import tree_sitter_iec61131_3_st

language = tree_sitter.Language(tree_sitter_iec61131_3_st.language())
parser = tree_sitter.Parser(language)

tree = parser.parse(b"PROGRAM Hello END_PROGRAM")
print(tree.root_node)
```

注意：当前机器缺 C++ Build Tools，所以这一步暂时会失败。补齐 Visual Studio Build Tools 后再执行。

## 7. tree-sitter CLI 使用

安装 CLI：

```bash
npm install -g tree-sitter-cli
```

进入本项目：

```bash
cd /e/PLC_Coding/tree-sitter-iec61131-3-st
```

生成 parser：

```bash
tree-sitter generate
```

运行测试：

```bash
tree-sitter test
```

解析单个文件：

```bash
tree-sitter parse examples/blink.st
```

## 8. 它支持哪些 ST 特性

当前 README 写明已经覆盖：

- `PROGRAM`
- `FUNCTION`
- `FUNCTION_BLOCK`
- `INTERFACE`
- `TYPE`
- `NAMESPACE`
- `CONFIGURATION`
- `RESOURCE`
- `VAR_INPUT`
- `VAR_OUTPUT`
- `VAR_GLOBAL`
- `VAR_IN_OUT`
- `CONSTANT`
- `RETAIN`
- 直接地址：`AT %IX`、`%QX`、`%MX` 等
- 基本类型：`BOOL`、`INT`、`REAL`、`STRING` 等
- `ARRAY`
- `STRUCT`
- 枚举
- 子范围
- `POINTER TO`
- `REF_TO`
- `IF / ELSIF / ELSE / END_IF`
- `CASE`
- `FOR`
- `WHILE`
- `REPEAT`
- `EXIT`
- `CONTINUE`
- `RETURN`
- OOP：`METHOD`、`PROPERTY`、`EXTENDS`、`IMPLEMENTS`
- 注释和 pragma

## 9. 它暂时不负责什么

它不是编译器，所以不负责：

- 类型检查
- 符号解析
- 代码生成
- 语义诊断
- 格式化
- TwinCAT / CODESYS 特有扩展的完整覆盖

README 里说明，厂商方言会放在未来扩展仓库：

```text
tree-sitter-iec61131-3-st-twincat
tree-sitter-iec61131-3-st-codesys
tree-sitter-iec61131-3-st-br
tree-sitter-iec61131-3-st-siemens
tree-sitter-iec61131-3-st-rockwell
```

## 10. 给 AI Agent 的用法

推荐封装成 4 类能力。

### 能力 1：提取 POU 列表

输入：项目目录。

输出：

```json
[
  {"kind": "PROGRAM", "name": "MAIN", "file": "MAIN.st"},
  {"kind": "FUNCTION_BLOCK", "name": "FB_Motor", "file": "FB_Motor.st"}
]
```

用途：让 Agent 快速知道项目有哪些程序、函数块、函数。

### 能力 2：提取变量表

输出：

```json
{
  "pou": "FB_Motor",
  "inputs": ["Start", "Stop", "Reset"],
  "outputs": ["Running", "Error"],
  "locals": ["state", "timer"]
}
```

用途：让 Agent 改代码前先理解接口。

### 能力 3：结构化 RAG 分块

不要按固定字符数切 ST 代码，而是按语法节点切：

```text
FUNCTION_BLOCK 一个块
METHOD 一个块
VAR_INPUT 一个块
VAR_OUTPUT 一个块
CASE 分支一个块
```

这样检索时更准。

### 能力 4：精准补丁定位

Agent 想改 `FB_Motor` 的 `VAR_OUTPUT`，可以先通过语法树定位 `var_output` 节点，而不是全文搜索 `VAR_OUTPUT`。

## 11. 推荐 Agent 工作流

```text
1. tree-sitter 解析所有 .st 文件
2. 生成项目结构索引：POU / 变量 / 调用 / 类型
3. 用户提出修改需求
4. AI 根据索引定位要改的 POU
5. AI 生成补丁
6. plc-st-review 做风险检查
7. RuSTy 或 truST 做编译/诊断
```

## 12. 和 plc-st-review 的关系

`plc-st-review` 本身就依赖这个 grammar。

区别：

| 工具 | 作用 |
|---|---|
| tree-sitter-iec61131-3-st | 解析 ST，生成语法树 |
| plc-st-review | 基于语法树做风险检查、复杂度分析、PR review |

所以如果你只想直接检查代码，用 `plc-st-review` 就行。

如果你要自己做 Agent 的“理解 PLC 项目”能力，就要用 `tree-sitter`。

## 13. 常见错误

### 错误 1：node-gyp 找不到 Visual Studio

处理：安装 Visual Studio Build Tools 2022 + Desktop development with C++。

### 错误 2：Python pip 编译失败

表现：

```text
Microsoft Visual C++ 14.0 or greater is required
```

处理同上。

### 错误 3：VS Code 里没效果

README 明确说明：VS Code 不原生使用 tree-sitter 做语法解析，VS Code 高亮主要靠 TextMate grammar，语义能力靠 language server。

所以这个包主要给程序/Agent 用，不是直接装进 VS Code 就生效。

## 14. 最小学习路径

1. 先补齐 Visual Studio Build Tools。
2. 安装 CLI：

```bash
npm install -g tree-sitter-cli
```

3. 进入目录：

```bash
cd /e/PLC_Coding/tree-sitter-iec61131-3-st
npm install
tree-sitter test
tree-sitter parse examples/blink.st
```

4. 用 Python 或 Node 写一个小脚本，输出 AST。
5. 把 AST 提取逻辑封装给 AI Agent。
