import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4200';
const ARTIFACTS_DIR = 'C:\\Users\\عبداللهانورابراهيماب\\.gemini\\antigravity\\brain\\d0c1ab7e-9bba-4a81-8af1-c3e692868818';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureArabicScreens() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[formControlName="email"]');
  await page.type('input[formControlName="email"]', 'hr@example.com');
  await page.type('input[formControlName="password"]', 'Welcome@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.includes('/dashboard'));

  // Switch to Arabic
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.innerText.includes('عربي'));
    if (btn) btn.click();
  });
  await sleep(1000);

  // 1. Dashboard screenshot
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'final_arabic_dashboard.png') });
  console.log('1. Dashboard captured.');

  // 2. Attendance screenshot
  await page.click('a[href="/attendance"]');
  await sleep(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'final_arabic_attendance.png') });
  console.log('2. Attendance captured.');

  // 3. Salary Structures screenshot
  await page.click('a[href="/payroll/salary-structures"]');
  await sleep(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'final_arabic_salary_structures.png') });
  console.log('3. Salary Structures captured.');

  // 4. Payslips screenshot
  await page.click('a[href="/payroll/payslips"]');
  await sleep(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'final_arabic_payslips.png') });
  console.log('4. Payslips captured.');

  await browser.close();
  console.log('All Arabic screenshots captured successfully!');
}

captureArabicScreens().catch(console.error);
