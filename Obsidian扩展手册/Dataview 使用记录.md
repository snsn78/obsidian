# Dataview 使用记录

## 这是什么

`Dataview` 让 Obsidian 从普通笔记库变成“可查询的知识数据库”。只要你的笔记里有 frontmatter、标签、任务或行内字段，它就能自动汇总成列表、表格和看板。

当前安装版本：`0.5.68`

## 它能为你带来的具体功能

- 按条件列出某一类笔记
- 自动生成项目总览页
- 自动生成学习进度页
- 自动统计某个标签下的内容
- 把散落的笔记汇总成表格

## 最适合你的场景

- 学习资料归档
- 项目资料总览
- 知识卡片检索
- 任务与项目联动

## 推荐配置教程

1. 打开 `设置 -> 社区插件 -> Dataview`
2. 保持默认即可开始
3. 如果你以后想写更复杂逻辑，可以打开 `Enable JavaScript Queries`

## 使用它的前提

Dataview 最依赖“结构化信息”。推荐你以后在笔记顶部写 frontmatter，例如：

```yaml
---
type: study
status: active
course: control
created: 2026-07-16
tags:
  - 学习
---
```

## 最常用的 3 个查询例子

列出某个目录下的所有笔记：

```dataview
LIST
FROM "数学"
```

按表格方式展示：

```dataview
TABLE type, status, created
FROM ""
WHERE type
SORT created DESC
```

列出包含未完成任务的笔记：

```dataview
TASK
FROM ""
WHERE !completed
```

## 建议你怎么用

- 先统一几类常用笔记的 frontmatter
- 再做一个“总览页”
- 最后再逐步增加筛选条件

## 和其他插件的联动方式

- 配合 `Templater`：模板自动生成 frontmatter
- 配合 `QuickAdd`：快速创建结构化笔记
- 配合 `Tasks`：把任务结果汇总到总览页

## 注意事项

- Dataview 的核心不是语法，而是你的笔记字段是否统一
- 如果字段命名混乱，查询会越来越难维护
- 建议你先统一 `type`、`status`、`created` 这 3 个字段
