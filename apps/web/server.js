const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;
const API_URL = process.env.API_URL || 'https://highlander-club-ucr-production.up.railway.app';

// Proxy /api requests to the backend API (same domain = no CORS issues)
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

// Serve the Expo web build
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Highlander Events Web running on port ${PORT}`);
  console.log(`🔗 API proxy → ${API_URL}`);
});
