(() => {
  function rupiahPdf(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  async function getOutletIdentity() {
    try {
      const response = await fetch('/api/settings', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        return {
          outlet: data.outlet_name || 'Clean Wash Laundry',
          branch: data.branch_name || 'Outlet',
          address: data.address || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          cashier: data.cashier_name || 'Admin 01'
        };
      }
    } catch (_) {}

    const outlet = document.querySelector('.outlet div strong')?.textContent?.trim() || 'Clean Wash Laundry';
    const branch = document.querySelector('.outlet div span')?.textContent?.trim() || 'Outlet';
    return { outlet, branch, address: '', phone: '', whatsapp: '', cashier: 'Admin 01' };
  }

  async function exportReportPDF() {
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
    const identity = await getOutletIdentity();
    const { outlet, branch, address, phone, whatsapp, cashier } = identity;
    const now = new Date();

    const total = transactions.reduce((sum, t) => sum + Number(t.total || 0), 0);
    const cash = transactions.filter(t => t.payment === 'Cash').reduce((sum, t) => sum + Number(t.total || 0), 0);
    const qris = transactions.filter(t => t.payment === 'QRIS').reduce((sum, t) => sum + Number(t.total || 0), 0);
    const coins = transactions.reduce((sum, t) => sum + Number(t.coins || 0), 0);

    doc.setFontSize(18);
    doc.text('Laporan Operasional Coin Laundry', 14, 16);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(outlet, 14, 24);
    doc.setFont(undefined, 'normal');

    doc.setFontSize(10);
    doc.text(branch, 14, 30);

    let identityY = 36;
    if (address) {
      const addressLines = doc.splitTextToSize(`Alamat: ${address}`, 150);
      doc.text(addressLines, 14, identityY);
      identityY += addressLines.length * 5;
    }
    if (phone || whatsapp) {
      const contacts = [phone ? `Telp: ${phone}` : '', whatsapp ? `WhatsApp: ${whatsapp}` : ''].filter(Boolean).join('   |   ');
      doc.text(contacts, 14, identityY);
      identityY += 5;
    }
    doc.text(`Kasir/Admin: ${cashier}`, 14, identityY);
    identityY += 5;
    doc.text(`Dicetak: ${now.toLocaleString('id-ID')}`, 14, identityY);

    const summaryY = Math.max(54, identityY + 9);
    doc.setFontSize(10);
    doc.text(`Total transaksi: ${transactions.length}`, 14, summaryY);
    doc.text(`Total omzet: ${rupiahPdf(total)}`, 70, summaryY);
    doc.text(`Cash: ${rupiahPdf(cash)}`, 145, summaryY);
    doc.text(`QRIS: ${rupiahPdf(qris)}`, 210, summaryY);
    doc.text(`Koin/Token: ${coins}`, 14, summaryY + 6);

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
      startY: summaryY + 13,
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