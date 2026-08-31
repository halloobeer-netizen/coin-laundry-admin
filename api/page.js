const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(file, 'utf8');

    if (!html.includes('./mobile-landscape-scroll.css')) {
      html = html.replace('</head>', '  <link rel="stylesheet" href="./mobile-landscape-scroll.css" />\n</head>');
    }

    html = html.replace(
      /<nav class="mobile-nav">[\s\S]*?<\/nav>/,
      `<nav class="mobile-nav" aria-label="Navigasi admin mobile">
        <button class="active" data-mobile-view="dashboard">⌂<span>Dashboard</span></button>
        <button data-mobile-view="operations">◈<span>Operasional</span></button>
        <button data-mobile-view="transactions">▤<span>Riwayat</span></button>
        <button data-mobile-view="machines">◉<span>Mesin</span></button>
        <button data-mobile-view="reports">▥<span>Laporan</span></button>
        <button data-mobile-view="services">◇<span>Harga & Layanan</span></button>
        <button data-mobile-view="settings">⚙<span>Pengaturan</span></button>
        <button id="mobileNewTx">＋<span>Transaksi</span></button>
      </nav>`
    );

    if (!html.includes('./auth-ui.js')) {
      html = html.replace('<script src="./app.js"></script>', '<script src="./auth-ui.js"></script>\n  <script src="./app.js"></script>');
    }
    if (!html.includes('./dashboard-shortcuts.js')) {
      html = html.replace('<script src="./app.js"></script>', '<script src="./dashboard-shortcuts.js"></script>\n  <script src="./app.js"></script>');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Gagal memuat aplikasi');
  }
};
