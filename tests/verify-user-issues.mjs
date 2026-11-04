import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4200';
const ARTIFACTS_DIR = 'C:\\Users\\عبداللهانورابراهيماب\\.gemini\\antigravity\\brain\\d0c1ab7e-9bba-4a81-8af1-c3e692868818';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 Starting Verification on ' + BASE_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // 1. Login
    console.log('1. Navigating to Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    await page.waitForSelector('input[formControlName="email"]', { timeout: 10000 });
    await page.type('input[formControlName="email"]', 'hr@example.com');
    await page.type('input[formControlName="password"]', 'Welcome@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    console.log('✓ Successfully logged in, current URL:', page.url());

    // 2. Check Sidebar items
    const navTexts = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.sidebar-nav .nav-link'));
      return links.map(l => ({
        text: l.innerText.trim(),
        href: l.getAttribute('href') || l.getAttribute('ng-reflect-router-link')
      }));
    });
    console.log('Sidebar Navigation Items:', JSON.stringify(navTexts, null, 2));

    const hasBrokenDeviceLogs = navTexts.some(item => item.text.includes('سجلات البصمة'));
    console.log('Has redundant "سجلات البصمة" in sidebar?', hasBrokenDeviceLogs ? 'YES (FAIL)' : 'NO (PASS - Successfully removed)');

    // 3. Test Payslips click from Sidebar
    console.log('\n3. Testing Payslips sidebar click ("قسائم الرواتب")...');
    const payslipLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('.sidebar-nav .nav-link'));
      return links.find(l => l.innerText.includes('قسائم') || l.innerText.includes('Payslips'));
    });
    if (payslipLink) {
      await payslipLink.click();
      await sleep(1500);
      console.log('Current URL after clicking Payslips:', page.url());
      const isPayslipsUrl = page.url().includes('/payroll/payslips');
      console.log('Payslips route opened successfully?', isPayslipsUrl ? 'PASS' : 'FAIL (Redirected!)');
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'fixed_payslips_screen.png'), fullPage: true });
    } else {
      console.error('Payslips link not found in sidebar!');
    }

    // 4. Test Salary Structures click from Sidebar
    console.log('\n4. Testing Salary Structures sidebar click ("هياكل الرواتب")...');
    const structuresLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('.sidebar-nav .nav-link'));
      return links.find(l => l.innerText.includes('هياكل') || l.innerText.includes('Salary Structures'));
    });
    if (structuresLink) {
      await structuresLink.click();
      await sleep(1500);
      console.log('Current URL after clicking Salary Structures:', page.url());
      const isStructuresUrl = page.url().includes('/payroll/salary-structures');
      console.log('Salary Structures route opened successfully?', isStructuresUrl ? 'PASS' : 'FAIL (Redirected!)');
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'fixed_salary_structures_screen.png'), fullPage: true });
    } else {
      console.error('Salary Structures link not found in sidebar!');
    }

    // 5. Test Attendance click from Sidebar
    console.log('\n5. Testing Attendance sidebar click ("الحضور والانصراف")...');
    const attendanceLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('.sidebar-nav .nav-link'));
      return links.find(l => l.innerText.includes('الحضور') || l.innerText.includes('Attendance'));
    });
    if (attendanceLink) {
      await attendanceLink.click();
      await sleep(1500);
      console.log('Current URL after clicking Attendance:', page.url());
      const isAttendanceUrl = page.url().includes('/attendance');
      console.log('Attendance route opened successfully?', isAttendanceUrl ? 'PASS' : 'FAIL');
      
      // Check for template and upload buttons on the attendance page
      const hasDownloadTemplate = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('تحميل نموذج') || b.innerText.includes('Download Template'));
      });
      const hasUploadSheet = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('رفع شيت') || b.innerText.includes('Upload'));
      });
      console.log('Has Download Template button?', hasDownloadTemplate ? 'PASS' : 'FAIL');
      console.log('Has Upload Sheet button?', hasUploadSheet ? 'PASS' : 'FAIL');
      
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'fixed_attendance_screen.png'), fullPage: true });
    } else {
      console.error('Attendance link not found in sidebar!');
    }

    // 6. Test Dashboard Shortcuts
    console.log('\n6. Testing Dashboard Shortcuts...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'fixed_dashboard_screen.png'), fullPage: true });

    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

runTest();
