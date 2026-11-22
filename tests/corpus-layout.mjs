import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../tools/serve.mjs';

const server=await serve(),browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:360,height:640},locale:'de-DE',serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForSelector('.answer');await page.evaluate(()=>document.fonts.ready);
  const result=await page.evaluate(async()=>{
    const {quizPage}=await import('/js/views.js'),{newGame,clock}=await import('/js/engine.js');
    const catalog=await (await fetch('/data/catalog.json')).json(),day=clock().day,state=newGame();
    const sample=state.sessions.layout={mode:'daily',cursor:0,day,items:[],isReview:false};
    const surface=document.createElement('div'),main=document.querySelector('main'),failures=[];
    let counts=0, minButton=Infinity;
    for(const scale of [100,150,200]){
      document.documentElement.style.fontSize=scale+'%';
      for(const q of catalog.questions){
        const item={q,kind:'new',order:q.options.map(o=>o.id),answer:null,void:false};
        sample.items=Array.from({length:10},()=>item);
        for(const answered of [false,true]){
          if(answered){
            const wrong=q.options.find(o=>o.id!==q.correct_option_id);
            item.answer={optionId:wrong.id,correct:false};
          }
          surface.innerHTML=quizPage({state,session:sample,day});
          main.replaceChildren(...surface.childNodes);
          const nodes=document.querySelectorAll('.question-title,.answer-text,.category-tag,.question-format,.feedback h3,.feedback p,.answer-state');
          for(const n of nodes){
            const r=document.createRange();r.selectNodeContents(n);
            const rect=r.getBoundingClientRect(),box=n.getBoundingClientRect();
            if(rect.right>innerWidth+.5||rect.left<-.5||rect.bottom>box.bottom+2||n.scrollWidth>n.clientWidth+2){
              failures.push({q:q.id,scale,answered,node:n.className,text:n.textContent});
            }
          }
          for(const button of document.querySelectorAll('.answer'))minButton=Math.min(minButton,button.getBoundingClientRect().height);
          counts++;
        }
      }
      await new Promise(requestAnimationFrame);
    }
    return {catalog:catalog.version,questions:catalog.questions.length,viewport:[360,640],fontPercent:[100,150,200],states:['Frage','Auflösung'],renderedCards:counts,
      minAnswerHeightPx:minButton,failures};
  });
  const out=process.argv[2] || 'release/qa';
  await mkdir(out,{recursive:true});await writeFile(out+'/korpus-layout.json',JSON.stringify({at:new Date().toISOString(),browser:browser.version(),...result},null,2));
  assert.deepEqual(result.failures.slice(0,5),[]);assert.ok(result.minAnswerHeightPx>=64);
  console.log(result.renderedCards+' echte Fragenlayouts, minimale Antwortfläche '+result.minAnswerHeightPx+' CSS-Pixel, keine überlaufenden Texte.');
}finally{await browser.close();server.close();}
