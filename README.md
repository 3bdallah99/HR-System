# 🏢 HR Management System API

Enterprise-grade HR & Payroll Web API built with **ASP.NET Core 8**, **Clean Architecture**, **CQRS (MediatR)**, and **Entity Framework Core 8**.

---

## 🚀 Key Highlights & Workflows

1. **Biometric-Only Attendance & Tardiness Tracking**:
   - Integrated with ZKTeco Biometric Devices via `/api/attendance/iclock/cdata`.
   - Automatic calculation of `LateMinutes` for clock-ins past `09:00 AM`.
   - **60-Minute Monthly Free Tardiness Allowance**: Only minutes exceeding 60 in a calendar month are subject to payroll deductions.
2. **Direct-to-HR Leave Management**:
   - Employees submit leave requests directly to HR (no manager approval intermediary).
   - Real-time balance validation and automatic day deductions upon HR approval.
3. **Customizable Salary Structure & Automated Payroll Engine**:
   - HR configures custom earnings (Basic, Housing, Transport, Meal, Other, Overtime) and fixed deductions (Social Insurance, Taxes, Other) per employee via `/api/payroll/salary-structure/{employeeId}`.
   - Monthly payroll runs (`POST /api/payroll/run`) automatically compute:
     - Absence deductions (based on business working days).
     - Tardiness deductions (based on per-minute rate for minutes over 60).
     - Net pay.
   - Post-run manual adjustments supported via `PUT /api/payroll/{id}`.
4. **Self-Service Password Management**:
   - Employees securely change their own passwords via `POST /api/auth/change-password` (identity extracted securely from JWT claims).
5. **Security & Permissions**:
   - Role-Based Access Control (`HR` vs `Employee`).
   - FluentValidation automatic request validation pipeline.
   - Serilog structured logging and SQL Server health checks.

---

## 🛠️ Tech Stack

- **Framework**: .NET 8.0 (C# 12)
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, Presentation)
- **Patterns**: CQRS via MediatR, Repository Pattern & Unit of Work
- **Database**: Microsoft SQL Server + Entity Framework Core 8
- **Authentication**: JWT Bearer + ASP.NET Core Identity
- **Validation**: FluentValidation
- **Logging**: Serilog

---

## 🚀 Getting Started

### 1. Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- SQL Server (LocalDB or full instance)
- EF Core CLI (`dotnet tool install --global dotnet-ef`)

### 2. Configure Connection String
Edit `PL.API/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=HR_DB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 3. Apply Database Migrations
```powershell
dotnet ef database update --project Infrastructure --startup-project PL.API
```

### 4. Run the API
```powershell
dotnet run --project PL.API
```
Navigate to `https://localhost:7087/swagger` to explore and test the endpoints.

---

## 📖 Complete Documentation
For detailed sequence diagrams, entity relationship models, and the full API specification, refer to the [System Documentation](file:///C:/Users/%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D9%84%D9%87%D8%A7%D9%86%D9%88%D8%B1%D8%A7%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85%D8%A7%D8%A8/.gemini/antigravity/brain/81e8be67-d03c-446d-ae4b-5cb68b952ed4/HR_System_Documentation.md).