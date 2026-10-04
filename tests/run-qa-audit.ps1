<#
.SYNOPSIS
    HRMS Enterprise Automated E2E QA Test Runner & Health Audit
.DESCRIPTION
    Executes an end-to-end integration test across all 5 core modules:
    Authentication, Organization Catalog, Leaves, Biometrics & Payroll Engine.
#>

$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$BaseUrl = "https://localhost:7129/api"
$PassCount = 0
$FailCount = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = ""
    )
    if ($Success) {
        $global:PassCount++
        Write-Host " [PASS] " -ForegroundColor Green -NoNewline
        Write-Host "$TestName" -ForegroundColor White
        if ($Details) { Write-Host "        $Details" -ForegroundColor DarkGray }
    } else {
        $global:FailCount++
        Write-Host " [FAIL] " -ForegroundColor Red -NoNewline
        Write-Host "$TestName" -ForegroundColor White
        if ($Details) { Write-Host "        $Details" -ForegroundColor Yellow }
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "    ENTERPRISE HRMS SYSTEM HEALTH & QA AUDIT SUITE       " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# 1. AUTHENTICATION & TOKEN LIFECYCLE
# -----------------------------------------------------------------------------
Write-Host "MODULE 1: AUTHENTICATION & IDENTITY" -ForegroundColor Yellow

$AuthToken = $null
try {
    $loginBody = @{
        email = "hr@example.com"
        password = "Welcome@123"
    } | ConvertTo-Json

    $loginRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($loginRes.success -and $loginRes.data) {
        $AuthToken = $loginRes.data
        Write-TestResult "HR Admin Login & Token Ingestion" $true "Token length: $($AuthToken.Length)"
    } else {
        Write-TestResult "HR Admin Login & Token Ingestion" $false $loginRes.message
    }
} catch {
    Write-TestResult "HR Admin Login & Token Ingestion" $false $_.Exception.Message
}

if (-not $AuthToken) {
    Write-Host "`nCannot continue without valid authentication token. Aborting test suite." -ForegroundColor Red
    exit 1
}

$Headers = @{
    Authorization = "Bearer $AuthToken"
    "Content-Type" = "application/json"
}

# -----------------------------------------------------------------------------
# 2. ORGANIZATION DIRECTORY (Departments, Positions, Employees)
# -----------------------------------------------------------------------------
Write-Host "`nMODULE 2: ORGANIZATION DIRECTORY" -ForegroundColor Yellow

$DeptId = $null
try {
    $deptName = "QA Automated Branch $(Get-Random -Minimum 1000 -Maximum 9999)"
    $deptRes = Invoke-RestMethod -Uri "$BaseUrl/department" -Method Post -Body (@{ name = $deptName } | ConvertTo-Json) -Headers $Headers
    if ($deptRes.success) {
        $DeptId = $deptRes.data
        Write-TestResult "Department Creation ($deptName)" $true "Department ID: $DeptId"
    } else {
        Write-TestResult "Department Creation" $false $deptRes.message
    }
} catch {
    Write-TestResult "Department Creation" $false $_.Exception.Message
}

$PosId = $null
if ($DeptId) {
    try {
        $posBody = @{
            title = "Lead Automation Engineer $(Get-Random -Minimum 100 -Maximum 999)"
            baseSalary = 6500
            departmentId = $DeptId
        } | ConvertTo-Json

        $posRes = Invoke-RestMethod -Uri "$BaseUrl/position" -Method Post -Body $posBody -Headers $Headers
        if ($posRes.success) {
            $PosId = $posRes.data
            Write-TestResult "Position Role Creation with Salary Benchmark" $true "Position ID: $PosId"
        } else {
            Write-TestResult "Position Creation" $false $posRes.message
        }
    } catch {
        Write-TestResult "Position Creation" $false $_.Exception.Message
    }
}

$EmpId = $null
if ($DeptId -and $PosId) {
    try {
        $rnd = Get-Random -Minimum 1000 -Maximum 9999
        $empBody = @{
            name = "Test Personnel $rnd"
            email = "personnel$rnd@qa-hrms.com"
            phone = "+1-555-0$rnd"
            address = "123 Quality Assurance Blvd"
            hireDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            departmentId = $DeptId
            positionId = $PosId
        } | ConvertTo-Json

        $empRes = Invoke-RestMethod -Uri "$BaseUrl/employee" -Method Post -Body $empBody -Headers $Headers
        if ($empRes.success) {
            $EmpId = $empRes.data
            Write-TestResult "Employee Registration & Identity Account Provisioning" $true "Employee ID: $EmpId"
        } else {
            Write-TestResult "Employee Registration" $false $empRes.message
        }
    } catch {
        Write-TestResult "Employee Registration" $false $_.Exception.Message
    }
}

# -----------------------------------------------------------------------------
# 3. LEAVE MANAGEMENT HUB
# -----------------------------------------------------------------------------
Write-Host "`nMODULE 3: LEAVE MANAGEMENT HUB" -ForegroundColor Yellow

if ($EmpId) {
    try {
        $quotaBody = @{
            employeeId = $EmpId
            year = (Get-Date).Year
            leaveType = 1 # Vacation
            totalDays = 24
        } | ConvertTo-Json

        $quotaRes = Invoke-RestMethod -Uri "$BaseUrl/leave/balances" -Method Post -Body $quotaBody -Headers $Headers
        Write-TestResult "Direct HR Annual Quota Allocation (24 Days)" $quotaRes.success
    } catch {
        Write-TestResult "Quota Allocation" $false $_.Exception.Message
    }

    $LeaveReqId = $null
    try {
        $leaveBody = @{
            employeeId = $EmpId
            leaveType = 1
            startDate = (Get-Date).AddDays(10).ToString("yyyy-MM-dd")
            endDate = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")
            reason = "Automated test absence"
        } | ConvertTo-Json

        $leaveRes = Invoke-RestMethod -Uri "$BaseUrl/leave/requests" -Method Post -Body $leaveBody -Headers $Headers
        if ($leaveRes.success) {
            $LeaveReqId = $leaveRes.data
            Write-TestResult "Direct-to-HR Leave Application Submission" $true "Leave Request ID: $LeaveReqId"
        } else {
            Write-TestResult "Leave Application" $false $leaveRes.message
        }
    } catch {
        Write-TestResult "Leave Application" $false $_.Exception.Message
    }

    if ($LeaveReqId) {
        try {
            $approveRes = Invoke-RestMethod -Uri "$BaseUrl/leave/requests/$LeaveReqId/approve" -Method Post -Body "{}" -Headers $Headers
            Write-TestResult "HR One-Click Leave Approval Action" $approveRes.success
        } catch {
            Write-TestResult "HR Leave Approval" $false $_.Exception.Message
        }
    }
}

# -----------------------------------------------------------------------------
# 4. BIOMETRIC ATTENDANCE & 60-MIN TARDINESS RULE
# -----------------------------------------------------------------------------
Write-Host "`nMODULE 4: BIOMETRIC ATTENDANCE & 60-MIN TARDINESS RULE" -ForegroundColor Yellow

if ($EmpId) {
    try {
        $today = (Get-Date).ToString("yyyy-MM-dd")
        $attBody = @{
            employeeId = $EmpId
            date = $today
            status = 2 # Late
            clockIn = (Get-Date).Date.AddHours(9).AddMinutes(35).ToString("yyyy-MM-ddTHH:mm:ssZ")
            clockOut = (Get-Date).Date.AddHours(17).ToString("yyyy-MM-ddTHH:mm:ssZ")
            lateMinutes = 35
            note = "Biometric check-in test"
        } | ConvertTo-Json

        $attRes = Invoke-RestMethod -Uri "$BaseUrl/attendance" -Method Post -Body $attBody -Headers $Headers
        Write-TestResult "Biometric Punch Record Logging (35 Late Minutes)" $attRes.success
    } catch {
        Write-TestResult "Attendance Record Logging" $false $_.Exception.Message
    }

    try {
        $year = (Get-Date).Year
        $month = (Get-Date).Month
        $tardRes = Invoke-RestMethod -Uri "$BaseUrl/attendance/tardiness/$($EmpId)?year=$year&month=$month" -Method Get -Headers $Headers
        if ($tardRes.success -and $tardRes.data) {
            $tData = $tardRes.data
            $isWithinGrace = ($tData.totalLateMinutes -le 60) -and ($tData.deductibleMinutes -eq 0)
            Write-TestResult "60-Minute Tardiness Rule Validation (35m <= 60m => Deductible: 0m)" $isWithinGrace "Late: $($tData.totalLateMinutes)m | Deductible: $($tData.deductibleMinutes)m"
        } else {
            Write-TestResult "Tardiness Calculation" $false $tardRes.message
        }
    } catch {
        Write-TestResult "Tardiness Calculation" $false $_.Exception.Message
    }
}

# -----------------------------------------------------------------------------
# 5. SALARY STRUCTURE & AUTOMATED PAYROLL ENGINE
# -----------------------------------------------------------------------------
Write-Host "`nMODULE 5: SALARY STRUCTURE & AUTOMATED PAYROLL ENGINE" -ForegroundColor Yellow

if ($EmpId -and $DeptId) {
    try {
        $structBody = @{
            basicSalary = 6500
            housingAllowance = 1200
            transportationAllowance = 400
            mealAllowance = 250
            otherAllowances = 150
            overtimePay = 300
            socialInsurance = 650
            taxAmount = 450
            otherDeductions = 50
        } | ConvertTo-Json

        $structRes = Invoke-RestMethod -Uri "$BaseUrl/payroll/salary-structure/$EmpId" -Method Post -Body $structBody -Headers $Headers
        Write-TestResult "Salary Structure Configuration & Deductions Upsert" $structRes.success
    } catch {
        Write-TestResult "Salary Structure Configuration" $false $_.Exception.Message
    }

    try {
        $runBody = @{
            month = (Get-Date).Month
            year = (Get-Date).Year
            workingDaysInMonth = 22
            departmentId = $DeptId
        } | ConvertTo-Json

        $runRes = Invoke-RestMethod -Uri "$BaseUrl/payroll/run" -Method Post -Body $runBody -Headers $Headers
        if ($runRes.success -and $runRes.data) {
            $r = $runRes.data
            Write-TestResult "Automated Monthly Payroll Execution" $true "Processed: $($r.processedCount) | Skipped: $($r.skippedCount) | Total: `$$($r.totalNetPay)"
        } else {
            Write-TestResult "Payroll Execution" $false $runRes.message
        }
    } catch {
        Write-TestResult "Payroll Execution" $false $_.Exception.Message
    }

    try {
        $slipsRes = Invoke-RestMethod -Uri "$BaseUrl/payroll/employee/$($EmpId)?year=$((Get-Date).Year)" -Method Get -Headers $Headers
        if ($slipsRes.success -and $slipsRes.data.items.Count -gt 0) {
            $firstSlip = $slipsRes.data.items[0]
            Write-TestResult "Itemized Payslip Verification" $true "Net Take-Home: `$$($firstSlip.netPay) (Gross: `$$($firstSlip.grossPay))"
        } else {
            Write-TestResult "Itemized Payslip Verification" $false "No payslip generated"
        }
    } catch {
        Write-TestResult "Payslip Verification" $false $_.Exception.Message
    }
}

# -----------------------------------------------------------------------------
# SUMMARY REPORT
# -----------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "                QA TEST AUDIT SUMMARY                    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Total Tests Executed : $($PassCount + $FailCount)" -ForegroundColor White
Write-Host " Passed               : $PassCount" -ForegroundColor Green
$failColor = if ($FailCount -eq 0) { "Green" } else { "Red" }
Write-Host " Failed               : $FailCount" -ForegroundColor $failColor
Write-Host " Pass Rate            : $([math]::Round(($PassCount / ($PassCount + $FailCount)) * 100, 1))%`n" -ForegroundColor Cyan

if ($FailCount -eq 0) {
    Write-Host "ALL BACKEND & SYSTEM VERIFICATION AUDITS PASSED SUCCESSFULLY!" -ForegroundColor Green
} else {
    Write-Host "SOME TESTS ENCOUNTERED FAILURES. PLEASE REVIEW LOGS." -ForegroundColor Yellow
}
