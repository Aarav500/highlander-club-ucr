const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 8080;
// Set API_TARGET env var to your EC2 instance URL, e.g. http://ec2-xx-xx-xx-xx.compute.amazonaws.com:3001
const API_TARGET = process.env.API_TARGET || 'http://localhost:3001';

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
    // For CAS redirects, rewrite Location header to point to our web server
    const responseHeaders = { ...proxyRes.headers };
    responseHeaders['access-control-allow-origin'] = '*';
    responseHeaders['access-control-allow-methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    responseHeaders['access-control-allow-headers'] = 'Content-Type,Authorization';

    // If it's a redirect (CAS flow), let it pass through
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res);
      return;
    }

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

// ─── Auth callback page ─────────────────────────────────────────────────────
// CAS redirects here with ?token=... after successful login
app.get('/auth/callback', (req, res) => {
  const token = req.query.token || '';
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Signing in...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #0A0E1A;
      color: #FFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .container { text-align: center; padding: 2rem; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-radius: 50%;
      border-top-color: #F1AB00;
      animation: spin 1s ease-in-out infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { color: #F1AB00; margin-bottom: 0.5rem; }
    p { color: rgba(255,255,255,0.6); }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Signing you in...</h2>
    <p>Please wait while we verify your UCR credentials.</p>
  </div>
  <script>
    const token = ${token ? `"${token}"` : 'null'};
    if (token) {
      localStorage.setItem('auth_token', token);
      window.location.replace('/');
    } else {
      document.querySelector('.container').innerHTML =
        '<h2 style="color:#EF4444;">Authentication Failed</h2>' +
        '<p>No token received. Please try again.</p>' +
        '<a href="/" style="color:#F1AB00;margin-top:1rem;display:inline-block;">Back to Home</a>';
    }
  </script>
</body>
</html>`);
});

// Serve the Expo web build (static files)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 UniPulse Web running on port ${PORT}`);
  console.log(`🔗 API proxy → ${API_TARGET}`);
  console.log(`🔐 CAS callback → /auth/callback`);
});
