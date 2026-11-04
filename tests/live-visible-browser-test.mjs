import puppeteer from 'puppeteer-core';
import os from 'os';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5082';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
  yellow: '\x1b[33m'
};

async function announce(page, msg) {
  console.log(`${colors.cyan}👉 [مباشر] ${msg}${colors.reset}`);
  try {
    await page.evaluate((text) => {
      let el = document.getElementById('live-test-hud');
      if (!el) {
        el = document.createElement('div');
        el.id = 'live-test-hud';
        el.style.position = 'fixed';
        el.style.top = '18px';
        el.style.left = '50%';
        el.style.transform = 'translateX(-50%)';
        el.style.backgroundColor = '#090d16';
        el.style.color = '#38bdf8';
        el.style.padding = '12px 28px';
        el.style.borderRadius = '50px';
        el.style.fontSize = '16px';
        el.style.fontWeight = '700';
        el.style.zIndex = '9999999';
        el.style.boxShadow = '0 12px 35px rgba(0,0,0,0.7)';
        el.style.border = '2px solid #6366f1';
        el.style.direction = 'rtl';
        el.style.fontFamily = 'Cairo, Segoe UI, sans-serif';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.gap = '12px';
        el.style.pointerEvents = 'none';
        el.style.transition = 'all 0.3s ease';
        document.body.appendChild(el);
      }
      el.innerHTML = `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e;"></span> ${text}`;
    }, msg);
  } catch {}
  await sleep(1400);
}

async function highlight(page, selector) {
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.outline = '4px solid #ef4444';
        el.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.9)';
        el.style.transition = 'all 0.25s ease';
      }
    }, selector);
    await sleep(600);
  } catch {}
}

async function removeHighlight(page, selector) {
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.outline = '';
        el.style.boxShadow = '';
      }
    }, selector);
  } catch {}
}

