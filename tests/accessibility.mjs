import {chromium} from 'playwright-core';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../tools/serve.mjs';

const require=createRequire(import.meta.url), server=await serve(),browser=await chromium.launch({headless:true});
const page=await browser.newPage({locale:'de-DE',viewport:{width:360,height:800},reducedMotion:'reduce'});
const findings=[];
async function audit(view){
  if(!await page.evaluate(()=>Boolean(window.axe)))await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const result=await page.evaluate(async()=>await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
  const contrast=await page.evaluate(()=>{
    function channels(css) { return (css.match(/[\d.]+/g)||[]).map(Number); }
    function layer(fg,bg) { const a=fg[3]??1;return [0,1,2].map(i=>fg[i]*a+bg[i]*(1-a)); }
    function light(rgb){const c=rgb.map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
    const examined=[];
    for(const el of document.querySelectorAll('body *')){
      if(el.closest('.sr-only,.skip,svg,script,style')||!el.getClientRects().length)continue;
      if(![...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim()))continue;
      if(el.getBoundingClientRect().width<=2||getComputedStyle(el).visibility!=='visible')continue;
      if(el.closest('details:not([open])')&&!el.closest('summary'))continue;
      if(document.querySelector('dialog[open]')&&!el.closest('dialog'))continue;
      const ancestry=[];for(let p=el;p&&p!==document.body;p=p.parentElement)ancestry.unshift(p);
      const foreground=channels(getComputedStyle(el).color);
      // Test both solid endpoints of the body's paper gradient; all other text surfaces are solid.
      for(const paper of [[244,241,231],[246,245,238]]){
        let background=paper;
        for(const p of ancestry)background=layer(channels(getComputedStyle(p).backgroundColor),background);
        const l1=light(layer(foreground,background)),l2=light(background);
        examined.push({ratio:(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05),text:el.textContent.trim().slice(0,60)});
      }
    }
    examined.sort((a,b)=>a.ratio-b.ratio);
    return {minimum:examined[0],samples:examined.length,below:examined.filter(x=>x.ratio<4.5)};
  });
  findings.push({view,passedRules:result.passes.length,automatedViolations:result.violations.map(v=>({id:v.id,impact:v.impact,
    nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),manualRules:result.incomplete.map(v=>v.id),contrast});
}
const click=s=>page.locator(s).filter({visible:true}).first().click();
try{
  await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('.answer').first().waitFor();
  await audit('Unbeantwortete Frage');
  await click('.answer');await page.waitForSelector('#feedback');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'feedback');
  await audit('Antwort und Erklärung');
  await click('[data-action=next]');await page.waitForSelector('.answer:not(:disabled)');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'question');
  await click('[data-action=pause]');await page.locator('dialog[open]').waitFor();await audit('Pausendialog');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'pause');
  for(const [view,selector] of [['today','.cover'],['topics','.topic-card'],['knowledge','.subtabs'],['settings','.toggle']]){
    await click('[data-nav='+view+']');await page.waitForSelector(selector);await audit(view);
  }
  await click('[data-nav=today]');await click('[data-action=daily]');
  for(let i=1;i<10;i++){await click('.answer');await page.waitForSelector('#feedback');await click('[data-action=next]');}
  await page.waitForSelector('.score');await click('details.virtual summary');await audit('Ergebnis mit offener Vergleichstabelle');
  const file='release/qa/barrierefreiheit-browser.json';
  await mkdir('release/qa',{recursive:true});await writeFile(file,JSON.stringify({at:new Date().toISOString(),browser:browser.version(),
    axe:require('axe-core/package.json').version,checks:findings,focus:'Erklärung, nächste Frage und Rückkehr aus Pausendialog geprüft.'},null,2));
  const failures=findings.flatMap(f=>f.automatedViolations.map(v=>({view:f.view,...v})));
  for(const f of findings)if(f.contrast.below.length)failures.push({view:f.view,contrast:f.contrast.below});
  console.log(failures.length ? JSON.stringify(failures,null,2) : findings.length+' Ansichten ohne automatische WCAG-A/AA-Befunde; Tastaturfokus geprüft.');
  process.exitCode=failures.length ? 1:0;
}finally{await browser.close();server.close();}
