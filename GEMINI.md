# Workspace Instructions & Arabic BiDi Guidelines

## Communication & Text Formatting (BiDi / RTL)
Whenever responding or generating text in Arabic (especially when mixing Arabic with English terms, code keywords, library names, or file paths):
1. **Always wrap paragraphs and list items with Unicode RLE (`U+202B` / `‫`) and PDF (`U+202C` / `‬`)**:
   - Every Arabic line/paragraph MUST start with `‫` (`\u202B`) and end with `‬` (`\u202C`).
   - For bullet items: `* ‫المحتوى العربي مع English في وسطه.‬`
2. **Never attach punctuation directly to English words**:
   - Punctuation like `:`, `.`, or brackets `()` must not directly touch trailing English words without an Arabic separator or boundary.
3. **Space around the article "الـ"**:
   - Always write `الـ Frontend` with a separating space, not `الـFrontend`.
4. **Code Blocks**:
   - Multi-line commands and code snippets must be placed in their own separate fenced code blocks (```...```).
