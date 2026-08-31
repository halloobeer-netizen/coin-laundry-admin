const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(file, 'utf8');

    if (!html.includes('./mobile-landscape-scroll.css')) {
      html = html.replace('</head>', '  <link rel="stylesheet" href="./mobile-landscape-scroll.css?v=20260831-2" />\n</head>');
    }

    if (!html.includes('id="mobilePanFix"')) {
      html = html.replace('</head>', `  <style id="mobilePanFix">
@media (max-width: 1024px) {
  html, body { width:100%; max-width:100%; overflow-x:hidden !important; }
  body { padding-bottom:0 !important; }
  .layout-pan {
    width:100vw;
    max-width:100vw;
    overflow-x:auto !important;
    overflow-y:visible;
    -webkit-overflow-scrolling:touch;
    overscroll-behavior-x:contain;
    touch-action:pan-x pan-y;
  }
  .layout-pan > .app-shell {
    width:1000px !important;
    min-width:1000px !important;
    max-width:none !important;
    margin:0 !important;
    overflow:visible !important;
  }
}
@media (max-width: 430px) {
  .layout-pan > .app-shell {
    width:950px !important;
    min-width:950px !important;
  }
}
  </style>\n</head>`);
    }

    if (!html.includes('class="layout-pan"')) {
      html = html.replace('<div class="app-shell">', '<div class="layout-pan"><div class="app-shell">');
      html = html.replace(/<\/div>\s*\n\s*<nav class="mobile-nav">/, '</div></div>\n\n  <nav class="mobile-nav">');
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
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).send(html);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Gagal memuat aplikasi');
  }
};
