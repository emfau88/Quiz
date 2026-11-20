// Drives the documented emulator touchscreen; Android's installed TalkBack service interprets the gestures.
import {execFileSync,spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {connect} from 'node:http2';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {setTimeout as wait} from 'node:timers/promises';
import {createInterface} from 'node:readline';
import assert from 'node:assert/strict';
const [serial,output]=process.argv.slice(2);
assert.match(serial || '',/^emulator-\d+$/);
const adb=(...args)=>execFileSync('adb',['-s',serial,...args],{encoding:'utf8',timeout:45000}).trim();
const name=adb('emu','avd','name').split(/\r?\n/)[0].trim();
assert.match(name,/^Quizsalon/);
const discovery=join(tmpdir(),'avd','running');
const metadata=readdirSync(discovery).filter(f=>/^pid_\d+\.ini$/.test(f)).map(f=>
  Object.fromEntries(readFileSync(join(discovery,f),'utf8').trim().split(/\r?\n/).map(line=>{
    const split=line.indexOf('=');return [line.slice(0,split),line.slice(split+1)];
  }))).find(m=>m['avd.name']===name && m['port.serial']===serial.slice(9));
assert.ok(metadata?.['grpc.token'] && /^\d+$/.test(metadata['grpc.port']),'Lokale authentifizierte AVD-Discovery fehlt.');
const folder=resolve(output);
mkdirSync(folder,{recursive:true});
const client=connect('http://127.0.0.1:'+metadata['grpc.port']);
function varint(number) {
  const bytes=[];
  do {bytes.push(number>=128?(number&127)|128:number);number=Math.floor(number/128);} while(number);
  return bytes;
}
async function touch(x,y,pressure) {
  const finger=Buffer.from([8,...varint(x),16,...varint(y),24,1,32,pressure]);
  const event=Buffer.from([10,...varint(finger.length),...finger]);
  const frame=Buffer.alloc(5+event.length);
  frame.writeUInt32BE(event.length,1);event.copy(frame,5);
  const request=client.request({':method':'POST',':path':'/android.emulation.control.EmulatorController/sendTouch',
    'content-type':'application/grpc',te:'trailers',authorization:'Bearer '+metadata['grpc.token']});
  let status;
  request.on('response',h=>{status=h['grpc-status'];});
  request.on('trailers',h=>{status=h['grpc-status'];});
  request.resume();
  await new Promise((done,fail)=>{request.on('end',done);request.on('error',fail);request.end(frame);});
  assert.equal(status,'0');
}
async function tap(x,y) {await touch(x,y,80);await wait(60);await touch(x,y,0);}
async function perform(kind,x,y) {
  if(kind==='explore') {
    await touch(x-12,y,80);await wait(350);await touch(x+8,y,80);await wait(400);await touch(x+8,y,0);
  } else if(['swipeRight','answerLeft','answerRight'].includes(kind)) {
    const direction=kind==='answerLeft'?-1:1;
    const start=x-direction*230;
    await touch(start,y,80);
    for(let i=1;i<=12;i++) {await wait(12);await touch(start+direction*i*40,y,80);}
    await touch(start+direction*480,y,0);
  } else {
    await tap(x,y);
    if(kind==='doubleTap'||kind==='activate') {await wait(70);await tap(x,y);}
  }
}
const child=spawn('adb',['-s',serial,'shell','am','instrument','-w','-r','-e','talkback','true',
  'de.quizsalon.vorschau.test/de.quizsalon.app.NativeChecks'],{stdio:['ignore','pipe','inherit']});
const complete=new Promise((done,fail)=>{child.once('error',fail);child.once('close',done);});
const lines=[];
const screens=new Set();
try {
  for await(const line of createInterface({input:child.stdout})) {
    lines.push(line);
    const action=line.match(/^INSTRUMENTATION_STATUS: quizGesture=(explore|swipeRight|answerLeft|answerRight|doubleTap|activate|result) (\d+) (\d+)/);
    if(action) {
      if(['answerLeft','answerRight','doubleTap','result'].includes(action[1])) {
        const png=action[1]==='result'?'03-rundenergebnis.png':action[1]==='doubleTap'?'02-zweite-antwort.png':'01-erste-antwort.png';
        if(!screens.has(png)) {
        screens.add(png);
        adb('shell','screencap','-p','/data/local/tmp/quizsalon-talkback.png');
        adb('pull','/data/local/tmp/quizsalon-talkback.png',join(folder,png));
        }
      }
      if(action[1]!=='result') await perform(action[1],Number(action[2]),Number(action[3]));
    }
    if(line.includes('PASS')||line.includes('FAILED')||line.includes('quizCheck=')) console.log(line);
  }
  assert.equal(await complete,0);
  assert.ok(lines.includes('INSTRUMENTATION_CODE: -1') && lines.some(s=>s.includes('PASS Gesamte Tagesrunde')));
} finally {
  client.close();
  writeFileSync(join(folder,'talkback.txt'),lines.join('\n')+'\n');
}
