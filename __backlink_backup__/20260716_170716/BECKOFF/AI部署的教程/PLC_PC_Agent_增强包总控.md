# PLC/PC Agent 增强包总控

更新时间：2026-07-14

目标：把 Hermes / AI Agent 增强到能围绕 PLC + PC 工程形成完整闭环：

```text
查资料 -> 理解工程 -> 生成代码 -> 编译/静态检查 -> 单元测试/联调 -> 生成报告
```

本增强包根目录：

```text
E:\PLC_Coding
```

## 1. 当前完成状态

### PLC 编译 / 检查

| 工具 | 路径 | 作用 | 状态 |
|---|---|---|---|
| truST Platform | `E:\PLC_Coding\trust-platform` | IEC 61131-3 工作区、LSP、Runtime、Debug、Agent API | 已部署源码；完整编译需 C++ Build Tools / Windows SDK |
| PLC-lang / RuSTy | `E:\PLC_Coding\rusty` | Structured Text 编译器 | 已部署源码；完整编译需 C++ Build Tools，后续可能需 LLVM 21 |
| MATIEC | `E:\PLC_Coding\matiec` | IEC 61131-3 转 C 编译器 | 已部署源码 |
| plc-st-review | `E:\PLC_Coding\plc-st-review` | ST 语义审查、复杂度、PR review | 已部署源码；npm 安装需 C++ Build Tools |

### PLC 代码理解

| 工具 | 路径 | 作用 | 状态 |
|---|---|---|---|
| tree-sitter-iec61131-3-st | `E:\PLC_Coding\tree-sitter-iec61131-3-st` | ST 语法树解析 | 已部署源码；npm/pip 安装需 C++ Build Tools |
| plcopen-xml | `E:\PLC_Coding\plcopen-xml` | Java PLCopen XML parser | 已部署源码 |
| PLCOpen-XML-to-Text-Parser | `E:\PLC_Coding\PLCOpen-XML-to-Text-Parser` | PLCopen XML 转可读文本 | 已部署源码 |
| Beremiz | `E:\PLC_Coding\beremiz` | 开源 IEC 61131-3 IDE / PLC 工程环境 | 已部署源码 |
| OpenPLC Editor | `E:\PLC_Coding\OpenPLC_Editor` | OpenPLC 编辑器 / 工程结构参考 | 已部署源码 |

### TwinCAT 专项

| 工具 | 路径 | 作用 | 状态 |
|---|---|---|---|
| pyads | `E:\PLC_Coding\pyads` + Python 包 | Python 读写 TwinCAT ADS | 源码已部署；`pyads 3.6.0` 已安装成功 |
| TcUnit | `E:\PLC_Coding\TcUnit` | TwinCAT 单元测试框架 | 已部署源码 |
| TcOpen | `E:\PLC_Coding\TcOpen` | TwinCAT 工业自动化框架/库/CI 生态 | 已部署源码 |
| OSCAT | `E:\PLC_Coding\oscat` | IEC 61131-3 常用函数/FB 库 | 已部署源码 |

### PC / 上位机 / Agent 能力

| 工具 | 路径 | 作用 | 状态 |
|---|---|---|---|
| GitHub MCP Server | `E:\PLC_Coding\github-mcp-server` | GitHub 仓库/issue/PR/CI 操作 | 已部署源码 |
| Playwright MCP | `E:\PLC_Coding\playwright-mcp` | 浏览器自动化、Web UI 测试 | 已部署源码；配置模板已写 |
| Serena | `E:\PLC_Coding\serena` | 代码库语义检索/精准编辑 MCP | 已部署源码 |
| Semgrep MCP | `E:\PLC_Coding\semgrep-mcp` | 代码安全/质量扫描 MCP | 已部署源码 |
| filesystem MCP | npm 包 | 访问 `E:\PLC_Coding` 工作区 | 配置模板已写 |

### 知识库 / RAG

| 目录 | 用途 |
|---|---|
| `E:\PLC_Coding\knowledge_base\twincat_docs` | TwinCAT 文档、安装记录、报错截图、调试笔记 |
| `E:\PLC_Coding\knowledge_base\iec61131_st` | IEC 61131-3 / ST 规范、学习资料 |
| `E:\PLC_Coding\knowledge_base\beckhoff_libraries` | Beckhoff Tc2/Tc3 库手册 |
| `E:\PLC_Coding\knowledge_base\device_manuals` | EtherCAT 模块、伺服、传感器、驱动器手册 |
| `E:\PLC_Coding\knowledge_base\project_internal` | 课题组内部规范、变量命名、模板工程说明 |

### Hermes Skill

已创建：

```text
plc-structured-text-engineering
```

路径：

```text
E:\ai_agent\hermas\skills\software-development\plc-structured-text-engineering\SKILL.md
```

用途：以后需要写/审/解释 Structured Text 时，先加载这个 skill。

---

## 2. 推荐工作流

### 2.1 AI 生成 ST 代码

```text
用户需求
  -> 加载 skill: plc-structured-text-engineering
  -> 使用 templates/st 中的保守模板
  -> 生成 FUNCTION_BLOCK / PROGRAM
  -> 输出变量说明和扫描周期行为
```