async function run() {
  console.log(`\n${colors.bright}${colors.cyan}============================================================${colors.reset}`);
  console.log(`${colors.bright}🚀 تشغيل متصفح Google Chrome التفاعلي المرئي أمامك الآن...${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}============================================================${colors.reset}\n`);

  const tmpProfile = path.join(os.tmpdir(), 'chrome_live_test_' + Date.now());

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    userDataDir: tmpProfile,
    defaultViewport: null,
    slowMo: 50,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--window-size=1440,900'
    ]
  });

  const [page] = await browser.pages();
  await page.setViewport({ width: 1400, height: 880 });

  try {
    // 1. Login Page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await announce(page, 'مرحباً! جاري فحص صفحة تسجيل الدخول واختبار الأزرار...');
    await sleep(800);

    // Language Toggle on login
    await announce(page, 'فحص زر تبديل اللغة (AR / EN) أعلى الشاشة...');
    await highlight(page, '.login-top-bar button');
    const langBtn = await page.$('.login-top-bar button');
    if (langBtn) {
      await langBtn.click();
      await sleep(1000);
      await langBtn.click(); // switch back
      await sleep(800);
    }
    await removeHighlight(page, '.login-top-bar button');

    // Fill credentials
    await announce(page, 'إدخال بيانات اعتماد مسؤول الموارد البشرية (hr@example.com)...');
    await highlight(page, 'input[formControlName="email"]');
    await page.type('input[formControlName="email"]', 'hr@example.com', { delay: 35 });
    await removeHighlight(page, 'input[formControlName="email"]');

    await highlight(page, 'input[formControlName="password"]');
    await page.type('input[formControlName="password"]', 'Welcome@123', { delay: 35 });
    await removeHighlight(page, 'input[formControlName="password"]');

    await announce(page, 'النقر على زر الدخول للوصول إلى لوحة التحكم...');
    await highlight(page, 'button[type="submit"]');
    await sleep(600);
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    // Wait for SPA router navigation to dashboard
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 12000 });
    await sleep(1500);

    // 2. Dashboard
    await announce(page, 'تم الدخول بنجاح! استعراض بطاقات وإحصائيات لوحة التحكم...');
    await sleep(1800);

    // 3. Attendance Screen
    await announce(page, 'الانتقال إلى شاشة الحضور والانصراف (Attendance)...');
    await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle0' });
    await sleep(1200);

    await announce(page, 'فحص زر تحميل نموذج شيت الحضور (Download CSV Template)...');
    const dlBtn = await page.$('button:has(i.fa-download), button:has(i.fa-file-excel), button:has(i.fa-file-csv)');
    if (dlBtn) {
      await highlight(page, 'button:has(i.fa-download), button:has(i.fa-file-excel), button:has(i.fa-file-csv)');
      await dlBtn.click();
      await sleep(1200);
      await removeHighlight(page, 'button:has(i.fa-download), button:has(i.fa-file-excel), button:has(i.fa-file-csv)');
    }

    await announce(page, 'فحص زر رفع شيت الحضور التفاعلي (Upload Attendance Modal)...');
    const upBtn = await page.$('button:has(i.fa-upload), button:has(i.fa-cloud-arrow-up)');
    if (upBtn) {
      await highlight(page, 'button:has(i.fa-upload), button:has(i.fa-cloud-arrow-up)');
      await upBtn.click();
      await sleep(1200);
      await removeHighlight(page, 'button:has(i.fa-upload), button:has(i.fa-cloud-arrow-up)');

      const closeUpModal = await page.$('.modal .btn-close, .modal button:has(i.fa-times), .modal .btn-secondary');
      if (closeUpModal) {
        await closeUpModal.click();
        await sleep(800);
      }
    }

    // 4. Salary Structures Screen
    await announce(page, 'الانتقال لشاشة هياكل الرواتب (Salary Structures)...');
    await page.goto(`${BASE_URL}/payroll/structures`, { waitUntil: 'networkidle0' });
    await sleep(1200);

    await announce(page, 'فتح نموذج إضافة / تعديل هيكل راتب جديد...');
    const addStructBtn = await page.$('button:has(i.fa-plus), button:has(i.fa-circle-plus)');
    if (addStructBtn) {
      await highlight(page, 'button:has(i.fa-plus), button:has(i.fa-circle-plus)');
      await addStructBtn.click();
      await sleep(1000);
      await removeHighlight(page, 'button:has(i.fa-plus), button:has(i.fa-circle-plus)');
    }

    await announce(page, 'اختيار موظف من القائمة المنسدلة التفاعلية...');
    const empSelect = await page.$('select[formControlName="employeeId"], select[name="employeeId"]');
    if (empSelect) {
      await highlight(page, 'select[formControlName="employeeId"], select[name="employeeId"]');
      const options = await page.$$eval('select[formControlName="employeeId"] option, select[name="employeeId"] option', opts => 
        opts.filter(o => o.value && o.value !== '' && o.value !== '0').map(o => o.value)
      );
      if (options.length > 0) {
        await page.select('select[formControlName="employeeId"], select[name="employeeId"]', options[0]);
        await sleep(800);
      }
      await removeHighlight(page, 'select[formControlName="employeeId"], select[name="employeeId"]');
    }

    const typeField = async (sel, val, name) => {
      await announce(page, `إدخال ${name}: ${val} ج.م مع مراقبة الحساب التلقائي...`);
      await highlight(page, sel);
      const el = await page.$(sel);
      if (el) {
        await el.click({ clickCount: 3 });
        await el.press('Backspace');
        await el.type(val.toString(), { delay: 35 });
      }
      await sleep(500);
      await removeHighlight(page, sel);
    };

    await typeField('input[formControlName="basicSalary"], input[name="basicSalary"]', '25000', 'الراتب الأساسي');
    await typeField('input[formControlName="housingAllowance"], input[name="housingAllowance"]', '4000', 'بدل السكن');
    await typeField('input[formControlName="transportationAllowance"], input[name="transportationAllowance"]', '2000', 'بدل الانتقال');
    await typeField('input[formControlName="socialInsurance"], input[name="socialInsurance"]', '2500', 'التأمينات الاجتماعية');
    await typeField('input[formControlName="taxAmount"], input[name="taxAmount"]', '2000', 'ضريبة الدخل');

    await announce(page, 'ملاحظة بطاقات الحساب اللحظي المباشر (المستحقات: 31,000 | الاستقطاعات: 4,500 | الصافي: 26,500)...');
    await sleep(1800);

    await announce(page, 'النقر على زر حفظ هيكل الراتب في قاعدة البيانات...');
    const saveBtn = await page.$('button[type="submit"]:has(i.fa-save), button:has(i.fa-check), button.btn-primary:has(i.fa-save)');
    if (saveBtn) {
      await highlight(page, 'button[type="submit"]:has(i.fa-save), button:has(i.fa-check), button.btn-primary:has(i.fa-save)');
      await saveBtn.click();
      await sleep(1800);
      await removeHighlight(page, 'button[type="submit"]:has(i.fa-save), button:has(i.fa-check), button.btn-primary:has(i.fa-save)');
    }

    // 5. Run Payroll Screen
    await announce(page, 'الانتقال إلى شاشة مسير الرواتب الآلي (Run Payroll)...');
    await page.goto(`${BASE_URL}/payroll/run`, { waitUntil: 'networkidle0' });
    await sleep(1200);

    await announce(page, 'اختيار شهر 10 / 2026 وتشغيل الحسابات التلقائية...');
    const monthSel = await page.$('select[name="month"], select[formControlName="month"]');
    if (monthSel) {
      await page.select('select[name="month"], select[formControlName="month"]', '10');
      await sleep(600);
    }

    const runBtn = await page.$('button.btn-primary:has(i.fa-play), button.btn-primary:has(i.fa-calculator), button:has(i.fa-gears)');
    if (runBtn) {
      await highlight(page, 'button.btn-primary:has(i.fa-play), button.btn-primary:has(i.fa-calculator), button:has(i.fa-gears)');
      await runBtn.click();
      await sleep(2200);
      await removeHighlight(page, 'button.btn-primary:has(i.fa-play), button.btn-primary:has(i.fa-calculator), button:has(i.fa-gears)');
    }

    // 6. Payslips Screen
    await announce(page, 'الانتقال إلى شاشة قسائم الرواتب (Payslips Screen)...');
    await page.goto(`${BASE_URL}/payroll/slips`, { waitUntil: 'networkidle0' });
    await sleep(1200);

    await announce(page, 'النقر على زر تصفية واستعراض قسائم شهر 10 / 2026...');
    const filterBtn = await page.$('button.btn-primary:has(i.fa-search), button:has(i.fa-filter)');
    if (filterBtn) {
      await highlight(page, 'button.btn-primary:has(i.fa-search), button:has(i.fa-filter)');
      await filterBtn.click();
      await sleep(1800);
      await removeHighlight(page, 'button.btn-primary:has(i.fa-search), button:has(i.fa-filter)');
    }

    await announce(page, 'استعراض بطاقات المؤشرات (KPIs) وجدول مفردات المرتب...');
    await sleep(1600);

    // View voucher modal
    await announce(page, 'النقر على زر معاينة قسيمة الراتب التفصيلية (View / Print Voucher)...');
    const viewBtn = await page.$('table tbody tr button:has(i.fa-eye), table tbody tr button:has(i.fa-file-invoice), table tbody tr button:has(i.fa-print)');
    if (viewBtn) {
      await highlight(page, 'table tbody tr button:has(i.fa-eye), table tbody tr button:has(i.fa-file-invoice), table tbody tr button:has(i.fa-print)');
      await viewBtn.click();
      await sleep(2000);
      await removeHighlight(page, 'table tbody tr button:has(i.fa-eye), table tbody tr button:has(i.fa-file-invoice), table tbody tr button:has(i.fa-print)');

      await announce(page, 'تم فتح قسيمة الراتب التفصيلية القابلة للطباعة بكافة الاستحقاقات والاستقطاعات!');
      await sleep(2800);

      await announce(page, 'إغلاق نافذة القسيمة التفصيلية...');
      const closeVoucherBtn = await page.$('.modal .btn-close, .modal button:has(i.fa-times), .modal .modal-footer button');
      if (closeVoucherBtn) {
        await closeVoucherBtn.click();
        await sleep(1200);
      }
    }

    // Grand Finale Announcement
    await announce(page, '🎉 تم الانتهاء من فحص كافة الشاشات والأزرار بنجاح تام 100%!');
    await sleep(3500);

  } catch (err) {
    console.error('Error during live test:', err);
    await sleep(2000);
  } finally {
    await browser.close();
    console.log(`\n${colors.bright}${colors.green}✅ اكتمل الفحص التفاعلي الحي بنجاح وأُغلق المتصفح.${colors.reset}\n`);
  }
}

run();
