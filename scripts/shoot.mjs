/*
 * Screenshot harness for the TRACK scroll experience.
 *
 * Usage:  node scripts/shoot.mjs <outDir> <pos,pos,...> [width] [height]
 *   e.g. node scripts/shoot.mjs shots/before 0,0.2,0.5,0.8,1
 *
 * Boots `next dev` as a child, scans likely ports for an HTTP 200, opens
 * system Chrome headless (WebGL via SwiftShader fallback), jumps the scroll
 * to each progress fraction, lets Lenis/GSAP settle, and saves a PNG.
 * Everything lives and dies inside one process on purpose.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
];

const outDir = process.argv[2] || 'shots/run';
// positions like "0,0.3,0.5v,0.9" — a trailing "v" means: approach by real
// wheel events so scroll VELOCITY is hot in the capture (streaks, CA, FOV).
const positions = (process.argv[3] || '0,0.25,0.5,0.75,1')
  .split(',')
  .map((s) => ({ f: parseFloat(s), sweep: s.endsWith('v') }))
  .filter((o) => Number.isFinite(o.f) && o.f >= 0 && o.f <= 1);
const W = Number(process.argv[4] || 1600);
const H = Number(process.argv[5] || 900);

const log = (...a) => console.log('[shoot]', ...a);

function findChrome() {
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  throw new Error('No Chrome/Chromium binary found');
}

async function waitHttpUp(timeoutMs = 120_000) {
  const ports = [4321, 3000, 3001, 3002, 3003, 3004, 3005, 64509];
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    for (const port of ports) {
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 1200);
        const res = await fetch(`http://127.0.0.1:${port}/`, { signal: ctl.signal });
        clearTimeout(timer);
        if (res.ok) return port;
      } catch { /* not up yet */ }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Dev server never answered on any port');
}

async function launch(port) {
  const exe = findChrome();
  const attempts = [
    // attempt 1: real GPU if headless allows it
    ['--use-angle=metal', '--enable-unsafe-swiftshader'],
    // attempt 2: guaranteed software path
    ['--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  ];
  for (const extra of attempts) {
    const browser = await puppeteer.launch({
      executablePath: exe,
      headless: true,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--hide-scrollbars',
        '--force-color-profile=srgb',
        '--disable-dev-shm-usage',
        ...extra,
      ],
      defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
    });
    const page = await browser.newPage();
    const ok = await page.evaluate(() => {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    }).catch(() => false);
    if (ok) {
      log('WebGL OK with flags:', extra.join(' '));
      return { browser, page };
    }
    await browser.close();
  }
  throw new Error('Could not get a WebGL context in headless Chrome');
}

async function settleScroll(page, frac) {
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * f, behavior: 'instant' });
  }, frac);
  // Lenis may adopt/override external jumps — verify and re-assert up to 3x.
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 350));
    const { want, got } = await page.evaluate((f) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return { want: Math.round(max * f), got: Math.round(window.scrollY) };
    }, frac);
    if (Math.abs(want - got) <= 5) break;
    await page.evaluate((f) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * f, behavior: 'instant' });
    }, frac);
  }
  // Let Lenis lerp, GSAP scrub, R3F frames, and fonts all settle.
  await new Promise((r) => setTimeout(r, 2400));
}

async function sweepTo(page, frac) {
  // land just short of the target, then pump small real wheel events until we
  // reach it — enough velocity for streaks/CA, without overshooting the mark.
  await settleScroll(page, Math.max(0, frac - 0.05));
  for (let i = 0; i < 60; i++) {
    const { want, got } = await page.evaluate((f) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return { want: max * f, got: window.scrollY };
    }, frac);
    if (got >= want - 20) break;
    await page.evaluate(() =>
      window.dispatchEvent(
        new WheelEvent('wheel', { deltaY: 34, bubbles: true, cancelable: true }),
      ),
    );
    await new Promise((r) => setTimeout(r, 16));
  }
  // capture while velocity is still hot
  await new Promise((r) => setTimeout(r, 90));
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  log('starting next dev...');
  const server = spawn('npm', ['run', 'dev', '--', '-p', '4321'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
  server.stdout.on('data', (d) => process.stdout.write('[dev] ' + d));
  server.stderr.on('data', (d) => process.stderr.write('[dev!] ' + d));

  try {
    const port = await waitHttpUp();
    log('dev server up on port', port);

    const { browser, page } = await launch(port);
    log('chrome up; loading page (first compile can take a while)...');
    await page.goto(`http://127.0.0.1:${port}/`, {
      waitUntil: 'networkidle0',
      timeout: 180_000,
    });
    // canvas must exist and be rendering
    await page.waitForFunction(
      () => {
        const c = document.querySelector('.canvas-wrap canvas');
        return !!c && c.width > 0 && c.height > 0;
      },
      { timeout: 60_000 },
    );
    await new Promise((r) => setTimeout(r, 3500)); // fonts + first frames

    for (let i = 0; i < positions.length; i++) {
      const { f, sweep } = positions[i];
      if (sweep) await sweepTo(page, f);
      else await settleScroll(page, f);
      const file = join(
        outDir,
        `pos${String(i).padStart(2, '0')}_${String(Math.round(f * 100)).padStart(3, '0')}${sweep ? '_sweep' : ''}.png`,
      );
      await page.screenshot({ path: file });
      log('captured', file);
    }

    await browser.close();
    log('DONE', positions.length, 'captures →', outDir);
  } finally {
    server.kill('SIGTERM');
    setTimeout(() => process.exit(0), 300);
  }
}

main().catch((e) => {
  console.error('[shoot] FAILED:', e);
  process.exit(1);
});
