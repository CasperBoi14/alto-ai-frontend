#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const API_TARGET = 'https://api.alto-ai.tech';
const ROOT = process.cwd();

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = path.join(ROOT, url.pathname);

  // Default to index.html for directory
  if (url.pathname === '/' || url.pathname.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      proxyRequest(req, res);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

function proxyRequest(clientReq, clientRes) {
  const targetUrl = new URL(clientReq.url, API_TARGET);

  const proxyOptions = {
    method: clientReq.method,
    headers: { ...clientReq.headers, host: targetUrl.host },
  };

  const proxyReq = https.request(targetUrl, proxyOptions, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    // Avoid sending the upstream CORS headers to the browser (we want same-origin)
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];

    clientRes.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    clientRes.end(`Proxy error: ${err.message}`);
  });

  clientReq.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Dev server running: http://localhost:${PORT}`);
  console.log('Static files served from:', ROOT);
  console.log('Proxying API requests to:', API_TARGET);
});
