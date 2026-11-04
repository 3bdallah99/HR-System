import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5082';
const ARTIFACTS_DIR = 'C:\\Users\\عبداللهانورابراهيماب\\.gemini\\antigravity\\brain\\18f8d34a-7f88-41ee-bcc1-9d6081acb0f7';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[formControlName="email"]');
    await page.type('input[formControlName="email"]', 'hr@example.com');
    await page.type('input[formControlName="password"]', 'Welcome@123');
    await page.click('button[type="submit"]');

    console.log('Waiting for dashboard navigation...');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });
    await sleep(1500);

    // Switch language to Arabic if available
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('عربي'));
      if (btn) btn.click();
    });
    await sleep(1000);

    // 1. Dashboard screenshot
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_1_dashboard.png'), fullPage: false });
    console.log('1. Dashboard captured.');

    // 2. Employees page
    await page.goto(`${BASE_URL}/employees`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_2_employees.png'), fullPage: false });
    console.log('2. Employees captured.');

    // 3. Attendance page
    await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle2' });
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_3_attendance.png'), fullPage: false });
    console.log('3. Attendance captured.');

    // 4. Open upload modal on attendance page
    const uploadBtn = await page.$('button.btn-primary');
    if (uploadBtn) {
      await uploadBtn.click();
      await sleep(1000);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_4_upload_modal.png'), fullPage: false });
      console.log('4. Upload modal captured.');
    }

    console.log('All screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
