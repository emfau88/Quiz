import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../web/',import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json',
  '.webmanifest':'application/manifest+json','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
export function serve(port = 0) {
  const server = createServer(async (request,response) => {
    try {
      const url = new URL(request.url,'http://localhost');
      const file = path.resolve(root,'.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      const relative = path.relative(root,file);
      if (relative.startsWith('..') || path.isAbsolute(relative) || !(await stat(file)).isFile()) throw Error();
      response.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});
      response.end(await readFile(file));
    } catch { response.writeHead(404); response.end('Nicht gefunden'); }
  });
  return new Promise((resolve,reject) => {
    server.once('error',reject);
    server.listen(port,'127.0.0.1',() => resolve(server));
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await serve(Number(process.argv[2] || 5184));
  console.log('Quizsalon: http://127.0.0.1:' + server.address().port + '/');
}
