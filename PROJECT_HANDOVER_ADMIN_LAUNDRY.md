# PROJECT HANDOVER — ADMIN LAUNDRY

## 1. Project Overview

**Project Name:** Admin Laundry  
**Project Type:** Laundry Management Web Application  
**Primary User:** Admin / Operator Laundry  
**Status:** Active Development  
**Primary Purpose:** Mengelola operasional laundry, mesin, layanan, transaksi, waktu pemakaian mesin, dan riwayat aktivitas secara terstruktur.

Project ini sudah dikembangkan dan **BUKAN project baru**.

Developer atau AI yang melanjutkan project wajib memahami kondisi repository terbaru terlebih dahulu dan melanjutkan dari versi yang sudah berjalan.

---

## 2. Core Continuation Rule

Sebelum melakukan perubahan:

1. Periksa repository terbaru.
2. Periksa struktur folder.
3. Periksa `package.json`.
4. Periksa database/schema.
5. Periksa halaman yang sudah tersedia.
6. Periksa API routes.
7. Periksa environment variables.
8. Periksa deployment configuration.
9. Identifikasi fitur yang sudah bekerja.
10. Jangan membangun ulang fitur yang sudah stabil.

**Repository dan database terbaru adalah source of truth.**

Jangan membuat aplikasi baru dari nol.

---

## 3. Main Technology Direction

Stack aktual harus diverifikasi dari repository sebelum perubahan dilakukan.

Teknologi yang digunakan / diarahkan dalam project:

- Next.js
- React
- TypeScript / JavaScript sesuai repository
- PostgreSQL
- Neon
- Vercel
- GitHub
- API routes / backend services

Jangan migrasi framework, database, hosting, atau arsitektur tanpa instruksi eksplisit.

---

## 4. Project Direction — ADMIN ONLY

Arah project ini adalah:

**WEB APPLICATION UNTUK ADMIN / OPERATOR LAUNDRY.**

Bukan aplikasi pelanggan.

Jangan menambahkan customer-facing app, customer login, customer scan, atau workflow pelanggan tanpa instruksi eksplisit.

Fokus utama:

- Operasional admin
- Pengelolaan transaksi
- Pengelolaan mesin
- Monitoring waktu penggunaan
- Riwayat transaksi
- Pengelolaan layanan

---

## 5. Main Modules

Project memiliki / diarahkan memiliki modul utama berikut:

### Dashboard Admin
Menampilkan ringkasan operasional seperti:

- transaksi aktif
- mesin aktif
- mesin tersedia
- pendapatan
- aktivitas terbaru
- status operasional

Implementasi aktual harus mengikuti repository terbaru.

---

## 6. Operational Page

Halaman operasional dipisahkan dari riwayat transaksi.

Ini adalah keputusan yang sudah dibuat.

Halaman operasional digunakan untuk aktivitas yang sedang berlangsung.

Contoh informasi:

- transaksi aktif
- pelanggan / order aktif
- mesin yang digunakan
- layanan
- berat laundry
- waktu mulai
- durasi
- sisa waktu
- status proses

Jangan menggabungkan kembali halaman operasional dan riwayat transaksi tanpa instruksi.

---

## 7. Transaction History Page

Riwayat transaksi memiliki halaman sendiri.

Tujuannya untuk melihat transaksi yang sudah selesai atau aktivitas sebelumnya.

Informasi dapat meliputi:

- ID transaksi
- tanggal
- pelanggan
- layanan
- berat
- total biaya
- mesin
- status
- waktu mulai
- waktu selesai

Pertahankan separation antara:

```text
Operasional Aktif
```

dan

```text
Riwayat Transaksi
```

---

## 8. Machine Management Page

Project sudah masuk ke pengembangan halaman mesin.

Halaman mesin digunakan untuk:

- daftar mesin
- status mesin
- mesin tersedia
- mesin sedang digunakan
- waktu mulai penggunaan
- estimasi selesai
- sisa waktu penggunaan

Status mesin ideal:

