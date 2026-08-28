# Clean Wash Coin Laundry Admin

Peningkatan utama:
- Flow transaksi kasir lebih jelas: Cucian → Pembayaran → Koin
- Input nama/catatan pelanggan opsional
- Cash: input uang diterima dan kembalian otomatis
- QRIS: checkbox konfirmasi pembayaran diterima
- Tombol simpan hanya aktif jika pembayaran valid
- Stepper jumlah koin/token
- Ringkasan transaksi sebelum konfirmasi
- Tetap responsive untuk desktop, tablet, dan HP

Alur operasional:
Pelanggan timbang cucian → admin pilih mesin/layanan → bayar Cash/QRIS → admin konfirmasi → admin serahkan koin/token → pelanggan memasukkan koin ke mesin.


V2.2 fix:
- Modal transaksi sekarang bisa di-scroll vertikal.
- Tinggi modal mengikuti tinggi layar.
- Support layar laptop pendek dan mobile.
- Header modal sticky di mobile.


V2.3:
- Menu Transaksi aktif sebagai halaman.
- Pencarian dan filter Cash/QRIS serta status.
- Menu Laporan aktif.
- Statistik omzet dan transaksi.
- Analisis metode pembayaran.
- Penggunaan mesin per transaksi.
- Export laporan CSV.
- Navigasi sidebar antar halaman.


V2.4:
- Operasional dipisah menjadi halaman sendiri.
- Riwayat Transaksi tetap halaman arsip terpisah.
- Dashboard sekarang fokus pada ringkasan.
- Operasional berisi status 8 mesin, transaksi baru, dan aktivitas terbaru.
- Riwayat Transaksi memiliki filter tambahan berdasarkan mesin.
- Navigasi sidebar dan mobile diperbarui.


V2.5 FIX BESAR:
- Dashboard tidak lagi menampilkan seluruh operasional dan seluruh riwayat.
- Dashboard sekarang hanya ringkasan singkat.
- Operasional adalah halaman terpisah untuk 8 mesin dan aktivitas aktif.
- Riwayat Transaksi adalah halaman terpisah khusus arsip/filter.
- Laporan adalah halaman terpisah.
- Navigasi menggunakan hash URL (#dashboard, #operations, #transactions, #reports) sehingga pergantian halaman terlihat jelas.


V2.6:
- Halaman Mesin aktif penuh.
- Ringkasan total/tersedia/digunakan/maintenance.
- Cari dan filter mesin.
- Tambah mesin.
- Edit jenis, kapasitas, status, durasi default, catatan.
- Tandai mesin selesai.
- Ubah mesin ke maintenance / aktifkan kembali.
- Hapus mesin jika tidak sedang digunakan.
- Perubahan langsung tersinkron ke Dashboard dan Operasional (masih data frontend sementara).


V2.7:
- Timer sisa waktu mesin berjalan otomatis per detik.
- Saat transaksi dibuat, finish time dihitung dari durasi default mesin.
- Saat countdown mencapai 00:00, status mesin otomatis menjadi Selesai.
- Transaksi aktif pada mesin tersebut otomatis berubah menjadi Selesai.
- Mesin tidak langsung menjadi Tersedia; admin menekan "Tersedia Lagi" setelah pelanggan mengambil cucian.
- Timer tersinkron di Dashboard/Operasional/Halaman Mesin selama halaman masih terbuka.


V2.8:
- Layanan utama diubah menjadi "Cuci + Dryer".
- Harga: Rp35.000 per kg.
- Total transaksi otomatis: berat × Rp35.000.
- Contoh: 1 kg = Rp35.000, 2 kg = Rp70.000, 5 kg = Rp175.000.


V2.9:
- Halaman Harga & Layanan aktif penuh.
- Layanan utama Cuci + Dryer Rp35.000/kg bisa diedit langsung.
- Admin bisa tambah layanan baru.
- Edit nama, harga, satuan, jenis mesin, durasi, status aktif, dan catatan.
- Layanan bisa dinonaktifkan tanpa dihapus.
- Layanan nonaktif otomatis tidak muncul di form transaksi kasir.
- Halaman memiliki pencarian dan filter.


V3.0 CORRECTION:
- Harga Cuci + Dryer adalah Rp35.000 per maksimal 7 kg, bukan per kg.
- Perhitungan otomatis memakai paket 7 kg:
  - 1–7 kg = Rp35.000
  - 8–14 kg = Rp70.000
  - 15–21 kg = Rp105.000
- Jumlah koin/token otomatis mengikuti jumlah paket 7 kg.
