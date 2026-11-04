import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4200';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[formControlName="email"]');
  await page.type('input[formControlName="email"]', 'hr@example.com');
  await page.type('input[formControlName="password"]', 'Welcome@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.includes('/dashboard'));
  console.log('✓ Logged in to dashboard!');

  // Switch to Arabic language to match user view
  await page.evaluate(() => {
    // Find language button or trigger translation
    const buttons = Array.from(document.querySelectorAll('button'));
    const langBtn = buttons.find(b => b.innerText.includes('العربية') || b.innerText.includes('English'));
    if (langBtn && langBtn.innerText.includes('العربية')) {
      langBtn.click();
    }
  });
  await sleep(1000);

  // 1. Direct navigation test
  await page.goto(`${BASE_URL}/payroll/salary-structures`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  console.log('Direct goto /payroll/salary-structures -> Current URL:', page.url());

  await page.goto(`${BASE_URL}/payroll/payslips`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  console.log('Direct goto /payroll/payslips -> Current URL:', page.url());

  await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  console.log('Direct goto /attendance -> Current URL:', page.url());

  // 2. Click in sidebar using real click
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await sleep(1500);

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.sidebar-nav a')).map(a => ({
      href: a.getAttribute('href'),
      text: a.innerText.trim(),
      outerHTML: a.outerHTML
    }));
  });
  console.log('Sidebar links found:', JSON.stringify(links, null, 2));

  // Click using page.evaluate dispatchEvent or click
  console.log('Attempting click on Salary Structures...');
  const clicked = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.sidebar-nav a')).find(a => 
      a.getAttribute('href') === '/payroll/salary-structures' || a.innerText.includes('Salary') || a.innerText.includes('هياكل')
    );
    if (el) {
      el.click();
      return true;
    }
    return false;
  });
  console.log('Clicked element?', clicked);
  await sleep(2500);
  console.log('URL after sidebar click:', page.url());

  // Click payslips in sidebar
  console.log('Clicking Payslips from sidebar...');
  await page.click('a[href="/payroll/payslips"]');
  await sleep(2000);
  console.log('URL after sidebar click Payslips:', page.url());

  // Click attendance in sidebar
  console.log('Clicking Attendance from sidebar...');
  await page.click('a[href="/attendance"]');
  await sleep(2000);
  console.log('URL after sidebar click Attendance:', page.url());

  // Screenshot attendance
  await page.screenshot({ path: 'C:\\Users\\عبداللهانورابراهيماب\\.gemini\\antigravity\\brain\\d0c1ab7e-9bba-4a81-8af1-c3e692868818\\verified_attendance.png' });
  console.log('Attendance screen captured.');

  await browser.close();
  console.log('Done!');
}

test().catch(console.error);
