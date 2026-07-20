import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewPullRequest } from './services/reviewer.js';
import { demoPullRequest } from './services/demo-data.js';

const port = Number(process.env.PORT || 3000);
const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const mimeTypes = { '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.html': 'text/html' };

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
  res.end(Buffer.isBuffer(body) || typeof body === 'string' ? body : JSON.stringify(body));
}

async function bodyOf(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/pull-request') return send(res, 200, demoPullRequest);
    if (req.method === 'POST' && url.pathname === '/api/reviews') {
      const input = await bodyOf(req);
      return send(res, 200, await reviewPullRequest({ ...demoPullRequest, ...input }));
    }
    if (req.method === 'GET') {
      const requested = url.pathname === '/' ? '/index.html' : url.pathname;
      const file = normalize(join(publicDir, requested));
      if (!file.startsWith(publicDir)) return send(res, 403, 'Forbidden', 'text/plain');
      return send(res, 200, await readFile(file), mimeTypes[extname(file)] || 'application/octet-stream');
    }
    send(res, 404, { error: 'Not found' });
  } catch (error) {
    send(res, 500, { error: error instanceof Error ? error.message : 'Unexpected server error' });
  }
}).listen(port, () => console.log(`ReviewMint listening at http://localhost:${port}`));
