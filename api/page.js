const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('./auth-ui.js')) {
      html = html.replace('<script src="./app.js"></script>', '<script src="./auth-ui.js"></script>\n  <script src="./app.js"></script>');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Gagal memuat aplikasi');
  }
};
