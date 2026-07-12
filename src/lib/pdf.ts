const CHROMIUM_VERSION = '149.0.0';
const CHROMIUM_PACK_URL = `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.x64.tar`;

let cachedBrowser: any = null;

async function launchBrowser() {
  if (cachedBrowser && cachedBrowser.connected) return cachedBrowser;
  if (cachedBrowser && cachedBrowser.connected === false) cachedBrowser = null;

  const isVercel = process.env.VERCEL === '1';

  if (isVercel) {
    const chromium = await import('@sparticuz/chromium-min').then((m: any) => m.default);
    const puppeteer = await import('puppeteer-core').then((m: any) => m.default);
    cachedBrowser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: 'shell',
    });
  } else {
    const puppeteer = await import('puppeteer').then((m: any) => m.default);
    cachedBrowser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return cachedBrowser;
}

export async function generatePdfBuffer(html: string): Promise<Uint8Array> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const pdf = await page.pdf({ format: 'A4', margin: { top: '0mm', bottom: '8mm' }, printBackground: true });
  await page.close();
  return pdf;
}

export async function generatePdfBufferCustom(
  html: string,
  options?: { margin?: { top?: string; bottom?: string; left?: string; right?: string } }
): Promise<Uint8Array> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const pdf = await page.pdf({
    format: 'A4',
    margin: options?.margin || { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
    printBackground: true,
  });
  await page.close();
  return pdf;
}