```text
AVAILABLE
IN_USE
MAINTENANCE
OFFLINE
```

Jika repository sudah menggunakan status berbeda, pertahankan implementasi aktual.

---

## 9. Remaining Time — LOCKED DIRECTION

Sisa waktu pemakaian mesin harus **berkurang otomatis**.

Contoh:

```text
Durasi awal: 45 menit

Start: 10:00
Current: 10:10

Remaining:
35 menit
```

Jangan mengandalkan admin mengurangi waktu secara manual.

Perhitungan ideal berasal dari:

```text
startTime + duration
```

kemudian dibandingkan dengan waktu sekarang.

Gunakan waktu server/database sebagai sumber utama bila diperlukan agar konsisten.

---

## 10. Machine Timer Principle

Konsep:

```text
Transaction Started
       ↓
Machine = IN_USE
       ↓
startTime stored
       ↓
duration stored
       ↓
UI calculates remaining time
       ↓
Remaining reaches 0
       ↓
Machine/process can be marked completed
```

Hindari menyimpan countdown detik per detik di database.

Lebih baik menyimpan:

```text
startTime
duration
expectedEndTime
```

dan menghitung remaining time dari timestamp.

---

## 11. Locked Laundry Service

Salah satu layanan yang sudah diputuskan:

### CUCI + DRYER

```text
Harga:
Rp35.000

Kapasitas:
7 kg
```

Artinya:

**Rp35.000 per 7 kg**

Bukan Rp35.000 per kg.

Ini adalah keputusan yang sudah dikoreksi dan harus dipertahankan.

Contoh:

```text
0–7 kg   → Rp35.000
```

Untuk berat di atas 7 kg, aturan pricing lanjutan harus mengikuti implementasi repository atau keputusan berikutnya.

Jangan mengasumsikan sendiri sistem pembulatan tanpa mengecek kode.

---

## 12. Service Management

Sistem layanan harus memungkinkan admin mengelola informasi seperti:

- nama layanan
- harga
- kapasitas
- durasi
- status aktif
- penggunaan mesin jika diperlukan

Contoh layanan locked:

```text
Name:
Cuci + Dryer

Price:
35000

Capacity:
7 kg
```

Jika terdapat struktur service table di database, gunakan struktur tersebut.

---

## 13. Transaction Flow

Alur dasar transaksi admin:

```text
Admin creates transaction
        ↓
Select service
        ↓
Input customer/order information
        ↓
Input laundry weight
        ↓
Assign machine
        ↓
Start process
        ↓
Machine becomes IN_USE
        ↓
Timer starts
        ↓
Operation monitored
        ↓
Process completed
        ↓
Machine becomes AVAILABLE
        ↓
Transaction moves to history
```

Sesuaikan dengan repository aktual jika implementasi telah berbeda.

---

## 14. Machine Assignment

Saat sebuah transaksi menggunakan mesin:

```text
Machine AVAILABLE
       ↓
Assigned to transaction
       ↓
Machine IN_USE
```

Mesin yang sedang digunakan sebaiknya tidak dapat diberikan ke transaksi lain.

Ketika proses selesai:

```text
IN_USE
↓
AVAILABLE
```

unless mesin masuk maintenance.

---

## 15. Database Direction

Database menggunakan:

**Neon PostgreSQL**

Database harus dianggap sebagai data penting.

Sebelum perubahan schema:

- periksa tabel yang sudah ada
- periksa relationship
- gunakan migration aman
- hindari destructive changes

Dilarang melakukan:

```text
DROP DATABASE
DROP TABLE
TRUNCATE
database reset
prisma migrate reset
```

tanpa izin eksplisit.

---

## 16. Data Model Direction

Nama tabel aktual harus diperiksa dari repository.

Secara konseptual project mungkin memiliki entity:

```text
User / Admin
Customer
Service
Machine
Transaction
TransactionItem
MachineUsage
```

Jangan membuat duplicate table jika fungsi yang sama sudah ada.

Sebelum membuat table baru:

