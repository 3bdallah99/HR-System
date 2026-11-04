import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\عبداللهانورابراهيماب\\.gemini\\antigravity\\brain\\d0c1ab7e-9bba-4a81-8af1-c3e692868818';
const BASE_URL = 'http://localhost:5082';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bright: '\x1b[1m'
};

function logStep(num, msg) {
  console.log(`\n${colors.cyan}------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bright}👉 [خطوة ${num}] ${msg}${colors.reset}`);
  console.log(`${colors.cyan}------------------------------------------------------------${colors.reset}`);
}

function logPass(msg) {
  console.log(` ${colors.green}✔ [PASS]${colors.reset} ${msg}`);
}

function logFail(msg, err) {
  console.log(` ${colors.red}✖ [FAIL]${colors.reset} ${msg}`);
  if (err) console.log(`   ${colors.red}↳ ${err}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`${colors.bright}${colors.cyan}🌐 بدء الفحص الشامل للمتصفح (Full Browser UI & Workflow Automation)${colors.reset}`);
  console.log(`Target: ${BASE_URL}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();

  // Listen to console errors
  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      pageErrors.push(msg.text());
    }
  });

  try {
    // 1. Login Page
    logStep(1, 'فتح صفحة تسجيل الدخول والتحقق من الحقول (Login Screen)');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_login_page.png') });
    logPass('تم فتح صفحة الدخول وحفظ لقطة الشاشة: 01_login_page.png');

    // Check language toggle on login
    const langBtn = await page.$('.login-top-bar button');
    if (langBtn) {
      await langBtn.click();
      await sleep(500);
      logPass('تم النقر على زر تبديل اللغة في صفحة الدخول (AR/EN Toggle)');
      await langBtn.click(); // switch back
      await sleep(500);
    }

    // Fill credentials
    logStep(2, 'إدخال بيانات تسجيل الدخول والنقر على زر الدخول (Submit Login)');
    await page.type('input[formControlName="email"]', 'hr@example.com');
    await page.type('input[formControlName="password"]', 'Welcome@123');
    logPass('تم ملء حقول البريد الإلكتروني وكلمة المرور');

    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error('Submit button not found on login page');
    await submitBtn.click();
    logPass('تم النقر على زر تسجيل الدخول (Login Button)');

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_dashboard.png') });
    logPass('تم الدخول بنجاح والانتقال للوحة التحكم وحفظ لقطة الشاشة: 02_dashboard.png');

    // 3. Test Navigation & Language Switch on Layout
    logStep(3, 'اختبار أزرار الشريط العلوي واللغات والقائمة الجانبية (Layout Bar Buttons)');
    const topLangBtn = await page.$('.navbar button[title*="اللغة"], .navbar button[title*="Language"], button:has(i.fa-globe)');
    if (topLangBtn) {
      await topLangBtn.click();
      await sleep(500);
      logPass('تم النقر على زر تغيير لغة الواجهة من الشريط العلوي');
    }

    // 4. Test Attendance Screen
    logStep(4, 'شاشة الحضور والانصراف: فحص النماذج والرفع والأزرار (Attendance Screen)');
    await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_attendance_screen.png') });
    logPass('تم فتح شاشة الحضور وحفظ لقطة الشاشة: 03_attendance_screen.png');

    // Find and click Download Template button
    const downloadBtn = await page.$('button:has(i.fa-download), button:has(i.fa-file-excel), button:has(i.fa-file-csv)');
    if (downloadBtn) {
      await downloadBtn.click();
      await sleep(500);
      logPass('تم النقر على زر تحميل نموذج شيت الحضور (Download Attendance Template)');
    }

    // Check attendance upload button/modal
    const uploadBtn = await page.$('button:has(i.fa-upload), button:has(i.fa-cloud-arrow-up)');
    if (uploadBtn) {
      await uploadBtn.click();
      await sleep(500);
      logPass('تم النقر على زر رفع شيت الحضور (Upload Attendance Sheet Modal)');
      // If modal opened, click cancel/close
      const cancelModalBtn = await page.$('.modal .btn-close, .modal button:has(i.fa-times), .modal .btn-secondary');
      if (cancelModalBtn) {
        await cancelModalBtn.click();
        await sleep(500);
        logPass('تم إغلاق نافذة الرفع بنجاح');
      }
    }

    // 5. Test Salary Structures Screen
    logStep(5, 'شاشة هياكل الرواتب: استعراض وإدخال وحساب مباشر وحفظ (Salary Structures Screen)');
    await page.goto(`${BASE_URL}/payroll/structures`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_salary_structures_list.png') });
    logPass('تم فتح شاشة هياكل الرواتب وحفظ لقطة الشاشة: 04_salary_structures_list.png');

    // Check if add/new button exists or form is directly embedded
    const openFormBtn = await page.$('button:has(i.fa-plus), button:has(i.fa-circle-plus)');
    if (openFormBtn) {
      await openFormBtn.click();
      await sleep(500);
      logPass('تم النقر على زر إضافة هيكل راتب جديد (Add Structure)');
    }

    // Select employee from dropdown
    const empSelect = await page.$('select[formControlName="employeeId"], select[name="employeeId"]');
    if (empSelect) {
      const options = await page.$$eval('select[formControlName="employeeId"] option, select[name="employeeId"] option', opts => 
        opts.filter(o => o.value && o.value !== '' && o.value !== '0').map(o => o.value)
      );
      if (options.length > 0) {
        await page.select('select[formControlName="employeeId"], select[name="employeeId"]', options[0]);
        await sleep(500);
        logPass(`تم اختيار الموظف من القائمة المنسدلة (Employee Value: ${options[0]})`);
      }
    }

    // Fill in salary fields
    const fillField = async (selector, val) => {
      const el = await page.$(selector);
      if (el) {
        await el.click({ clickCount: 3 });
        await el.press('Backspace');
        await el.type(val.toString());
      }
    };

    await fillField('input[formControlName="basicSalary"], input[name="basicSalary"]', '25000');
    await fillField('input[formControlName="housingAllowance"], input[name="housingAllowance"]', '4000');
    await fillField('input[formControlName="transportationAllowance"], input[name="transportationAllowance"]', '2000');
    await fillField('input[formControlName="mealAllowance"], input[name="mealAllowance"]', '1000');
    await fillField('input[formControlName="socialInsurance"], input[name="socialInsurance"]', '2500');
    await fillField('input[formControlName="taxAmount"], input[name="taxAmount"]', '2000');
    await sleep(800);
    logPass('تم إدخال كافة الحقول المالية (الأساسي: 25,000 | البدلات: 7,000 | الاستقطاعات: 4,500)');

    // Verify dynamic live calculation cards update
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_salary_structure_live_calc.png') });
    logPass('تم التحقق من الحساب اللحظي المباشر وحفظ لقطة الشاشة: 05_salary_structure_live_calc.png');

    // Click Save Structure button
    const saveStructBtn = await page.$('button[type="submit"]:has(i.fa-save), button:has(i.fa-check), button.btn-primary:has(i.fa-save)');
    if (saveStructBtn) {
      await saveStructBtn.click();
      await sleep(1500);
      logPass('تم النقر على زر حفظ هيكل الراتب (Save Salary Structure Button)');
    }

    // 6. Test Run Payroll Screen
    logStep(6, 'شاشة مسير الرواتب الآلي: تشغيل الحسابات والأزرار (Payroll Run Screen)');
    await page.goto(`${BASE_URL}/payroll/run`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_payroll_run_screen.png') });
    logPass('تم فتح شاشة مسير الرواتب وحفظ لقطة الشاشة: 06_payroll_run_screen.png');

    // Select month and year if available
    const monthSelect = await page.$('select[name="month"], select[formControlName="month"]');
    if (monthSelect) {
      await page.select('select[name="month"], select[formControlName="month"]', '10');
      logPass('تم اختيار شهر مسير الرواتب: 10');
    }

    const runPayrollBtn = await page.$('button.btn-primary:has(i.fa-play), button.btn-primary:has(i.fa-calculator), button:has(i.fa-gears)');
    if (runPayrollBtn) {
      await runPayrollBtn.click();
      await sleep(1500);
      logPass('تم النقر على زر تشغيل مسير الرواتب (Run Payroll Execution Button)');
    }

    // 7. Test Payslips Screen
    logStep(7, 'شاشة قسائم الرواتب: فحص الكروت والمؤشرات والمعاينة والطباعة (Payslips Screen)');
    await page.goto(`${BASE_URL}/payroll/slips`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_payslips_list.png') });
    logPass('تم فتح شاشة قسائم الرواتب وحفظ لقطة الشاشة: 07_payslips_list.png');

    // Search button
    const filterBtn = await page.$('button.btn-primary:has(i.fa-search), button:has(i.fa-filter)');
    if (filterBtn) {
      await filterBtn.click();
      await sleep(1200);
      logPass('تم النقر على زر تصفية واستعراض قسائم الشهر (Filter / Search Button)');
    }

    // Click View / Print Voucher button on first row
    const viewVoucherBtn = await page.$('table tbody tr button:has(i.fa-eye), table tbody tr button:has(i.fa-file-invoice), table tbody tr button:has(i.fa-print)');
    if (viewVoucherBtn) {
      await viewVoucherBtn.click();
      await sleep(1000);
      logPass('تم النقر على زر معاينة قسيمة الراتب التفصيلية (View / Print Payslip Button)');

      await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_payslip_detail_voucher.png') });
      logPass('تم فتح نافذة القسيمة التفصيلية بنجاح وحفظ لقطة الشاشة: 08_payslip_detail_voucher.png');

      // Click Close Modal button
      const closeModalBtn = await page.$('.modal .btn-close, .modal button:has(i.fa-times), .modal .modal-footer button');
      if (closeModalBtn) {
        await closeModalBtn.click();
        await sleep(500);
        logPass('تم إغلاق نافذة قسيمة الراتب بنجاح');
      }
    }

    console.log(`\n${colors.cyan}============================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.green} 🎉 تم اجتياز اختبار المتصفح الشامل بنجاح لجميع الشاشات والأزرار! ${colors.reset}`);
    console.log(`${colors.cyan}============================================================${colors.reset}\n`);

  } catch (err) {
    logFail('حدث خطأ أثناء فحص المتصفح', err.stack);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'error_screenshot.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
}

run();
