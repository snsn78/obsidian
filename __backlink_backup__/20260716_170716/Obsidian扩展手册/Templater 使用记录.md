# Templater 使用记录

## 这是什么

`Templater` 是 Obsidian 里最常用的高级模板插件。它不只是“插入一段固定文字”，而是可以在模板里写变量、日期、脚本逻辑，让新笔记自动带上时间、标题、路径和结构。

当前安装版本：`2.23.1`

## 它能为你带来的具体功能

- 新建一篇笔记时自动生成标题、日期、标签和固定结构
- 自动插入当天日期、星期、时间戳
- 根据文件夹类型生成不同模板
- 一键生成会议纪要、学习笔记、项目记录、复盘记录
- 在模板里执行 JavaScript，做更复杂的内容拼装

## 最适合你的场景

- 学习笔记统一格式
- 每日记录、周报、复盘
- 项目文档和会议纪要
- 以后想和 QuickAdd 配合做“快速录入”

## 推荐配置教程

1. 打开 `设置 -> 社区插件 -> Templater`
2. 先设置 `Template folder location`
3. 推荐你在库里新建一个模板目录，例如 `90-Templates`
4. 打开 `Trigger Templater on new file creation`
5. 如果你以后需要在模板里运行脚本，再开启脚本相关设置

## 你可以这样开始用

先建立一个最基础模板，例如新建一份模板笔记：

```markdown
---
created: <% tp.date.now("YYYY-MM-DD HH:mm") %>
tags: []
---

# <% tp.file.title %>

## 一、核心内容

## 二、关键结论

## 三、下一步
```

然后在新笔记里执行命令：

`Ctrl + P -> Templater: Open insert template modal`

## 常见高频变量

- 当前日期：`<% tp.date.now("YYYY-MM-DD") %>`
- 当前时间：`<% tp.date.now("HH:mm") %>`
- 当前文件名：`<% tp.file.title %>`
- 昨天：`<% tp.date.now("YYYY-MM-DD", -1) %>`
- 明天：`<% tp.date.now("YYYY-MM-DD", 1) %>`

## 推荐你后续建立的模板类型

- 每日笔记模板
- 会议纪要模板
- 学习笔记模板
- 项目记录模板
- 复盘模板

## 注意事项

- Templater 比核心 Templates 更强，但也更复杂，建议先从“日期变量 + 固定结构”开始
- 如果你把它和 QuickAdd 配合起来，可以做到“一条命令直接生成某类笔记”
- 模板太复杂时，维护成本会上升，建议先做 2 到 4 个最常用模板
