---
name: arabic-bidi-formatter
description: >-
  Use this skill whenever generating responses or text in Arabic, especially when mixing Arabic with English
  terms, code, file paths, or commands, to ensure flawless Right-to-Left (RTL) formatting and prevent text,
  bracket, and punctuation inversion in LTR chat windows and IDEs.
---

# Arabic BiDi & RTL Chat Formatter Skill

This skill provides precise rules and techniques for formatting Arabic text (with or without inline English terms) in chat interfaces, IDE webviews, and markdown renderers that default to a Left-to-Right (LTR) container.

## 1. The Core Problem (BiDi Chunk Inversion)
In standard IDE chat panels (such as VS Code and Antigravity webviews), the root container has `direction: ltr`.
Under the Unicode Bidirectional Algorithm (UBA), when an LTR container processes a line mixing RTL (Arabic) and LTR (English) text:
- Each directional run is ordered **from Left to Right**.
- This causes the sentence to be visually reversed: the start of the sentence appears on the far left, while the end appears on the far right.
- Brackets, colons, and punctuation get flipped to the wrong side.

## 2. The Solution: Unicode RLE (`U+202B`) Wrapping
To force the layout engine to render the sentence in natural Right-to-Left order regardless of the container direction, wrap every Arabic paragraph or list item with **Unicode Right-to-Left Embedding (RLE - `U+202B` / `‫`)** and close it with **Pop Directional Formatting (PDF - `U+202C` / `‬`)**:

```text
‫نص عربي يدمج كلمات إنجليزي مثل Frontend أو Backend في وسطه بكل سلاسة.‬
```

### In Markdown / Text Generation:
- Start the line/paragraph with `\u202B` (character: `‫`).
- End the line/paragraph with `\u202C` (character: `‬`).

## 3. Formatting Guidelines & Rules

### Rule A: Spacing Around English Terms
- Always leave a space before and after the English term.
- When prefixing with "الـ", write `الـ Frontend` with a space, never `الـFrontend` without space.

### Rule B: Neutral Punctuation Isolation
- Neutral punctuation marks (like `:`, `.`, `,`, `!`, `?`, `-`) should never be attached directly to an LTR word at the end of a clause.
- Always ensure the sentence ends after an Arabic word or within the `‫...‬` RLE boundary.
- Example:
  - ❌ Incorrect: `في ملف Program.cs:`
  - ✅ Correct: `‫في ملف Program.cs الخاص بالمشروع:‬`

### Rule C: Code Blocks & Shell Commands
- Standalone commands, terminal scripts, and full code snippets should remain in standard markdown fenced code blocks (```...```) on their own lines. They do not require RLE embedding as they are pure LTR.
- For inline code mentions (e.g. `` `git push` ``), keep them inside the RLE stream:
  `‫استخدم الأمر `git push` لرفع التعديلات.‬`

### Rule D: Lists & Bullet Points
When using bullet points (`*` or `-`), place the RLE character immediately after the bullet marker:
```markdown
* ‫السطر الأول المكتوب بالعربي مع مصطلحات إنجليزي زي API.‬
* ‫السطر الثاني لاختبار التوجيه السليم.‬
```

## 4. Verification Check
- Read the sentence from right to left.
- Ensure the beginning of the sentence is at the right edge, the English word appears in the correct reading order, and the concluding punctuation is at the left edge of the sentence.
