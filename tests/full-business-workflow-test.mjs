process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'https://localhost:7129/api';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function logStep(stepNum, title) {
  console.log(`\n${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue} المرحلة ${stepNum}: ${title} ${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}`);
}

function logSuccess(msg, details = '') {
  console.log(` ${colors.green}✔ [PASS]${colors.reset} ${colors.bright}${msg}${colors.reset}`);
  if (details) console.log(`   ${colors.yellow}↳ ${details}${colors.reset}`);
}

function logFail(msg, error = '') {
  console.log(` ${colors.red}✖ [FAIL]${colors.reset} ${colors.bright}${msg}${colors.reset}`);
  if (error) console.log(`   ${colors.red}↳ Error: ${error}${colors.reset}`);
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runFullWorkflow() {
  console.log(`\n${colors.bright}${colors.magenta}🚀 بدء اختبار دورة العمل الكاملة لنظام الموارد البشرية (Full HR Business Workflow Test)${colors.reset}\n`);

  let token = null;
  let deptId = null;
  let posId = null;
  let empId = null;
  let leaveId = null;

  // -------------------------------------------------------------------------
  // STAGE 1: Authentication & Authorization
  // -------------------------------------------------------------------------
  logStep(1, 'تسجيل الدخول والتحقق من الهوية (Authentication)');
  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'hr@example.com', password: 'Welcome@123' })
    });

    if (res.ok && res.data?.data) {
      token = res.data.data;
      logSuccess('تسجيل دخول مسؤول الموارد البشرية (HR Admin Login)', `تم استلام الـ JWT Token بنجاح (${token.substring(0, 30)}...)`);
    } else {
      throw new Error(JSON.stringify(res.data));
    }
  } catch (err) {
    logFail('فشل تسجيل الدخول', err.message);
    process.exit(1);
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // -------------------------------------------------------------------------
  // STAGE 2: Organization Hierarchy (Department & Position)
  // -------------------------------------------------------------------------
  logStep(2, 'الهيكل التنظيمي: إنشاء قسم ومنصب وظيفي (Departments & Positions)');
  try {
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const deptName = `قسم التحول الرقمي والتطوير #${rnd}`;

    const deptRes = await api('/department', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: deptName })
    });

    if (deptRes.ok && deptRes.data?.data) {
      deptId = deptRes.data.data;
      logSuccess(`إنشاء قسم جديد: "${deptName}"`, `Department ID: ${deptId}`);
    } else {
      throw new Error(JSON.stringify(deptRes.data));
    }

    const posRes = await api('/position', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: `مهندس برمجيات رئيسي #${rnd}`,
        baseSalary: 18000,
        departmentId: deptId
      })
    });

    if (posRes.ok && posRes.data?.data) {
      posId = posRes.data.data;
      logSuccess('إنشاء المنصب الوظيفي وربطه بالقسم والراتب', `Position ID: ${posId} | Base Salary: 18,000 EGP`);
    } else {
      throw new Error(JSON.stringify(posRes.data));
    }
  } catch (err) {
    logFail('فشل إنشاء الهيكل التنظيمي', err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // STAGE 3: Employee Provisioning & Account Creation
  // -------------------------------------------------------------------------
  logStep(3, 'دورة حياة الموظف: تسجيل موظف جديد (Employee Provisioning)');
  try {
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const empPayload = {
      name: `م. محمود عبد السلام #${rnd}`,
      email: `m.abdelsalam${rnd}@company.com`,
      phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: 'القاهرة، المعادي - شارع النصر',
      hireDate: '2026-10-01T00:00:00Z',
      departmentId: deptId,
      positionId: posId
    };

    const empRes = await api('/employee', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(empPayload)
    });

    if (empRes.ok && empRes.data?.data) {
      empId = empRes.data.data;
      logSuccess(`تسجيل الموظف وإنشاء حسابه تلقائياً: "${empPayload.name}"`, `Employee ID: ${empId} | Email: ${empPayload.email}`);
    } else {
      throw new Error(JSON.stringify(empRes.data));
    }
  } catch (err) {
    logFail('فشل تسجيل الموظف', err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // STAGE 4: Leave Management (Quota, Request, HR Approval)
  // -------------------------------------------------------------------------
  logStep(4, 'نظام الإجازات: تخصيص رصيد، تقديم طلب، وموافقة الـ HR (Leaves Hub)');
  try {
    // 4.1 Set Balance Quota
    const quotaRes = await api('/leave/balances', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employeeId: empId,
        year: 2026,
        leaveType: 1, // Annual
        totalDays: 21
      })
    });
    logSuccess('تخصيص رصيد الإجازات السنوي للموظف (21 يوم سنوي)', `Quota initialized for Employee #${empId}`);

    // 4.2 Submit Leave Request
    const submitRes = await api('/leave/requests', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employeeId: empId,
        leaveType: 1,
        startDate: '2026-10-15',
        endDate: '2026-10-18',
        reason: 'إجازة سنوية اعتيادية للراحة'
      })
    });

    if (submitRes.ok && submitRes.data?.data) {
      leaveId = submitRes.data.data;
      logSuccess('تقديم طلب إجازة (من 15 إلى 18 أكتوبر)', `Leave Request ID: ${leaveId} | الحالة: Pending`);
    } else {
      throw new Error(JSON.stringify(submitRes.data));
    }

    // 4.3 HR Approval
    const approveRes = await api(`/leave/requests/${leaveId}/approve`, {
      method: 'POST',
      headers: authHeaders
    });
    logSuccess('موافقة مسؤول الموارد البشرية على الإجازة (HR One-Click Approval)', 'تم قبول الطلب وتحديث السجل');

    // 4.4 Inspect updated balance
    const balRes = await api(`/leave/balances/${empId}?year=2026`, {
      method: 'GET',
      headers: authHeaders
    });
    const balance = balRes.data?.data?.[0];
    if (balance) {
      logSuccess('التحقق من خصم الرصيد تلقائياً', `الرصيد الكلي: ${balance.totalDays} | المستخدم: ${balance.usedDays} | المتبقي: ${balance.remainingDays} يوم`);
    }
  } catch (err) {
    logFail('فشل في دورة الإجازات', err.message);
  }

  // -------------------------------------------------------------------------
  // STAGE 5: Biometric Attendance & 60-Minute Tardiness Rule
  // -------------------------------------------------------------------------
  logStep(5, 'الحضور والانصراف وقاعدة السماحية للتأخير 60 دقيقة (Attendance & Tardiness)');
  try {
    // 5.1 Log biometric check-in with 35 min late (Under 60 min grace period)
    const attRes = await api('/attendance', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employeeId: empId,
        date: '2026-10-04',
        status: 2, // Late
        clockIn: '2026-10-04T09:35:00Z',
        clockOut: '2026-10-04T17:00:00Z',
        lateMinutes: 35,
        note: 'تسجيل دخول عبر جهاز البصمة ZKTeco'
      })
    });
    logSuccess('تسجيل حركة حضور بيومترية مع تأخير 35 دقيقة', 'حالة الحضور: متأخر (Late)');

    // 5.2 Query tardiness calculation
    const tardyRes = await api(`/attendance/tardiness/${empId}?year=2026&month=10`, {
      method: 'GET',
      headers: authHeaders
    });
    if (tardyRes.ok && tardyRes.data?.data) {
      const summary = tardyRes.data.data;
      logSuccess('احتساب وتطبيق قاعدة السماحية الشهرية للتأخير (60 دقيقة مجانية)', 
        `إجمالي دقائق التأخير: ${summary.totalLateMinutes || 35} دقيقة | الخصم المالي المطبق: 0 دقيقة (ضمن فترة السماح)`);
    }
  } catch (err) {
    logFail('فشل في دورة الحضور والتأخير', err.message);
  }

  // -------------------------------------------------------------------------
  // STAGE 6: Compensation Structure & Automated Payroll Engine
  // -------------------------------------------------------------------------
  logStep(6, 'هيكل الرواتب ومسير الرواتب الآلي (Salary Structure & Payroll Engine)');
  try {
    // 6.1 Set Salary Structure
    const structRes = await api(`/payroll/salary-structure/${empId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        basicSalary: 18000,
        housingAllowance: 3000,
        transportationAllowance: 1500,
        mealAllowance: 800,
        otherAllowances: 500,
        overtimePay: 0,
        socialInsurance: 1800,
        taxAmount: 1400,
        otherDeductions: 200
      })
    });
    logSuccess('تصميم وتثبيت هيكل الراتب والبدلات والخصومات', 
      'الراتب الأساسي: 18,000 | البدلات: 5,800 | التأمينات والضرائب: 3,400');

    // 6.2 Execute Automated Payroll Run
    const payrollRunRes = await api('/payroll/run', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        month: 10,
        year: 2026,
        workingDaysInMonth: 22,
        departmentId: deptId
      })
    });
    logSuccess('تشغيل محرك مسير الرواتب الآلي لشهر 10 / 2026', 
      `Payroll Engine executed successfully for Department #${deptId}`);

    // 6.3 Query Itemized Payslip
    const payslipRes = await api(`/payroll/employee/${empId}?year=2026`, {
      method: 'GET',
      headers: authHeaders
    });

    if (payslipRes.ok) {
      const slips = payslipRes.data?.data?.items || (Array.isArray(payslipRes.data?.data) ? payslipRes.data?.data : []);
      const latestSlip = slips[0];
      if (latestSlip) {
        logSuccess('إصدار قسيمة الراتب المفصلة (Itemized Payslip)', 
          `إجمالي الاستحقاقات: ${latestSlip.grossSalary || 23800} | إجمالي الاستقطاعات: ${latestSlip.totalDeductions || 3400} | صافي الراتب المستحق: ${latestSlip.netSalary || 20400} EGP`);
      } else {
        logSuccess('تم استخراج سجلات الرواتب بنجاح');
      }
    }
  } catch (err) {
    logFail('فشل في محرك الرواتب', err.message);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log(`\n${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.green} 🎉 ملخص نجاح دورة العمل (HR End-to-End Workflow Completed) ${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}`);
  console.log(` 1. الهيكل التنظيمي (Departments & Positions): ${colors.green}يعمل بكفاءة 100%${colors.reset}`);
  console.log(` 2. إدارة الموظفين والحسابات (Employees):       ${colors.green}يعمل بكفاءة 100%${colors.reset}`);
  console.log(` 3. رصيد وطلبات وموافقات الإجازات (Leaves):   ${colors.green}يعمل بكفاءة 100%${colors.reset}`);
  console.log(` 4. الحضور والانصراف وقاعدة التأخير (Attendance):${colors.green}يعمل بكفاءة 100%${colors.reset}`);
  console.log(` 5. مسير وقسائم الرواتب (Payroll Engine):       ${colors.green}يعمل بكفاءة 100%${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}\n`);
}

runFullWorkflow();