1. inspect schema
2. inspect migration
3. inspect API usage
4. inspect existing models

---

## 17. UI / UX Direction

Project harus tetap:

- clean
- modern
- professional
- operational
- mudah digunakan admin
- responsive
- sederhana
- cepat

Hindari:

- terlalu banyak warna
- animasi berlebihan
- gradient berlebihan
- layout yang mengganggu operasional
- redesign seluruh aplikasi tanpa alasan

Pertahankan desain yang sudah stabil.

---

## 18. Scroll / Layout Issue — Previously Fixed Direction

Sebelumnya pernah terjadi masalah tampilan:

```text
Halaman terpotong
dan
tidak bisa scroll
```

Masalah tersebut sudah diperbaiki.

Jangan mengembalikan layout ke struktur yang dapat menyebabkan:

- fixed height tanpa overflow
- body tidak scroll
- content terpotong
- sidebar/container mengunci viewport secara salah

Saat mengubah layout, pastikan seluruh halaman tetap bisa di-scroll.

---

## 19. Page Separation — LOCKED

Keputusan penting:

```text
Dashboard
Operasional
Riwayat Transaksi
Mesin
```

harus menjadi halaman / section yang terpisah dengan fungsi masing-masing.

Jangan membuat seluruh fitur kembali menjadi satu halaman panjang.

---

## 20. Performance

Aplikasi admin harus terasa cepat.

Periksa jika halaman lambat:

- repeated fetch
- unnecessary router refresh
- unnecessary revalidation
- database queries
- large client state
- repeated timer requests
- React rerender
- inefficient API calls

Countdown mesin sebaiknya dihitung di client dari timestamp dan bukan melakukan request server setiap detik.

---

## 21. Timer Reliability

Jika browser direfresh:

Timer **tidak boleh reset**.

Karena timer harus berasal dari data seperti:

```text
startTime
expectedEndTime
```

Contoh:

```text
startTime = 10:00
expectedEndTime = 10:45
```

Jika admin membuka ulang halaman pukul 10:20:

```text
remaining = 25 minutes
```

bukan kembali menjadi 45 menit.

---

## 22. Completion Logic

Ketika remaining time mencapai nol:

Sistem dapat:

- menampilkan status selesai
- memberi indikator kepada admin
- memungkinkan admin confirm completion
- mengubah machine menjadi AVAILABLE

Jangan melakukan perubahan status produksi secara agresif tanpa mengecek workflow yang sudah diterapkan.

---

## 23. GitHub

Project sudah diarahkan / dipindahkan ke GitHub.

Ketika melanjutkan:

```bash
git status
git log --oneline
```

Periksa history terlebih dahulu.

Gunakan commit kecil dan jelas.

Contoh:

```text
feat: add automatic machine remaining time

fix: prevent timer reset after page refresh

feat: separate transaction history page

ui: improve machine management page

fix: restore page scrolling
```

Jangan menghapus Git history.

---

## 24. Deployment

Project sudah diarahkan / dideploy menggunakan:

**Vercel**

Database:

**Neon**

Sebelum deploy:

- build harus berhasil
- env variables tersedia
- database connection tersedia
- migration aman
- tidak ada secret di source code

Setelah deploy:

test:

- dashboard
- operasional
- mesin
- transaksi
- timer
- history
- database connection

---

## 25. Environment Variables

Jangan expose secret.

Periksa env yang sudah digunakan.

Contoh:

```env
DATABASE_URL=
```

Jika menggunakan variable Neon tambahan, ikuti existing repository.

Gunakan:

```text
.env.local
```

untuk development.

Gunakan Vercel Environment Variables untuk production.

---

## 26. Authentication

Project merupakan aplikasi admin.

Jika authentication sudah tersedia, jangan diganti.

Jika belum tersedia dan nantinya diminta:

authentication harus membatasi dashboard hanya untuk:

```text
Admin / authorized operator
```

Jangan membuat sistem authentication baru tanpa mengecek repository terlebih dahulu.

