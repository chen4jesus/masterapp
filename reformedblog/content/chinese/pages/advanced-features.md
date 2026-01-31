---
title: 高级功能 - Advanced Features
meta_title: ""
description: 展示 Reformed Blog 主题的高级功能
date: 2026-01-15T22:30:00.000Z
image: images/bilingual-demo.jpg
categories:
  - Tutorial
author: FC
tags:
  - advanced
  - demo
keywords:
  - 双语
  - 词云
  - 图谱
draft: false
---

This page demonstrates advanced features of the Reformed Blog theme.
本页面展示了 Reformed Blog 主题的高级功能。

---

## Bilingual Reading / 双语并排阅读

To create a bilingual block in your blog post, use the following syntax:

要在博客文章中创建双语块，请使用以下语法：

```markdown
{{</* bilingual */>}}
::en::
Your English paragraph 1

Your English paragraph 2

::zh::
中文段落 1

中文段落 2
{{</* /bilingual */>}}
```

**Tips / 提示:**

- Separate paragraphs with blank lines / 用空行分隔段落
- The number of paragraphs should match on both sides / 两边的段落数量应该匹配
- Clicking a paragraph highlights the corresponding pair / 点击段落会高亮对应的一对

**效果如下：**

{{< bilingual >}}
::zh::
神的恩典是一切真正信仰的基础。没有祂的恩典，我们无法理解属灵真理，也无法归信。

信心不仅仅是对某些教义的理智认同。它是对永活之神的活泼信靠，这位神已经在耶稣基督里启示了祂自己。

祷告是我们与天父沟通的方式。通过祷告，我们表达对祂的依赖和对祂应许的信任。

神的话语是我们的指南和光。它照亮公义的道路，向我们显明救恩之路。

::en::
The grace of God is the foundation of all true religion. Without His grace, we cannot understand spiritual truths, nor can we come to faith.

Faith is not merely intellectual assent to certain doctrines. It is a living trust in the living God, who has revealed Himself in Jesus Christ.

Prayer is the means by which we communicate with our Heavenly Father. Through prayer, we express our dependence on Him and our trust in His promises.

The Word of God is our guide and light. It illuminates the path of righteousness and shows us the way of salvation.
{{< /bilingual >}}

---

## Word Cloud / 词云

add the wordcloud shortcode to display a word cloud of the current page's tags and categories:

添加词云短代码以显示当前页面的标签和类别的词云：

```markdown
{{</* wordcloud source="tags" */>}}

{{</* wordcloud source="categories" */>}}
```

**Tips / 提示:**

- The wordcloud shortcode will automatically extract keywords from the current page's tags and categories and generate a word cloud.

词云短代码会自动从当前页面的标签和类别中提取关键词，并生成词云。

**效果如下：**

{{< wordcloud source="tags" >}}

{{< wordcloud source="categories" >}}

---

## Knowledge Graph / 标签图谱

Add the knowledge graph shortcode to display an interactive visualization of related content:

添加标签图谱短代码以显示相关内容的交互式可视化：

```markdown
{{</* knowledge-graph */>}}
```

**Tips / 提示:**
System will automatically extract tags from the current page and generate a knowledge graph.

系统会自动从当前页面的标签中提取关键词，并生成标签图谱。

**效果如下：**

Click the floating button in the bottom-left corner to open the graph:

点击左下角的浮动按钮打开图谱：
{{< knowledge-graph >}}

---
