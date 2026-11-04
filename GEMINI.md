# Workspace Instructions & Project Rules

## 1. Communication & Text Formatting (BiDi / RTL)
Whenever responding or generating text in Arabic (especially when mixing Arabic with English terms, code keywords, library names, or file paths):
1. **Always wrap paragraphs and list items with Unicode RLE (`U+202B` / `‫`) and PDF (`U+202C` / `‬`)**:
   - Every Arabic line/paragraph MUST start with `‫` (`\u202B`) and end with `‬` (`\u202C`).
   - For bullet items: `‫المحتوى العربي مع English في وسطه.‬`
2. **Never attach punctuation directly to English words**:
   - Punctuation like `:`, `.`, or brackets `()` must not directly touch trailing English words without an Arabic separator or boundary.
3. **Space around the article "الـ"**:
   - Always write `الـ Frontend` with a separating space, not `الـFrontend`.
4. **Code Blocks**:
   - Multi-line commands and code snippets must be placed in their own separate fenced code blocks (```...```).

---

## 2. HR System Architecture & Security Rules (STRICT)
You are working on an Enterprise HR System built with ASP.NET Core Web API, Clean Architecture, CQRS (MediatR), and Entity Framework Core. You MUST strictly follow these rules on every task:

### A. Architectural Boundaries (Zero Tolerance)
- **Thin Controllers Only:** Controllers in `PL.API` MUST ONLY inject `ISender` (MediatR).
- **NO DbContext in API Layer:** NEVER inject `HRDbContext` into any Controller or endpoint using `[FromServices]` or constructor injection.
- **NO Raw SQL in Controllers:** NEVER run `ExecuteSqlRawAsync` or EF Core queries directly in `PL.API`. All database operations belong strictly inside Command/Query Handlers or Infrastructure services.
- **Namespace Preservation:** Note that the Application layer namespace is currently spelled `Appllication` (with three 'l's). Use the existing namespace imports unless explicitly asked to refactor the project name.

### B. Security & Authorization Rules
- **NEVER use `[AllowAnonymous]`** on any endpoint except Login/Register/RefreshToken, unless explicitly instructed and confirmed by the user.
- **Data Scoping:**
  - Regular employees (`!User.IsInRole("HR")`) can ONLY read their own records via their `"EmployeeId"` JWT claim.
  - Endpoints returning department-wide, company-wide, or device-log data MUST be protected with `[Authorize(Policy = "AdminOnly")]` or `[Authorize(Roles = "HR")]`.
  - All state-changing endpoints (`POST`, `PUT`, `DELETE`, file uploads) in Attendance, Payroll, Leaves, and Employees MUST require appropriate admin/HR authorization.

### C. No Destructive Testing Hacks in Production Controllers
- NEVER add data-wiping, table-truncating, or seed-resetting endpoints inside business controllers (like `AttendanceController`, `PayrollController`, etc.).
- If a development utility is requested, ask first, place it in a dedicated `DevToolsController`, guard it with `if (!_env.IsDevelopment()) return NotFound();`, and require SuperAdmin authorization.

### D. Coding Style & Modification Scope
- **Do NOT touch unrelated files:** Only modify the specific file or feature requested.
- **DRY Principle:** Do not duplicate claim-checking logic across multiple actions in the same controller; use a private helper method or shared service.
- **Consistent Responses:** Return standard `ApiResponse<T>` objects consistently across handlers and controllers.