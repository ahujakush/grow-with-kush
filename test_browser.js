const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await page.goto('file:///Users/kushahuja/Downloads/kush_growth_os_supabase/index.html', { waitUntil: 'networkidle2' });
  await browser.close();
})();