模板位置：

```text
E:\PLC_Coding\templates\st\FB_StateMachine_Template.st
E:\PLC_Coding\templates\st\FB_AlarmLatch_Template.st
```

### 2.2 AI 读取/理解 PLC 工程

```text
ST 文件 / PLCopen XML
  -> tree-sitter / PLCopen parser
  -> 提取 POU、VAR_INPUT、VAR_OUTPUT、GVL、DUT、调用关系
  -> 生成工程结构摘要
```

优先工具：

```text
tree-sitter-iec61131-3-st
PLCOpen-XML-to-Text-Parser
plcopen-xml
Beremiz / OpenPLC Editor 工程结构
```

### 2.3 AI 检查 ST 代码

```text
ST 文件
  -> plc-st-review 静态审查
  -> RuSTy / MATIEC / truST 编译或诊断
  -> Markdown 审查报告
```

优先级：

```text
plc-st-review > tree-sitter > truST > RuSTy > MATIEC
```

### 2.4 TwinCAT 联调

```text
TwinCAT 工程
  -> TcUnit 写单元测试
  -> pyads 读写变量/做上位机 demo
  -> TcOpen / OSCAT 做库参考
```

pyads 模板：

```text
E:\PLC_Coding\templates\python\pyads_read_template.py
```

### 2.5 PC / 上位机代码增强

```text
GitHub MCP / filesystem MCP / Serena
  -> 读仓库、定位符号、改代码
Playwright MCP
  -> 测 Web UI / HMI / 文档页面
Semgrep MCP
  -> 查安全问题和代码质量
```

配置模板：

```text
E:\PLC_Coding\mcp-configs\hermes_mcp_plc_pc_agent_template.yaml
```

---

## 3. 当前最大阻塞

需要补装：

```text
Visual Studio Build Tools 2022
Desktop development with C++
MSVC v143 x64/x86 build tools
Windows 10/11 SDK
```

原因：以下工具都依赖 Windows 原生编译环境：

- Rust MSVC 链接
- node-gyp
- tree-sitter native binding
- Python native wheel

当前已验证缺失：

```text
kernel32.lib 未找到
Visual Studio Build Tools 未找到
npm tree-sitter 编译失败
pip tree-sitter-iec61131-3-st 编译失败
```

安装后先执行：

```bash
find '/c/Program Files (x86)/Windows Kits' -name kernel32.lib | head
export PATH="$HOME/.cargo/bin:$PATH"
cargo --version
rustc --version
npm --version
```

---

## 4. 分阶段补完路线

### 阶段 A：当前已完成

- [x] 前四个高优先级项目部署
- [x] 扩展部署 MATIEC / Beremiz / OpenPLC Editor / PLCopen XML parser
- [x] 扩展部署 pyads / TcUnit / TcOpen / OSCAT
- [x] 扩展部署 GitHub MCP / Playwright MCP / Serena / Semgrep MCP
- [x] 创建知识库目录骨架
- [x] 创建 ST 模板和 pyads 模板
- [x] 创建 Hermes skill
- [x] 写 MCP 配置模板

### 阶段 B：补齐本机编译环境

- [ ] 安装 Visual Studio Build Tools 2022
- [ ] 验证 Windows SDK
- [ ] 重新运行 `npm install` for `plc-st-review`
- [ ] 重新运行 `npm install` for `tree-sitter-iec61131-3-st`
- [ ] 重新运行 `cargo check` for `trust-platform`
- [ ] 重新运行 `cargo check` for `rusty`

### 阶段 C：做第一个可展示闭环

目标：让 AI 生成一个电机控制 FB，然后自动检查并输出报告。

- [ ] 新建 `E:\PLC_Coding\demo_project`
- [ ] 放入一个 ST 示例
- [ ] 用 skill 生成/修改 ST
- [ ] 用 plc-st-review 检查
- [ ] 输出 Markdown 报告

### 阶段 D：TwinCAT 专项演示

目标：用 pyads 读取 TwinCAT 变量，并生成 PC 侧代码。

- [ ] 确认 TwinCAT Runtime 运行
- [ ] 确认 AMS Net ID
- [ ] 用 `pyads_read_template.py` 读取一个变量
- [ ] 生成 Python/C# ADS 通信代码
- [ ] 写入报告

### 阶段 E：RAG 知识库

- [ ] 收集 TwinCAT 官方文档
- [ ] 收集 IEC 61131-3/ST 资料
- [ ] 收集 Beckhoff 常用库文档
- [ ] 收集设备手册
- [ ] 建立可检索索引

---

## 5. 最终目标形态

最终应该形成：

```text
PLC/PC Agent 增强包
├─ 可写 ST：skill + templates
├─ 可读 ST：tree-sitter + PLCopen parser
├─ 可查资料：knowledge_base + RAG
├─ 可检查：plc-st-review + Semgrep
├─ 可编译：truST / RuSTy / MATIEC
├─ 可联调：pyads + TwinCAT
├─ 可测试：TcUnit
├─ 可改 PC 代码：GitHub MCP + filesystem MCP + Serena
└─ 可测 UI：Playwright MCP
```

这就是面向 PLC + PC 工程代码的 AI Agent 能力闭环。
