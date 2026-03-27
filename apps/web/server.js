const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 8080;
const API_TARGET = 'https://highlander-club-ucr-production.up.railway.app';

// Manual API proxy — no external dependencies needed
app.use('/api', (req, res) => {
  const targetUrl = new URL(req.originalUrl, API_TARGET);
  const proto = targetUrl.protocol === 'https:' ? https : http;

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.hostname,
    },
  };

  // Don't forward connection-specific headers
  delete options.headers['connection'];
  delete options.headers['host'];
  options.headers['host'] = targetUrl.hostname;

  const proxyReq = proto.request(options, (proxyRes) => {
    // Copy response headers (add CORS just in case)
    const responseHeaders = { ...proxyRes.headers };
    responseHeaders['access-control-allow-origin'] = '*';
    responseHeaders['access-control-allow-methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    responseHeaders['access-control-allow-headers'] = 'Content-Type,Authorization';

    res.writeHead(proxyRes.statusCode, responseHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.status(502).json({ error: 'Proxy error', details: err.message });
  });

  // Forward request body
  req.pipe(proxyReq);
});

// Handle CORS preflight for /api routes
app.options('/api/*', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.sendStatus(204);
});

// Serve the Expo web build (static files)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Highlander Events Web running on port ${PORT}`);
  console.log(`🔗 API proxy → ${API_TARGET}`);
});
