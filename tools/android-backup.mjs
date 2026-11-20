// Destructive to the synthetic Play-preview profile on the named, disposable Quizsalon AVD only.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {setTimeout as wait} from 'node:timers/promises';
import assert from 'node:assert/strict';

const [serial,apk,output] = process.argv.slice(2);
const pkg = 'de.quizsalon.vorschau';
if (!/^emulator-\d+$/.test(serial || '') || !apk || !existsSync(apk) || !output) {
  throw new Error('Aufruf: node tools/android-backup.mjs emulator-PORT PLAY-VORSCHAU.apk AUSGABEVERZEICHNIS');
}
const adb = (...args) => execFileSync('adb',['-s',serial,...args],{encoding:'utf8',timeout:55000}).trim();
const shell = (...args) => adb('shell',...args);
assert.match(adb('emu','avd','name'),/^Quizsalon/);
const originalTransport = shell('bmgr','list','transports').match(/\*\s+(\S+)/)?.[1];
const wasEnabled = shell('bmgr','enabled').includes('currently enabled');
const originalTransportParams = shell('settings','get','secure','backup_local_transport_parameters');
const folder = resolve(output);
mkdirSync(folder,{recursive:true});
const report = {run:new Date().toISOString(),pkg,api:shell('getprop','ro.build.version.sdk'),checks:[]};
function passed(text) { report.checks.push(text); console.log(text); }
const fsHash = () => shell('run-as',pkg,'sha256sum','databases/game.db').split(/\s+/)[0];
const installId = () => shell('run-as',pkg,'cat','no_backup/installation');
try {
  shell('bmgr','enable','true');
  shell('bmgr','transport','com.android.localtransport/.LocalTransport');
  shell('settings','put','secure','backup_local_transport_parameters','is_encrypted=true');
  assert.match(shell('bmgr','backupnow','--non-incremental','@pm@'),/Success/i);
  const id = installId();
  assert.match(id,/^[a-f0-9-]{36}$/);
  shell('run-as',pkg,'touch','no_backup/qa-backup-exclusion-canary');
  const digest = fsHash();
  const saved = shell('bmgr','backupnow','--non-incremental',pkg);
  assert.ok(saved.includes('Package ' + pkg + ' with result: Success'),saved);
  passed('Android BackupManager hat die Play-Vorschau im lokalen Systemtransport tatsächlich gesichert');
  const token = shell('bmgr','list','sets').match(/^\s*([0-9a-f]+)\s*:\s*Local disk image/im)?.[1];
  assert.ok(token,'LocalTransport-Restoreset fehlt');
  assert.match(shell('pm','uninstall','--user','0',pkg),/Success/);
  assert.match(adb('install','-t','--user','0',resolve(apk)),/Success/);
  let restoredHash;
  try { restoredHash=fsHash(); } catch { /* Some system images require an explicit restore. */ }
  if (restoredHash!==digest) {
    const restored = shell('bmgr','restore',token,pkg);
    assert.match(restored,/restoreFinished: 0|restoreFinished.*SUCCESS/i);
  }
  assert.equal(fsHash(),digest);
  passed('Echte Deinstallation, Neuinstallation und System-Restore erhalten die Spielstanddatenbank bytegenau');
  const excluded = shell('run-as',pkg,'find','.', '-name','qa-backup-exclusion-canary') +
      shell('run-as',pkg,'find','.', '-name','installation');
  assert.ok(!excluded.includes('installation') && !excluded.includes('qa-backup-exclusion-canary'));
  passed('Installationskennung und künstlicher Kontrollmarker im ausgeschlossenen no_backup-Bereich fehlen nach Restore');
  shell('am','start','-W','-n',pkg+'/de.quizsalon.app.MainActivity');
  let actualId;
  for(let i=0;i<30&&!actualId;i++) {
    try { actualId=installId(); } catch { await wait(250); }
  }
  assert.match(actualId || '',/^[a-f0-9-]{36}$/);
  assert.notEqual(actualId,id);
  passed('Der neu gestartete Host erzeugt eine neue Installationskennung bei erhaltenem Spielstand');
  report.ok=true;
} finally {
  if(originalTransport) shell('bmgr','transport',originalTransport);
  if(originalTransportParams==='null') shell('settings','delete','secure','backup_local_transport_parameters');
  else shell('settings','put','secure','backup_local_transport_parameters',originalTransportParams);
  if(!wasEnabled) shell('bmgr','enable','false');
  writeFileSync(join(folder,'android-backup.json'),JSON.stringify(report,null,2)+'\n');
}
