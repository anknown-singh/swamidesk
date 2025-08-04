// Simple proxy server to bypass Next.js binding issues
const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server to forward to Next.js
const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy to Next.js (try different targets)
  const targets = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://0.0.0.0:3000'
  ];

  let targetIndex = 0;
  
  function tryProxy() {
    if (targetIndex >= targets.length) {
      res.writeHead(502, { 'Content-Type': 'text/html' });
      res.end('<h1>❌ Next.js Server Not Available</h1><p>Cannot connect to Next.js on any target.</p>');
      return;
    }

    proxy.web(req, res, { 
      target: targets[targetIndex],
      changeOrigin: true 
    }, (err) => {
      console.log(`❌ Failed to connect to ${targets[targetIndex]}:`, err.message);
      targetIndex++;
      tryProxy();
    });
  }
  
  tryProxy();
});

server.listen(8000, '127.0.0.1', () => {
  console.log('🚀 Proxy server running on http://localhost:8000');
  console.log('   Forwarding to Next.js server...');
});

server.on('error', (err) => {
  console.error('❌ Proxy server error:', err);
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.log('❌ Proxy error:', err.message);
});