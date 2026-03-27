const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve the Expo web build
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Highlander Events Web running on port ${PORT}`);
});