---

## 27. Error Handling

Operasional laundry tidak boleh rusak hanya karena satu request gagal.

Contoh:

```text
Failed creating transaction
→ show clear error
→ do not incorrectly mark machine IN_USE
```

Contoh:

```text
Failed completing transaction
→ keep current state
→ allow retry
```

Database updates yang saling terkait harus konsisten.

---

## 28. Recommended Transaction Safety

Jika assignment machine dan transaction dilakukan bersama:

idealnya gunakan database transaction jika stack mendukung.

Contoh:

```text
Create transaction
+
Assign machine IN_USE
```

Jika salah satu gagal, hindari state seperti:

```text
Transaction created
but
Machine still AVAILABLE
```

atau sebaliknya.

---

## 29. Recommended Status Model

Gunakan existing status jika sudah ada.

Jika belum, konsep umum:

### Transaction

```text
PENDING
IN_PROGRESS
COMPLETED
CANCELLED
```

### Machine

```text
AVAILABLE
IN_USE
MAINTENANCE
OFFLINE
```

Jangan mengganti existing enum hanya untuk mengikuti contoh ini.

---

## 30. Development Priority

Urutan prioritas:

### Priority 1
Pastikan fitur yang sudah ada tetap stabil.

### Priority 2
Sempurnakan halaman mesin.

### Priority 3
Pastikan timer otomatis benar.

### Priority 4
Pastikan state mesin ↔ transaksi konsisten.

### Priority 5
Sempurnakan halaman operasional.

### Priority 6
Sempurnakan riwayat transaksi.

### Priority 7
Sempurnakan dashboard admin.

### Priority 8
Authentication/admin security jika diperlukan.

### Priority 9
Reporting dan analytics.

---

## 31. Recommended Future Features

Hanya implementasikan jika diminta.

Potential future features:

- laporan harian
- laporan mingguan
- laporan bulanan
- pendapatan
- jumlah order
- pemakaian mesin
- maintenance mesin
- export Excel / CSV
- printable receipt
- customer database
- notification ketika mesin selesai

Jangan langsung mengimplementasikan semuanya.

---

## 32. Next AI / Developer Audit

Ketika repository diberikan kepada AI / developer baru:

**JANGAN LANGSUNG CODING.**

Lakukan:

```text
PROJECT AUDIT

1. Current technology stack
2. Folder structure
3. Database schema
4. Existing pages
5. Existing machine implementation
6. Existing transaction implementation
7. Timer implementation
8. Service/pricing implementation
9. API routes
10. Completed features
11. Bugs / technical issues
12. Recommended next task
```

Setelah audit baru lanjut development.

---

## 33. Locked Decisions

Keputusan berikut dianggap **LOCKED** sampai ada instruksi baru:

- Project adalah web application untuk admin.
- Bukan customer app.
- Operasional dan riwayat transaksi dipisahkan.
- Halaman mesin memiliki fungsi sendiri.
- Remaining machine time harus berkurang otomatis.
- Timer tidak boleh reset setelah refresh.
- Layanan Cuci + Dryer = Rp35.000 per 7 kg.
- Project menggunakan / diarahkan menggunakan Neon PostgreSQL.
- Project sudah dideploy / diarahkan menggunakan Vercel.
- Jangan menggabungkan semua halaman menjadi satu.
- Jangan membangun ulang fitur yang sudah bekerja.

---

## 34. Current Development Philosophy

Workflow yang benar:

```text
READ
↓
AUDIT
↓
UNDERSTAND
↓
PRESERVE
↓
FIX
↓
CONTINUE
↓
TEST
↓
COMMIT
↓
DEPLOY
```

Bukan:

```text
DELETE
↓
REBUILD EVERYTHING
```

---

## 35. Final Instruction

This is an existing Admin Laundry project.

Treat the latest repository as the source of truth.

Preserve all working functionality and locked decisions.

Continue development incrementally toward a stable, production-ready laundry administration system.

Before any major change, understand how the existing implementation works.
