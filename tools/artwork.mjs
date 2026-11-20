import {chromium} from 'playwright-core';
import {readFile,mkdir} from 'node:fs/promises';
import {logo} from '../web/js/icons.js';

const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({deviceScaleFactor:1});
  await mkdir('release/store',{recursive:true});
  const face = (await readFile('web/assets/fonts/Spectral-Medium.ttf')).toString('base64');
  const art = (await readFile('web/assets/salon.webp')).toString('base64');
  for (const size of [192,512]) {
    await page.setViewportSize({width:size,height:size});
    await page.setContent('<style>*{box-sizing:border-box}body{margin:0;background:#17483c;display:grid;place-items:center;height:100vh}.brandmark{height:70vmin;width:70vmin;color:#ecd394}</style>' + logo);
    await page.screenshot({path:'web/assets/icon-' + size + '.png'});
    if (size===512) await page.screenshot({path:'release/store/Icon-512.png'});
  }
  await page.setViewportSize({width:1024,height:500});
  await page.setContent('<style>@font-face{font-family:Spectral;src:url(data:font/ttf;base64,' + face + ')}*{box-sizing:border-box}body{margin:0;width:1024px;height:500px;display:grid;grid-template-columns:46% 54%;background:#17483c;color:#fff3d7}section{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding-left:56px;border-bottom:7px solid #bc9c63}svg{width:91px;height:91px;color:#e6c17d}h1{font:72px Spectral,serif;letter-spacing:-4px;margin:9px 0 4px}p{font:24px Arial,sans-serif;margin:0;color:#f3e9cc}img{width:100%;height:500px;object-fit:cover}</style><section>' + logo + '<h1>Quizsalon</h1><p>Deine tägliche Wissensrunde</p></section><img alt="" src="data:image/webp;base64,' + art + '">');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path:'release/store/Feature-Graphic-1024x500.png'});
} finally { await browser.close(); }
