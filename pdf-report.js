(() => {
  function rupiahPdf(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function getOutletIdentity() {
    const outlet = document.querySelector('.outlet strong')?.textContent?.trim() || 'Clean Wash Laundry';
    const branch = document.querySelector('.outlet span')?.textContent?.trim() || 'Outlet';
    return { outlet, branch };
  }

  function exportReportPDF() {
    if (!window.jspdf?.jsPDF) {
      alert('Modul PDF belum siap. Silakan refresh halaman lalu coba lagi.');
      return;
    }
    if (typeof transactions === 'undefined') {
      alert('Data transaksi belum siap.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { outlet, branch } = getOutletIdentity();
    const now = new Date();

    const total = transactions.reduce((sum, t) => sum + Number(t.total || 0), 0);
    const cash = transactions.filter(t => t.payment === 'Cash').reduce((sum, t) => sum + Number(t.total || 0), 0);
    const qris = transactions.filter(t => t.payment === 'QRIS').reduce((sum, t) => sum + Number(t.total || 0), 0);
    const coins = transactions.reduce((sum, t) => sum + Number(t.coins || 0), 0);

    doc.setFontSize(18);
    doc.text('Laporan Operasional Coin Laundry', 14, 16);
    doc.setFontSize(11);
    doc.text(outlet, 14, 23);
    doc.setFontSize(9);
    doc.text(branch, 14, 29);
    doc.text(`Dicetak: ${now.toLocaleString('id-ID')}`, 14, 35);

    doc.setFontSize(10);
    doc.text(`Total transaksi: ${transactions.length}`, 14, 45);
    doc.text(`Total omzet: ${rupiahPdf(total)}`, 70, 45);
    doc.text(`Cash: ${rupiahPdf(cash)}`, 145, 45);
    doc.text(`QRIS: ${rupiahPdf(qris)}`, 210, 45);
    doc.text(`Koin/Token: ${coins}`, 14, 51);

    const rows = transactions.map((t, i) => [
      i + 1,
      t.time || '-',
      `Mesin ${String(t.machine).padStart(2, '0')}`,
      t.weight ? `${t.weight} kg` : '-',
      t.service || '-',
      t.payment || '-',
      t.coins ?? 0,
      rupiahPdf(t.total),
      t.status || '-'
    ]);

    doc.autoTable({
      startY: 58,
      head: [['No', 'Waktu', 'Mesin', 'Berat', 'Layanan', 'Pembayaran', 'Koin', 'Total', 'Status']],
      body: rows.length ? rows : [['-', '-', '-', '-', 'Belum ada transaksi', '-', '-', '-', '-']],
      styles: { fontSize: 8, cellPadding: 2.4 },
      headStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 18 },
        2: { cellWidth: 24 },
        3: { cellWidth: 18 },
        6: { cellWidth: 14 },
        7: { cellWidth: 30 },
        8: { cellWidth: 22 }
      },
      didDrawPage: () => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Halaman ${pageCount}`, 275, 200, { align: 'right' });
      }
    });

    const safeBranch = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'outlet';
    const date = now.toISOString().slice(0, 10);
    doc.save(`laporan-${safeBranch}-${date}.pdf`);
  }

  function installPdfButton() {
    const csvBtn = document.getElementById('exportReportBtn');
    if (!csvBtn || document.getElementById('exportPdfBtn')) return;

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '10px';
    wrapper.style.flexWrap = 'wrap';
    csvBtn.parentNode.insertBefore(wrapper, csvBtn);
    wrapper.appendChild(csvBtn);

    const pdfBtn = document.createElement('button');
    pdfBtn.id = 'exportPdfBtn';
    pdfBtn.className = 'hero-action';
    pdfBtn.type = 'button';
    pdfBtn.textContent = 'Download PDF';
    pdfBtn.addEventListener('click', exportReportPDF);
    wrapper.appendChild(pdfBtn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPdfButton);
  } else {
    installPdfButton();
  }
})();
