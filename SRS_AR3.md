&nbsp;

**SOFTWARE**

**REQUIREMENTS**

**SPECIFICATION**

**Sistem Piutang Usaha**

(Account Receivable System)

**Perhotelan**

Version 1.0

\[diterima / ditolak\]

&nbsp;

IT \- Software

**PT. Galesong Pratama**

**DAFTAR ISI**

&nbsp;

&nbsp;

# **BAB I** **PENDAHULUAN**

## **1.1 Tujuan**

Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL) atau Software Requirements Specification (SRS) ini disusun sebagai acuan formal dalam pengembangan perangkat lunak Sistem Piutang Usaha (Account Receivable System) untuk lingkungan operasional perhotelan. Dokumen ini memaparkan kebutuhan fungsional maupun non-fungsional yang harus dipenuhi oleh sistem, sehingga dapat menjadi dasar kesepahaman antara pihak pengembang dan pihak pengguna.

Tujuan utama penyusunan dokumen ini adalah:

* Mendefinisikan secara lengkap dan tidak ambigu kebutuhan perangkat lunak yang akan dibangun.

* Menjadi dasar acuan pada tahap perancangan, implementasi, serta pengujian (verifikasi dan validasi) sistem.

* Menjadi dokumen rujukan dalam pengelolaan perubahan kebutuhan (requirement change management) selama siklus hidup pengembangan.

* Menjadi media komunikasi teknis yang baku antara seluruh pemangku kepentingan proyek.

Adapun audiens yang menjadi sasaran dokumen ini meliputi:

* Manajemen hotel dan bagian keuangan selaku pemilik proses bisnis dan penerima manfaat sistem.

* System Analyst dan Software Engineer selaku perancang dan pembangun sistem.

* Quality Assurance (QA) selaku pelaksana pengujian berbasis kebutuhan.

* Pengguna akhir, yakni staf penagihan piutang (User), Manager, Admin, dan Viewer, sebagai pihak yang memvalidasi kesesuaian alur kerja sistem.

* Dosen pembimbing serta penguji sebagai pihak evaluator akademik.

Secara umum, ruang lingkup proyek mencakup pembangunan prototipe sistem piutang usaha yang mampu mencatat invoice kepada pelanggan, menghitung pajak dan potongan uang muka, mencatat pembayaran (termasuk pembayaran bertahap), serta memantau umur piutang melalui laporan aging.

## **1.2 Ruang Lingkup**

Sistem Piutang Usaha merupakan perangkat lunak berbasis web yang berfungsi sebagai modul pengelolaan piutang pada lingkungan operasional hotel. Sistem menghimpun seluruh tagihan (invoice) yang diterbitkan kepada pelanggan, mencatat pembayaran yang diterima, dan mengalokasikannya ke invoice terkait, sehingga posisi piutang setiap pelanggan dapat dipantau secara akurat dan terpusat.

Batasan yang termasuk di dalam ruang lingkup sistem (in scope):

* Pengelolaan data pelanggan, termasuk identitas perorangan (NIK) dan identitas perpajakan (NPWP).

* Pembuatan invoice beserta rincian item, dengan perhitungan otomatis subtotal, PPN, PPh, dan potongan uang muka (DP).

* Pengelolaan siklus status invoice: Draft, Issued, Partially Paid, Paid, Overdue, dan Cancelled.

* Pencatatan pembayaran dengan berbagai metode dan kanal pembayaran, termasuk pembayaran bertahap (termin/installment) atas satu invoice.

* Pengalokasian pembayaran ke invoice beserta pembaruan sisa tagihan dan status invoice.

* Pengelolaan data rekening bank penerima pembayaran.

* Penyajian laporan Aging Report.

* Pencetakan dan export invoice ke dalam format PDF.

* Manajemen hak akses pengguna berdasarkan role (role-based access control) dan pencatatan log aktivitas.

Batasan yang tidak termasuk di dalam ruang lingkup sistem (out of scope):

* Modul akuntansi dan pembukuan lengkap (general ledger, jurnal, neraca).

* Integrasi dengan sistem perpajakan pemerintah (misalnya penerbitan e-Faktur dan pelaporan pajak otomatis).

* Rekonsiliasi mutasi rekening bank secara otomatis.

* Pemrosesan pembayaran secara langsung; sistem hanya mencatat hasil transaksi yang diproses oleh bank, penyedia e-wallet, atau payment gateway pihak ketiga.

* Pengiriman pengingat tagihan (dunning) otomatis melalui surel, pesan singkat, atau aplikasi pesan.

* Dukungan multi-currency.

* Fungsi modul lain di luar pengelolaan piutang, seperti reservasi, POS outlet, dan penagihan tamu.

## **1.3 Definisi, Akronim, dan Singkatan**

Berikut adalah daftar istilah, akronim, dan singkatan yang digunakan secara konsisten di dalam dokumen ini.

**Tabel 1.3.1 Daftar Istilah, Akronim, dan Singkatan**

| Istilah / Akronim | Definisi |
| ----- | ----- |
| **SRS / SKPL** | Software Requirements Specification atau Spesifikasi Kebutuhan Perangkat Lunak, yaitu dokumen yang memuat seluruh kebutuhan perangkat lunak yang akan dibangun. |
| **AR** | Account Receivable atau Piutang Usaha, yaitu hak tagih hotel kepada pelanggan atas barang atau jasa yang telah diserahkan namun belum dibayar. |
| **Pelanggan (Customer)** | Pihak perorangan atau badan usaha yang menerima invoice dari hotel dan berkewajiban melakukan pembayaran. |
| **Invoice** | Dokumen tagihan yang diterbitkan hotel kepada pelanggan, memuat rincian item, pajak, dan nilai yang harus dibayar. |
| **Rincian Invoice (Invoice Detail)** | Baris-baris item barang atau jasa pada sebuah invoice, masing-masing memuat deskripsi, kuantitas, jenis, dan harga. |
| **Subtotal** | Jumlah seluruh total harga item pada sebuah invoice sebelum pajak dan potongan. |
| **PPN** | Pajak Pertambahan Nilai, yaitu pajak yang dikenakan atas penyerahan barang atau jasa kena pajak. |
| **PPh** | Pajak Penghasilan, yaitu pajak atas penghasilan yang, pada kondisi tertentu, dipotong atau dipungut atas transaksi yang ditagihkan. |
| **NIK** | Nomor Induk Kependudukan, yaitu nomor identitas kependudukan perorangan. |
| **NPWP** | Nomor Pokok Wajib Pajak, yaitu nomor identitas perpajakan perorangan atau badan usaha. |
| **Uang Muka / DP** | Down Payment, yaitu pembayaran yang diterima di muka dari pelanggan sebelum invoice diterbitkan atau dilunasi, yang kemudian dipotongkan dari tagihan. |
| **Potongan DP (dp\_deduction)** | Nilai uang muka yang dikurangkan dari total tagihan pada sebuah invoice. |
| **Tanggal Jatuh Tempo (Due Date)** | Batas tanggal pembayaran invoice yang disepakati antara hotel dan pelanggan. |
| **Sisa Tagihan (Outstanding)** | Selisih antara total tagihan invoice dan jumlah seluruh pembayaran yang telah dialokasikan ke invoice tersebut. |
| **Pembayaran Bertahap (Installment)** | Pelunasan satu invoice melalui lebih dari satu kali pembayaran. |
| **Alokasi Pembayaran** | Proses penetapan sebagian atau seluruh nominal sebuah pembayaran untuk melunasi invoice tertentu. |
| **Metode Pembayaran** | Kategori pembayaran tingkat tinggi, misalnya Bank Transfer, Virtual Account, E-Wallet, QRIS, Kartu Kredit, dan Tunai. |
| **Kanal Pembayaran** | Platform spesifik yang digunakan pada suatu metode pembayaran, misalnya BCA Virtual Account, Mandiri, GoPay, OVO, ShopeePay, atau Midtrans. |
| **Virtual Account** | Nomor rekening virtual yang dibuat oleh bank untuk menerima pembayaran dan dikaitkan dengan tagihan tertentu. |
| **QRIS** | Quick Response Code Indonesian Standard, yaitu standar kode QR pembayaran nasional di Indonesia. |
| **Payment Gateway** | Layanan pihak ketiga yang memfasilitasi pemrosesan pembayaran elektronik. |
| **Aging Report** | Pengelompokan piutang berdasarkan umur atau keterlambatan terhadap tanggal jatuh tempo. |
| **Draft** | Status invoice yang sedang disusun dan belum diterbitkan. |
| **Issued** | Status invoice yang telah diterbitkan dan belum menerima pembayaran. |
| **Partially Paid** | Status invoice yang telah menerima pembayaran sebagian, namun masih memiliki sisa tagihan. |
| **Paid** | Status invoice yang telah dibayar lunas. |
| **Overdue** | Status invoice yang telah melewati tanggal jatuh tempo dan masih memiliki sisa tagihan. |
| **Cancelled** | Status invoice yang dibatalkan dan tidak lagi dihitung sebagai piutang. |
| **RBAC** | Role-Based Access Control, yaitu mekanisme pembatasan hak akses pengguna berdasarkan role. |
| **Log Aktivitas (Audit Trail)** | Catatan kronologis tindakan penting yang dilakukan pengguna di dalam sistem. |
| **Aktor** | Entitas, baik manusia maupun sistem, yang berinteraksi secara langsung dengan batasan sistem. |
| **ERD** | Entity Relationship Diagram, yaitu diagram yang menggambarkan relasi antarentitas data pada database. |
| **UAT** | User Acceptance Test, yaitu pengujian penerimaan yang dilakukan oleh pengguna akhir. |

# **BAB II** **DESKRIPSI UMUM PERANGKAT LUNAK**

## **2.1 Perspektif Produk**

Sistem Piutang Usaha merupakan modul tersendiri pada lingkungan operasional hotel yang berfungsi sebagai lapisan pengelolaan piutang (receivable layer), yaitu menangani tagihan berjangka (invoice) kepada pelanggan beserta pembayarannya.

Secara arsitektural, sistem dirancang menggunakan pendekatan client-server dengan database terpusat yang diakses melalui Local Area Network (LAN) hotel. Keterkaitan sistem dengan komponen lain adalah sebagai berikut:

* Bank, penyedia e-wallet, dan payment gateway: bersifat pihak ketiga; sistem hanya mencatat hasil pembayaran beserta nomor referensinya (reference\_no).

Dengan posisi tersebut, sistem berfungsi sebagai sumber tunggal (single source of truth) atas posisi piutang hotel yang menggantikan pencatatan manual, serta menekan risiko tagihan yang terlambat ditindaklanjuti atau tidak tertagih.

## **2.2 Fungsi Produk**

Secara garis besar, sistem menyediakan fungsi-fungsi utama sebagai berikut:

* **Manajemen Pelanggan:** mencatat dan memelihara data identitas pelanggan, termasuk NIK dan NPWP.

* **Pembuatan Invoice:** menyusun invoice beserta rincian item untuk seorang pelanggan.

* **Perhitungan Otomatis:** menghitung total harga item, subtotal, PPN, PPh, dan total tagihan.

* **Potongan Uang Muka Otomatis:** menerapkan uang muka pelanggan sebagai pengurang tagihan (dp\_deduction).

* **Siklus Status Invoice:** mengelola perpindahan status Draft, Issued, Partially Paid, Paid, Overdue, dan Cancelled.

* **Pencatatan Pembayaran:** mencatat pembayaran berdasarkan metode, kanal, nomor referensi, biaya administrasi, dan rekening bank penerima.

* **Pembayaran Bertahap (Installment):** memungkinkan satu invoice dilunasi melalui beberapa kali pembayaran.

* **Alokasi Pembayaran:** menghubungkan pembayaran dengan invoice dan memperbarui sisa tagihan.

* **Pemantauan Jatuh Tempo:** menandai invoice yang melewati tanggal jatuh tempo sebagai Overdue.

* **Laporan Aging Report:** menyajikan umur piutang per pelanggan dan per invoice.

* **Cetak dan Export PDF:** menghasilkan dokumen invoice yang siap dicetak atau dikirimkan.

* **Manajemen Rekening Bank:** mengelola daftar rekening penerima pembayaran.

* **Manajemen Hak Akses dan Log Aktivitas:** membatasi kewenangan pengguna sesuai role serta merekam aktivitas penting.

## **2.3 Karakteristik Pengguna**

Sistem ini ditujukan bagi empat kategori pengguna dengan karakteristik sebagai berikut.&nbsp;

**Tabel 2.3.1 Karakteristik Pengguna**

| Kategori Pengguna | Kewenangan pada Sistem |
| :---- | :---- |
| **Admin** | Akses penuh terhadap seluruh fungsi, termasuk mengelola akun pengguna dan role, rekening bank, serta melihat log aktivitas. |
| **User (Staf AR)** | Mengelola data pelanggan, membuat dan mengubah invoice Draft, menerbitkan invoice, mencatat dan mengalokasikan pembayaran, mencetak/mengexport invoice, serta melihat laporan aging. |
| **Manager** | Seluruh kewenangan User ditambah kewenangan persetujuan (approve), misalnya atas penerbitan dan pembatalan invoice, serta melihat log aktivitas. |
| **Viewer** | Hanya melihat (read-only) data invoice, pembayaran, dan laporan; tidak dapat menambah, mengubah, atau menghapus data. |

&nbsp;

## **2.4 Keterbatasan**

Dalam pengembangan dan pengoperasiannya, sistem memiliki sejumlah keterbatasan sebagai berikut:

* **Keterbatasan Hardware:** sistem dirancang untuk berjalan pada komputer pengguna dengan spesifikasi minimum prosesor dual core, RAM 4 GB, serta resolusi layar minimal 1366 × 768 piksel. Pencetakan invoice mensyaratkan printer berukuran kertas A4 atau aplikasi pembaca PDF.

* **Keterbatasan Network:** seluruh fungsi sistem bergantung pada ketersediaan LAN hotel dan koneksi ke server (server). Apabila koneksi terputus, pencatatan invoice dan pembayaran tidak dapat dilakukan.

* **Keterbatasan Kewenangan Akses:** setiap pengguna hanya dapat mengakses fungsi sesuai role-nya. Pengguna dengan role Viewer tidak dapat mengubah data, dan tindakan yang memerlukan persetujuan hanya dapat dilakukan oleh pengguna dengan role Manager.

* **Keterbatasan Integrasi Pembayaran:** sistem tidak memproses atau memverifikasi pembayaran secara mandiri. Pembayaran melalui bank, Virtual Account, e-wallet, QRIS, maupun payment gateway dicatat oleh pengguna beserta nomor referensinya.

* **Keterbatasan Ketentuan Perpajakan:** tarif dan aturan penerapan PPN dan PPh dapat berubah mengikuti peraturan perundang-undangan.

* **Keterbatasan Data Historis:** prototipe ini tidak mencakup migrasi data piutang dan pembayaran historis dari sistem terdahulu.

* **Keterbatasan Bahasa dan Mata Uang:** interface sistem disajikan dalam bahasa Indonesia dengan satuan mata uang Rupiah (IDR) tanpa dukungan multi-currency.

* **Keterbatasan Software License:** pengembangan menggunakan software open source sehingga tidak tersedia dukungan teknis berbayar dari vendor.

# **BAB III** **PEMODELAN SISTEM**

## **3.1 Definisi Aktor**

Bagian ini menjelaskan entitas yang berinteraksi langsung dengan batasan sistem (system boundary).

**Tabel 3.1.1 Definisi Aktor**

| No. | Aktor | Deskripsi |
| :---: | ----- | ----- |
| 1 | Admin | Pengguna dengan kewenangan penuh yang mengelola akun pengguna, role, dan master data rekening bank, serta dapat melihat log aktivitas. |
| 2 | User (Staf AR) | Staf keuangan hotel yang bertugas mengelola data pelanggan, membuat dan menerbitkan invoice, mencatat pembayaran, mengalokasikannya ke invoice, serta menyajikan dan mencetak dokumen penagihan. |
| 3 | Manager | Pengguna dengan seluruh kewenangan User ditambah kewenangan persetujuan (approve), termasuk membatalkan invoice dan melihat log aktivitas. |
| 4 | Viewer | Pengguna dengan akses hanya-baca (read-only) terhadap data invoice, pembayaran, dan laporan. |
| 5 | Sistem | Entitas non-manusia berupa sistem piutang usaha yang berjalan di background untuk menghitung nominal, memperbarui status invoice, mendeteksi jatuh tempo, dan mencatat log aktivitas secara otomatis. |

&nbsp;

## **3.2 Use Case Diagram**

Use case diagram menggambarkan interaksi antara aktor dan fungsi sistem. Daftar use case beserta aktor dan relasinya dirangkum pada Tabel 3.2.1 sebagai acuan penggambaran diagram.

*\[Ruang untuk Use Case Diagram Sistem Piutang Usaha\]*

*Gambar 3.1 Use Case Diagram Sistem Piutang Usaha*

**Tabel 3.2.1 Daftar Use Case**

| Kode | Nama Use Case | Aktor | Relasi |
| :---: | ----- | ----- | ----- |
| UC-01 | Kelola Data Pelanggan | Admin, User, Manager | — |
| UC-02 | Buat Invoice | User, Manager | \<\<include\>\> UC-12, UC-13 |
| UC-03 | Terbitkan Invoice | User, Manager | \<\<extend\>\> dari UC-02 |
| UC-04 | Batalkan Invoice | Manager | — |
| UC-05 | Catat Pembayaran | User, Manager | \<\<include\>\> UC-06 |
| UC-06 | Alokasikan Pembayaran ke Invoice | User, Manager | \<\<include\>\> UC-14 |
| UC-07 | Kelola Rekening Bank | Admin | — |
| UC-08 | Cetak / Export Invoice PDF | Admin, User, Manager | — |
| UC-09 | Lihat Laporan Aging Report | Admin, User, Manager, Viewer | — |
| UC-10 | Kelola Pengguna dan Role | Admin | — |
| UC-11 | Lihat Log Aktivitas | Admin, Manager | — |
| UC-12 | Hitung Nominal Invoice | Sistem | Di-\<\<include\>\> oleh UC-02 |
| UC-13 | Terapkan Potongan Uang Muka | Sistem | Di-\<\<include\>\> oleh UC-02 |
| UC-14 | Perbarui Status Invoice | Sistem | Di-\<\<include\>\> oleh UC-06 |
| UC-15 | Deteksi Jatuh Tempo | Sistem | — |
| UC-16 | Catat Log Aktivitas | Sistem | Dipicu oleh seluruh use case |

&nbsp;

## **3.3 Skenario Use Case (Use Case Description)**

Bagian ini mendeskripsikan alur jalannya setiap fungsi di dalam sistem.

**UC-01: Kelola Data Pelanggan**

| Aktor Utama | User (juga dapat dilakukan oleh Admin dan Manager) |
| :---- | :---- |
| **Deskripsi Singkat** | Proses pencatatan dan pemeliharaan data identitas pelanggan yang akan menerima invoice. |
| **Kondisi Awal** | Pengguna telah masuk (login) ke dalam sistem. |
| **Kondisi Akhir** | Data pelanggan tersimpan atau diperbarui di dalam sistem dan dapat dipilih pada pembuatan invoice. |
| **Relasi Tambahan** | Memicu UC-16 (Catat Log Aktivitas) |
| **Skenario Normal** | 1.User membuka menu Pelanggan dan memilih "Tambah Pelanggan". 2.User mengisi nama, alamat, nomor telepon, NIK, dan/atau NPWP pelanggan. 3.Sistem memvalidasi format dan keunikan NIK dan NPWP. 4.User menekan "Simpan". 5.Sistem menyimpan data pelanggan dan menampilkan notifikasi keberhasilan. |
| **Skenario Alternatif** | 3a.Jika NIK atau NPWP telah terdaftar, sistem menampilkan peringatan "Data Pelanggan Sudah Terdaftar" beserta data pelanggan yang sudah ada. 3b.Jika kolom wajib belum terisi atau format tidak sesuai, sistem menampilkan error message dan tidak menyimpan data. 5a.Pada pengubahan data, pelanggan yang telah memiliki invoice tidak dapat dihapus; data hanya dapat diperbarui. |

&nbsp;

**UC-02: Buat Invoice**

| Aktor Utama | User (juga dapat dilakukan oleh Manager) |
| :---- | :---- |
| **Deskripsi Singkat** | Proses penyusunan invoice baru kepada pelanggan beserta rincian item, pajak, dan potongan uang muka. |
| **Kondisi Awal** | Pengguna telah login dan data pelanggan yang ditagih sudah terdaftar. |
| **Kondisi Akhir** | Invoice tersimpan dengan status Draft, memiliki nomor invoice unik, dan seluruh nominal telah terhitung. |
| **Relasi Tambahan** | \<\<include\>\> Hitung Nominal Invoice (UC-12), \<\<include\>\> Terapkan Potongan Uang Muka (UC-13), dapat di-\<\<extend\>\> oleh Terbitkan Invoice (UC-03) |
| **Skenario Normal** | 1.User membuka menu Invoice dan memilih "Buat Invoice". 2.User memilih pelanggan. 3.User mengisi jenis invoice, tanggal invoice, dan tanggal jatuh tempo. 4.User menambahkan satu atau lebih rincian item (deskripsi, kuantitas, jenis item, dan harga). 5.Sistem melakukan \<\<include\>\> Hitung Nominal Invoice (UC-12) dan menampilkan subtotal, PPN, PPh, serta total. 6.Sistem melakukan \<\<include\>\> Terapkan Potongan Uang Muka (UC-13) apabila pelanggan memiliki uang muka yang dapat dipotongkan. 7.User meninjau ringkasan invoice dan menekan "Simpan". 8.Sistem membuat secara otomatis nomor invoice, menyimpan invoice dengan status Draft, dan mencatat pengguna pembuat. |
| **Skenario Alternatif** | 3a.Jika tanggal jatuh tempo lebih awal dari tanggal invoice, sistem menampilkan peringatan dan meminta User memperbaiki tanggal. 7a.Jika belum terdapat satu pun rincian item, sistem tidak mengizinkan invoice disimpan. 7b.User dapat mengubah atau menghapus rincian item selama invoice masih berstatus Draft; sistem menghitung ulang seluruh nominal. |

&nbsp;

**UC-03: Terbitkan Invoice**

| Aktor Utama | User, Manager |
| :---- | :---- |
| **Deskripsi Singkat** | Proses menerbitkan invoice Draft sehingga menjadi tagihan resmi yang berlaku kepada pelanggan. |
| **Kondisi Awal** | Terdapat invoice berstatus Draft yang seluruh datanya telah lengkap. |
| **Kondisi Akhir** | Invoice berstatus Issued dan tidak dapat diubah isinya. |
| **Relasi Tambahan** | \<\<extend\>\> dari Buat Invoice (UC-02). |
| **Skenario Normal** | 1.Aktor membuka daftar invoice dan memilih invoice berstatus Draft. 2.Aktor memeriksa rincian dan menekan "Terbitkan". 3.Sistem menampilkan dialog konfirmasi. 4.Aktor mengonfirmasi penerbitan. 5.Sistem memvalidasi kelengkapan data invoice. 6.Sistem mengubah status invoice menjadi Issued dan mencatat log aktivitas. |
| **Skenario Alternatif** | 2a.Jika alur persetujuan diaktifkan dan Aktor adalah User, sistem mengajukan invoice kepada Manager dan status baru berubah menjadi Issued setelah Manager menyetujui. 5a.Jika validasi gagal (misalnya subtotal bernilai nol), sistem menampilkan error message dan invoice tetap berstatus Draft. |

&nbsp;

**UC-04: Batalkan Invoice**

| Aktor Utama | Manager |
| :---- | :---- |
| **Deskripsi Singkat** | Proses pembatalan invoice yang diterbitkan atau disusun secara keliru atau tidak jadi berlaku. |
| **Kondisi Awal** | Terdapat invoice berstatus Draft atau Issued yang belum memiliki pembayaran teralokasi. |
| **Kondisi Akhir** | Invoice berstatus Cancelled dan tidak lagi dihitung sebagai piutang. |
| **Relasi Tambahan** | Memicu UC-16 (Catat Log Aktivitas) |
| **Skenario Normal** | 1.Manager membuka detail invoice yang akan dibatalkan. 2.Manager menekan "Batalkan Invoice". 3.Sistem meminta alasan pembatalan. 4.Manager mengisi alasan dan mengonfirmasi pembatalan. 5.Sistem mengubah status invoice menjadi Cancelled dan mencatat alasan serta pengguna pada log aktivitas. |
| **Skenario Alternatif** | 2a.Jika invoice telah memiliki pembayaran teralokasi, sistem menolak pembatalan dan menampilkan peringatan "Invoice Memiliki Pembayaran". 4a.Jika alasan pembatalan tidak diisi, sistem tidak melanjutkan proses. |

&nbsp;

**UC-05: Catat Pembayaran**

| Aktor Utama | User (juga dapat dilakukan oleh Manager) |
| :---- | :---- |
| **Deskripsi Singkat** | Proses pencatatan pembayaran yang diterima dari pelanggan, baik pelunasan, pembayaran sebagian (installment), maupun uang muka. |
| **Kondisi Awal** | Pelanggan telah terdaftar. Untuk pelunasan atau installment, pelanggan memiliki invoice berstatus Issued, Partially Paid, atau Overdue. |
| **Kondisi Akhir** | Pembayaran tersimpan, dialokasikan ke invoice terkait, dan status serta sisa tagihan invoice diperbarui. |
| **Relasi Tambahan** | \<\<include\>\> Alokasikan Pembayaran ke Invoice (UC-06) |
| **Skenario Normal** | 1.User membuka menu Pembayaran dan memilih "Catat Pembayaran". 2.User memilih pelanggan. 3.User mengisi tanggal pembayaran, nominal, metode pembayaran, kanal pembayaran, nomor referensi, biaya administrasi (jika ada), dan rekening bank penerima. 4.Sistem menampilkan daftar invoice pelanggan yang masih memiliki sisa tagihan. 5.Sistem melakukan \<\<include\>\> Alokasikan Pembayaran ke Invoice (UC-06). 6.User meninjau ringkasan dan menekan "Simpan". 7.Sistem menyimpan pembayaran beserta alokasinya dalam satu transaksi database dan menampilkan notifikasi keberhasilan. |
| **Skenario Alternatif** | 3a.Jika metode pembayaran adalah Tunai, kanal dan nomor referensi tidak wajib diisi. 3b.Jika kanal yang dipilih tidak sesuai dengan metode pembayaran, sistem menampilkan error message. 4a.Jika pembayaran merupakan uang muka dan belum ada invoice, User menyimpan pembayaran tanpa alokasi; pembayaran dapat dimanfaatkan sebagai potongan DP pada invoice berikutnya. 5a.Jika pelanggan ingin membayar beberapa invoice sekaligus, User mengalokasikan nominal ke setiap invoice yang dipilih. |

&nbsp;

**UC-06: Alokasikan Pembayaran ke Invoice**

| Aktor Utama | User (juga dapat dilakukan oleh Manager) |
| :---- | :---- |
| **Deskripsi Singkat** | Proses penetapan nominal pembayaran untuk melunasi seluruh atau sebagian sisa tagihan sebuah invoice. |
| **Kondisi Awal** | Pembayaran sedang dicatat pada UC-05 dan terdapat invoice dengan sisa tagihan pada pelanggan yang sama. |
| **Kondisi Akhir** | Data alokasi (nominal dan urutan pembayaran) tersimpan dan sisa tagihan invoice berkurang. |
| **Relasi Tambahan** | \<\<include\>\> dari Catat Pembayaran (UC-05), \<\<include\>\> Perbarui Status Invoice (UC-14) |
| **Skenario Normal** | 1.Sistem menampilkan invoice milik pelanggan yang memiliki sisa tagihan beserta jumlah sisanya. 2.User memilih invoice yang akan dibayar. 3.User memasukkan nominal yang dialokasikan pada invoice tersebut. 4.Sistem menetapkan urutan pembayaran (installment ke-n) untuk invoice tersebut secara otomatis. 5.Sistem memvalidasi nominal alokasi. 6.Sistem melakukan \<\<include\>\> Perbarui Status Invoice (UC-14). |
| **Skenario Alternatif** | 5a.Jika total alokasi melebihi nominal pembayaran, sistem menolak alokasi dan meminta User menyesuaikan angka. 5b.Jika nominal alokasi melebihi sisa tagihan invoice, sistem menolak alokasi dan menampilkan sisa tagihan yang berlaku. 5c.Jika masih terdapat sisa nominal pembayaran yang belum dialokasikan, sisa tersebut tetap tercatat pada pembayaran. |

&nbsp;

**UC-07: Kelola Rekening Bank**

| Aktor Utama | Admin |
| :---- | :---- |
| **Deskripsi Singkat** | Proses pengelolaan daftar rekening bank hotel yang menjadi tujuan penerimaan pembayaran. |
| **Kondisi Awal** | Admin telah login ke dalam sistem. |
| **Kondisi Akhir** | Data rekening bank tersimpan atau diperbarui dan dapat dipilih pada pencatatan pembayaran. |
| **Relasi Tambahan** | Memicu UC-16 (Catat Log Aktivitas) |
| **Skenario Normal** | 1.Admin membuka menu Rekening Bank dan memilih "Tambah Rekening". 2.Admin mengisi nama bank, nomor rekening, dan nama pemilik rekening. 3.Sistem memvalidasi kelengkapan dan keunikan nomor rekening. 4.Admin menekan "Simpan". 5.Sistem menyimpan data rekening bank. |
| **Skenario Alternatif** | 3a.Jika nomor rekening pada bank yang sama telah terdaftar, sistem menampilkan peringatan dan tidak menyimpan data. 5a.Rekening bank yang telah digunakan pada pembayaran tidak dapat dihapus; data hanya dapat diperbarui. |

&nbsp;

**UC-08: Cetak / Export Invoice PDF**

| Aktor Utama | User, Manager, Admin |
| :---- | :---- |
| **Deskripsi Singkat** | Proses menghasilkan dokumen invoice dalam format PDF untuk dicetak atau dikirimkan kepada pelanggan. |
| **Kondisi Awal** | Invoice telah tersimpan di dalam sistem. |
| **Kondisi Akhir** | Berkas PDF invoice dihasilkan dan dapat diunduh atau dicetak. |
| **Relasi Tambahan** | Memicu UC-16 (Catat Log Aktivitas) |
| **Skenario Normal** | 1.Aktor membuka detail invoice. 2.Aktor menekan "Cetak / Export PDF". 3.Sistem menyusun dokumen yang memuat identitas pelanggan (nama, alamat, NPWP), nomor dan tanggal invoice, tanggal jatuh tempo, rincian item, subtotal, PPN, PPh, potongan DP, dan total tagihan. 4.Sistem menampilkan preview dokumen. 5.Aktor mengunduh atau mencetak dokumen. |
| **Skenario Alternatif** | 3a.Untuk invoice berstatus Draft, dokumen diberi penanda "DRAFT"; untuk invoice berstatus Cancelled, dokumen diberi penanda "DIBATALKAN". |

&nbsp;

**UC-09: Lihat Laporan Aging Report**

| Aktor Utama | Admin, User, Manager, Viewer |
| :---- | :---- |
| **Deskripsi Singkat** | Proses menampilkan posisi piutang yang dikelompokkan berdasarkan umur relatif terhadap tanggal jatuh tempo. |
| **Kondisi Awal** | Terdapat invoice yang masih memiliki sisa tagihan. |
| **Kondisi Akhir** | Laporan Aging Report ditampilkan sesuai as-of date dan filter yang dipilih. |
| **Relasi Tambahan** | — |
| **Skenario Normal** | 1.Aktor membuka menu Laporan dan memilih "Aging Report". 2.Aktor menentukan as-of date (default: hari ini) dan, bila perlu, memfilter pelanggan. 3.Sistem menghitung sisa tagihan setiap invoice berstatus Issued, Partially Paid, atau Overdue. 4.Sistem mengelompokkan sisa tagihan ke dalam aging bucket (Belum Jatuh Tempo, 1–30, 31–60, 61–90, dan lebih dari 90 hari). 5.Sistem menampilkan rekapitulasi per pelanggan beserta total setiap aging bucket. 6.Aktor dapat memilih pelanggan untuk melihat rincian invoice yang menyusun angka tersebut. |
| **Skenario Alternatif** | 3a.Jika tidak terdapat piutang pada as-of date, sistem menampilkan pesan "Tidak Ada Piutang". |

&nbsp;

**UC-10: Kelola Pengguna dan Role**

| Aktor Utama | Admin |
| :---- | :---- |
| **Deskripsi Singkat** | Proses pengelolaan akun pengguna sistem beserta role dan hak aksesnya. |
| **Kondisi Awal** | Admin telah login ke dalam sistem. |
| **Kondisi Akhir** | Akun pengguna tersimpan atau diperbarui beserta role-nya. |
| **Relasi Tambahan** | Memicu UC-16 (Catat Log Aktivitas) |
| **Skenario Normal** | 1.Admin membuka menu Pengguna dan memilih "Tambah Pengguna". 2.Admin mengisi username, password awal, dan role (Admin, User, Manager, atau Viewer). 3.Sistem memvalidasi keunikan username dan kekuatan password. 4.Admin menekan "Simpan". 5.Sistem menyimpan akun dengan password dalam bentuk encrypted. |
| **Skenario Alternatif** | 3a.Jika username sudah digunakan, sistem menampilkan error message. 5a.Admin dapat mengubah role pengguna atau mengatur ulang password; perubahan dicatat pada log aktivitas. |

&nbsp;

**UC-11: Lihat Log Aktivitas**

| Aktor Utama | Admin, Manager |
| :---- | :---- |
| **Deskripsi Singkat** | Proses penelusuran audit trail atas tindakan penting yang dilakukan pengguna. |
| **Kondisi Awal** | Pengguna dengan role Admin atau Manager telah login. |
| **Kondisi Akhir** | Daftar log aktivitas ditampilkan sesuai filter yang dipilih. |
| **Relasi Tambahan** | — |
| **Skenario Normal** | 1.Aktor membuka menu Log Aktivitas. 2.Aktor menentukan filter rentang waktu, pengguna, dan/atau jenis aktivitas. 3.Sistem menampilkan daftar log yang memuat waktu, pengguna, jenis aktivitas, dan keterangan. |
| **Skenario Alternatif** | 3a.Jika tidak ada log yang sesuai dengan filter, sistem menampilkan pesan "Data Tidak Ditemukan". 3b.Log aktivitas bersifat hanya-baca dan tidak dapat diubah atau dihapus oleh pengguna mana pun. |

&nbsp;

**UC-12 s.d. UC-16: Fungsi Background (Sistem)**

**Tabel 3.3.1 Fungsi Background Sistem**

| Kode Use Case | Nama Proses | Deskripsi Ringkas |
| :---: | ----- | ----- |
| UC-12 | Hitung Nominal Invoice | Setiap kali rincian item ditambah, diubah, atau dihapus, sistem menghitung total harga tiap baris (kuantitas × harga), subtotal, PPN, PPh, dan total tagihan secara otomatis. |
| UC-13 | Terapkan Potongan Uang Muka | Saat invoice dibuat, sistem memeriksa uang muka pelanggan yang telah dibayarkan dan belum dimanfaatkan, lalu menerapkannya secara otomatis sebagai potongan DP pada invoice. |
| UC-14 | Perbarui Status Invoice | Setelah alokasi pembayaran tersimpan, sistem menghitung sisa tagihan dan mengubah status invoice menjadi Partially Paid apabila masih tersisa, atau Paid apabila sisa tagihan nol. |
| UC-15 | Deteksi Jatuh Tempo | Melalui scheduled job setiap hari, sistem mengubah status invoice Issued atau Partially Paid menjadi Overdue apabila tanggal jatuh tempo telah terlewati dan sisa tagihan lebih dari nol. |
| UC-16 | Catat Log Aktivitas | Setiap tindakan penting (pembuatan, perubahan, penerbitan, pembatalan invoice; pencatatan pembayaran; perubahan pengguna) dicatat otomatis beserta pengguna, waktu, jenis aktivitas, dan keterangan. |

# **BAB IV** **KEBUTUHAN SPESIFIK**

## **4.1 Kebutuhan Fungsional**

Kebutuhan fungsional berikut diturunkan dari pemodelan use case pada Bab III dan dinyatakan dalam bentuk pernyataan "Sistem harus dapat ...".

**Tabel 4.1.1 Kebutuhan Fungsional**

| Kode | Pernyataan Kebutuhan Fungsional |
| :---: | ----- |
| SRS-F-01 | Sistem harus dapat mencatat data pelanggan yang meliputi nama, alamat, nomor telepon, NIK, dan NPWP. |
| SRS-F-02 | Sistem harus dapat memvalidasi format serta keunikan NIK dan NPWP pada data pelanggan. |
| SRS-F-03 | Sistem harus dapat mengubah data pelanggan dan mencegah penghapusan pelanggan yang telah memiliki invoice. |
| SRS-F-04 | Sistem harus dapat membuat invoice baru berstatus Draft yang terhubung dengan satu pelanggan dan pengguna pembuatnya. |
| SRS-F-05 | Sistem harus dapat membuat nomor invoice yang unik secara otomatis. |
| SRS-F-06 | Sistem harus dapat mencatat jenis invoice, tanggal invoice, tanggal jatuh tempo, dan sumber invoice pada setiap invoice. |
| SRS-F-07 | Sistem harus dapat mencatat satu atau lebih rincian item pada setiap invoice, meliputi deskripsi, kuantitas, jenis item, dan harga satuan. |
| SRS-F-08 | Sistem harus dapat menghitung total harga setiap rincian item sebagai hasil kali kuantitas dan harga satuan. |
| SRS-F-09 | Sistem harus dapat menghitung subtotal invoice sebagai jumlah total harga seluruh rincian item. |
| SRS-F-10 | Sistem harus dapat menghitung nilai PPN pada invoice sesuai ketentuan yang ditetapkan. |
| SRS-F-11 | Sistem harus dapat menghitung nilai PPh pada invoice sesuai ketentuan yang ditetapkan. |
| SRS-F-12 | Sistem harus dapat menghitung total tagihan dari subtotal, PPN, PPh, dan potongan DP, serta menghitung ulang secara otomatis setiap kali rincian invoice berubah. |
| SRS-F-13 | Sistem harus dapat menerapkan potongan uang muka (DP) pada invoice secara otomatis. |
| SRS-F-14 | Sistem harus dapat memvalidasi bahwa tanggal jatuh tempo tidak lebih awal dari tanggal invoice. |
| SRS-F-15 | Sistem harus dapat mengizinkan perubahan isi invoice hanya pada invoice berstatus Draft. |
| SRS-F-16 | Sistem harus dapat menerbitkan invoice sehingga statusnya berubah dari Draft menjadi Issued. |
| SRS-F-17 | Sistem harus dapat mendukung alur persetujuan Manager sebelum invoice diterbitkan atau dibatalkan apabila alur tersebut diaktifkan. |
| SRS-F-18 | Sistem harus dapat membatalkan invoice dengan status Cancelled hanya apabila belum terdapat pembayaran teralokasi, dan mewajibkan pengisian alasan pembatalan. |
| SRS-F-19 | Sistem harus dapat mengelola status invoice sesuai siklus Draft, Issued, Partially Paid, Paid, Overdue, dan Cancelled. |
| SRS-F-20 | Sistem harus dapat mencatat pembayaran yang meliputi pelanggan, nominal, tanggal, metode, kanal, nomor referensi, biaya administrasi, dan rekening bank penerima. |
| SRS-F-21 | Sistem harus dapat menyediakan pilihan metode pembayaran (misalnya Bank Transfer, Virtual Account, E-Wallet, QRIS, Kartu Kredit, dan Tunai) serta kanal pembayaran sebagai reference data yang dapat ditambah. |
| SRS-F-22 | Sistem harus dapat memastikan kanal pembayaran yang dipilih sesuai dengan metode pembayarannya. |
| SRS-F-23 | Sistem harus dapat menampilkan invoice milik pelanggan yang masih memiliki sisa tagihan pada saat pembayaran dialokasikan. |
| SRS-F-24 | Sistem harus dapat mengalokasikan nominal pembayaran ke invoice dengan mencatat jumlah yang dibayarkan. |
| SRS-F-25 | Sistem harus dapat mendukung pembayaran bertahap (installment) atas satu invoice dan mencatat urutan pembayaran pada setiap alokasi. |
| SRS-F-26 | Sistem harus dapat memvalidasi bahwa total alokasi tidak melebihi nominal pembayaran dan nominal alokasi tidak melebihi sisa tagihan invoice. |
| SRS-F-27 | Sistem harus dapat memastikan pembayaran hanya dialokasikan ke invoice milik pelanggan yang sama dengan pelanggan pada pembayaran. |
| SRS-F-28 | Sistem harus dapat menghitung sisa tagihan setiap invoice sebagai selisih total tagihan dan jumlah seluruh alokasi pembayaran. |
| SRS-F-29 | Sistem harus dapat mengubah status invoice secara otomatis menjadi Partially Paid atau Paid setelah alokasi pembayaran disimpan. |
| SRS-F-30 | Sistem harus dapat mengubah status invoice secara otomatis menjadi Overdue apabila tanggal jatuh tempo terlewati dan sisa tagihan masih ada. |
| SRS-F-31 | Sistem harus dapat mencatat pembayaran uang muka tanpa alokasi ke invoice tertentu. |
| SRS-F-32 | Sistem harus dapat mengelola data rekening bank yang meliputi nama bank, nomor rekening, dan nama pemilik rekening. |
| SRS-F-33 | Sistem harus dapat menyajikan laporan Aging Report yang dikelompokkan per aging bucket dan as-of date yang dipilih. |
| SRS-F-34 | Sistem harus dapat menampilkan sisa piutang per pelanggan beserta rincian invoice penyusunnya. |
| SRS-F-35 | Sistem harus dapat mencetak dan mengexport invoice ke dalam format PDF. |
| SRS-F-36 | Sistem harus dapat melakukan authentication terhadap pengguna menggunakan username dan password. |
| SRS-F-37 | Sistem harus dapat membatasi akses fungsi berdasarkan role pengguna (Admin, User, Manager, dan Viewer). |
| SRS-F-38 | Sistem harus dapat menyediakan pengelolaan akun pengguna beserta role-nya oleh Admin. |
| SRS-F-39 | Sistem harus dapat mencatat log aktivitas atas setiap tindakan penting yang meliputi identitas pengguna, waktu, jenis aktivitas, dan keterangan. |
| SRS-F-40 | Sistem harus dapat menampilkan log aktivitas dengan filter rentang waktu, pengguna, dan jenis aktivitas. |

&nbsp;

## **4.2 Kebutuhan Kinerja**

Kebutuhan kinerja ditetapkan untuk menjamin kelancaran operasional pada jam sibuk penagihan.

**Tabel 4.2.1 Kebutuhan Kinerja**

| Kode | Kebutuhan Kinerja | Metrik Target |
| :---: | ----- | ----- |
| SRS-P-01 | Waktu respons pencarian data pelanggan dan invoice. | Maksimal 2 detik untuk 95% permintaan. |
| SRS-P-02 | Waktu penyimpanan invoice beserta perhitungan nominal. | Maksimal 3 detik untuk invoice dengan maksimum 50 baris rincian. |
| SRS-P-03 | Waktu penyimpanan pembayaran beserta alokasi dan pembaruan status invoice. | Maksimal 3 detik hingga notifikasi keberhasilan ditampilkan. |
| SRS-P-04 | Waktu penyajian laporan Aging Report. | Maksimal 5 detik untuk hingga 10.000 invoice aktif. |
| SRS-P-05 | Waktu pembuatan file PDF invoice. | Maksimal 5 detik sejak tombol Cetak / Export PDF ditekan. |
| SRS-P-06 | Waktu page load interface. | Maksimal 3 detik pada LAN 100 Mbps. |
| SRS-P-07 | Jumlah pengguna serentak (concurrent user) yang didukung. | Minimal 10 pengguna aktif tanpa penurunan kinerja yang signifikan. |
| SRS-P-08 | Kapasitas penyimpanan data. | Mampu menampung minimal 50.000 invoice dan 250.000 baris rincian invoice per tahun. |
| SRS-P-09 | Waktu scheduled job pendeteksian invoice jatuh tempo (Overdue). | Berjalan otomatis setiap hari di luar jam sibuk dan selesai maksimal 5 menit. |

&nbsp;

## **4.3 Kebutuhan Interface**

### **4.3.1 User Interface**

* Interface dirancang berbasis web dan bersifat responsive sehingga dapat diakses melalui komputer maupun perangkat lain dengan resolusi layar minimal 1366 × 768 piksel.

* Tata letak menggunakan prinsip kesederhanaan dengan tabel yang dapat disaring dan diurutkan untuk daftar invoice, pembayaran, dan pelanggan.

* Perbedaan status invoice ditandai dengan kode warna yang konsisten: abu-abu untuk Draft, biru untuk Issued, kuning untuk Partially Paid, hijau untuk Paid, merah untuk Overdue, dan hitam atau abu-abu gelap untuk Cancelled.

* Seluruh nilai nominal ditampilkan dalam format Rupiah dengan pemisah ribuan.

* Seluruh label, error message, dan notifikasi disajikan dalam bahasa Indonesia yang baku dan mudah dipahami.

* Sistem menyediakan mekanisme konfirmasi ganda sebelum tindakan bernilai final dilakukan, yaitu penerbitan invoice, pembatalan invoice, dan penyimpanan pembayaran.

### **4.3.2 Hardware Interface**

* Komputer pengguna dengan resolusi layar minimal 1366 × 768 piksel.

* Pencetak dokumen berukuran kertas A4 yang terhubung melalui USB atau jaringan (Ethernet), bersifat opsional apabila dokumen hanya didistribusikan dalam bentuk PDF.

### **4.3.3 Software Interface**

* Sistem berjalan pada browser modern berbasis Chromium atau Firefox dengan versi terkini.

* Sistem menggunakan database relasional sebagai penyimpanan terpusat dan diakses melalui lapisan layanan (service layer) berbasis REST API dengan format pertukaran data JSON.

* Sistem menyediakan REST API yang terdokumentasi dan diamankan menggunakan token authentication untuk kebutuhan pengembangan lanjutan.

* Sistem menyediakan pembuatan file PDF untuk dokumen invoice pada sisi server.

### **4.3.4 Communication Interface**

* Komunikasi antara terminal client dan server dilakukan melalui protokol HTTPS pada LAN hotel.

* Pembayaran melalui Virtual Account, e-wallet, QRIS, atau payment gateway dikonfirmasi oleh pengguna berdasarkan bukti dari pihak penyedia layanan; sistem hanya mencatat kanal dan nomor referensinya.

## **4.4 Kebutuhan Data**

Struktur data sistem dirancang dalam bentuk database relasional yang ternormalisasi hingga bentuk normal ketiga (3NF) sebagaimana digambarkan pada ERD di Lampiran 2.0. Entitas-entitas utama yang dibutuhkan diuraikan sebagai berikut.

**Tabel 4.4.1 Entitas Data**

| Entitas | Deskripsi | Atribut Utama |
| ----- | ----- | ----- |
| **Customer** | Menyimpan data identitas pelanggan yang menerima invoice dan melakukan pembayaran. | id\_customer (PK), name, address, phone\_number, NIK, NPWP |
| **Invoice** | Merepresentasikan satu tagihan kepada seorang pelanggan beserta status, tanggal, dan nilai pajak serta potongannya. | id\_invoice (PK), id\_customer (FK), id\_user (FK), invoice\_number, invoice\_status, invoice\_type, invoice\_date, due\_date, subtotal, total\_amount, source\_type, ppn\_amount, pph\_amount, dp\_deduction |
| **Invoice Detail** | Mencatat rincian item pada setiap invoice. | id\_invoice\_detail (PK), id\_invoice (FK), description, quantity, item\_type, item\_price, total\_item\_price |
| **Payment** | Mencatat pembayaran yang diterima dari pelanggan beserta metode, kanal, dan rekening penerimanya. | id\_payment (PK), id\_customer (FK), payment\_amount, payment\_method, payment\_date, payment\_channel, reference\_no, admin\_fee, id\_bank\_account (FK) |
| **Payment Allocation** | Junction table antara Payment dan Invoice yang mencatat nominal pembayaran yang dialokasikan ke suatu invoice serta urutan pembayarannya. | id\_payment\_allocation (PK), id\_invoice (FK), id\_payment (FK), amount\_paid, times\_paid |
| **Bank Account** | Menyimpan data rekening bank hotel yang menerima pembayaran. | id\_bank\_account (PK), bank\_name, account\_number, account\_holder |
| **User** | Menyimpan data akun operator sistem beserta role-nya untuk keperluan authentication dan authorization. | id\_user (PK), username, password, role |
| **Activity Log** | Menyimpan audit trail atas setiap tindakan penting yang dilakukan pengguna di dalam sistem. | id\_log (PK), id\_user (FK), time, activity\_type, description |

&nbsp;

Relasi antar entitas tersebut adalah sebagai berikut: satu Customer dapat memiliki banyak Invoice (1..n); satu User dapat membuat banyak Invoice (1..n); satu Invoice memiliki banyak Invoice Detail (1..n); satu Customer dapat melakukan banyak Payment (1..n); satu Bank Account dapat menerima banyak Payment (1..n); satu Invoice dapat memiliki banyak Payment Allocation (1..n) dan satu Payment dapat memiliki banyak Payment Allocation (1..n), sehingga Invoice dan Payment berhubungan secara banyak-ke-banyak melalui Payment Allocation; serta satu User dapat memiliki banyak Activity Log (1..n).

Atribut password pada entitas User disimpan dalam bentuk hasil one-way hashing. Sisa tagihan sebuah invoice tidak disimpan sebagai atribut, melainkan dihitung dari total\_amount dikurangi jumlah amount\_paid pada seluruh Payment Allocation invoice tersebut.

**Tabel 4.4.2 Status Invoice (invoice\_status)**

| Status | Kondisi | Perpindahan Status yang Diizinkan |
| ----- | ----- | ----- |
| **Draft** | Invoice sedang disusun dan dapat diubah. | Issued, Cancelled |
| **Issued** | Invoice diterbitkan dan belum menerima pembayaran; isi invoice tidak dapat diubah. | Partially Paid, Paid, Overdue, Cancelled |
| **Partially Paid** | Invoice telah dibayar sebagian dan masih memiliki sisa tagihan. | Paid, Overdue |
| **Paid** | Sisa tagihan bernilai nol. | Status akhir |
| **Overdue** | Tanggal jatuh tempo terlewati dan masih terdapat sisa tagihan. | Partially Paid, Paid |
| **Cancelled** | Invoice dibatalkan sebelum ada pembayaran teralokasi. | Status akhir |

&nbsp;

## **4.5 Kebutuhan Non-Fungsional**

Kebutuhan non-fungsional berikut menetapkan mutu yang harus dipenuhi sistem di luar fungsi utamanya, meliputi aspek security, availability, reliability, usability, maintainability, portability, scalability, dan compliance.

**Tabel 4.5.1 Kebutuhan Non-Fungsional**

| Kode | Aspek | Uraian Kebutuhan |
| :---: | ----- | ----- |
| SRS-NF-01 | Security | Sistem harus menerapkan authentication berbasis username dan password, dengan password disimpan dalam bentuk encrypted menggunakan algoritma one-way hashing. |
| SRS-NF-02 | Security | Sistem harus menerapkan authorization berbasis role (role-based access control) sehingga setiap pengguna hanya dapat mengakses fungsi sesuai kewenangannya. |
| SRS-NF-03 | Security | Sistem harus mencatat audit trail atas pembuatan, perubahan, penerbitan, dan pembatalan invoice, pencatatan pembayaran, serta perubahan akun pengguna. |
| SRS-NF-04 | Security | Session pengguna harus berakhir secara otomatis setelah 15 menit tanpa aktivitas guna mencegah penyalahgunaan terminal yang ditinggalkan. |
| SRS-NF-05 | Availability | Sistem harus tersedia selama 24 jam sehari dan 7 hari seminggu dengan tingkat ketersediaan minimal 99,5% per bulan. |
| SRS-NF-06 | Reliability | Sistem harus menjamin integritas transaksi melalui mekanisme transaksi database yang bersifat atomic, sehingga pembayaran dan alokasinya tidak tersimpan sebagian dan tidak terjadi alokasi ganda. |
| SRS-NF-07 | Reliability | Sistem harus melakukan backup database secara otomatis minimal satu kali dalam sehari di luar jam sibuk. |
| SRS-NF-08 | Data Integrity | Data keuangan (invoice, rincian invoice, pembayaran, dan alokasi) tidak boleh dihapus secara fisik; koreksi dilakukan melalui pembatalan atau pencatatan baru, dan invoice berstatus Issued tidak dapat diubah isinya. |
| SRS-NF-09 | Data Integrity | Seluruh nilai nominal harus disimpan dan dihitung dengan presisi tetap (desimal) untuk menghindari kesalahan pembulatan. |
| SRS-NF-10 | Usability | Interface sistem harus dapat dioperasikan oleh pengguna baru setelah mengikuti pelatihan maksimal selama dua jam. |
| SRS-NF-11 | Data Integrity | Sistem harus memvalidasi kesamaan nilai antara total pembayaran yang diinput dan akumulasi nilai alokasi faktur sebelum data dapat disimpan. |
| SRS-NF-12 | Maintainability | Source code harus disusun secara modular dan terdokumentasi sehingga memudahkan pengembangan fitur lanjutan. |
| SRS-NF-13 | Portability | Sistem harus dapat dijalankan pada sistem operasi Windows maupun Linux melalui browser modern tanpa proses pemasangan khusus di sisi client. |
| SRS-NF-14 | Scalability | Arsitektur sistem harus memungkinkan penambahan metode pembayaran, kanal pembayaran, jenis invoice, dan rekening bank baru tanpa perubahan mendasar pada struktur database. |
| SRS-NF-15 | Compliance | Pengelolaan data pribadi pelanggan (termasuk NIK dan NPWP) harus mengacu pada ketentuan perundang-undangan mengenai pelindungan data pribadi yang berlaku di Indonesia. |
| SRS-NF-16 | Immutability | Data faktur yang telah berstatus Issued atau Paid tidak dapat diubah maupun dihapus secara permanen dari basis data demi kepatuhan audit keuangan&nbsp; |

# **LAMPIRAN**

Bagian ini disediakan untuk melampirkan dokumen pendukung hasil perancangan sistem.

**Lampiran 1.0 Use Case Diagram**

*\[Ruang untuk Use Case Diagram Sistem Piutang Usaha\]*

*Gambar C.1 Use Case Diagram Sistem Piutang Usaha*

**Lampiran 2.0 Entity Relationship Diagram (ERD)**

![Entity Relationship Diagram Sistem Piutang Usaha][image1]

*Gambar C.2 Entity Relationship Diagram Sistem Piutang Usaha*

**Lampiran 3.0 Rancangan Interface (Mockup)**

Rancangan interface yang perlu dilampirkan sekurang-kurangnya meliputi:

* Halaman Login.

* Halaman Daftar dan Formulir Data Pelanggan.

* Halaman Buat Invoice beserta rincian item dan ringkasan perhitungan (subtotal, PPN, PPh, potongan DP, total).

* Halaman Daftar Invoice dengan penanda warna status dan filter.

* Halaman Detail Invoice beserta tombol Terbitkan, Batalkan, dan Cetak / Export PDF.

* Halaman Catat Pembayaran beserta alokasi ke invoice.

* Halaman Laporan Aging Report.

* Halaman Kelola Rekening Bank dan Kelola Pengguna.

* Halaman Log Aktivitas.

* Contoh keluaran dokumen invoice dalam format PDF.

*\[Ruang untuk mockup interface sistem\]*

*Gambar C.3 Rancangan Interface Sistem Piutang Usaha*

**Lampiran 4.0 Matriks Keterunutan Kebutuhan**

Matriks berikut menunjukkan keterunutan (traceability) antara use case pada Bab III dan kebutuhan fungsional pada Subbab 4.1.

| Kode Use Case | Nama Use Case | Kebutuhan Fungsional Terkait |
| :---: | ----- | ----- |
| UC-01 | Kelola Data Pelanggan | SRS-F-01, SRS-F-02, SRS-F-03 |
| UC-02 | Buat Invoice | SRS-F-04, SRS-F-05, SRS-F-06, SRS-F-07, SRS-F-14, SRS-F-15 |
| UC-03 | Terbitkan Invoice | SRS-F-16, SRS-F-17 |
| UC-04 | Batalkan Invoice | SRS-F-17, SRS-F-18 |
| UC-05 | Catat Pembayaran | SRS-F-20, SRS-F-21, SRS-F-22, SRS-F-31 |
| UC-06 | Alokasikan Pembayaran ke Invoice | SRS-F-23, SRS-F-24, SRS-F-25, SRS-F-26, SRS-F-27, SRS-F-28 |
| UC-07 | Kelola Rekening Bank | SRS-F-32 |
| UC-08 | Cetak / Export Invoice PDF | SRS-F-35 |
| UC-09 | Lihat Laporan Aging Report | SRS-F-33, SRS-F-34 |
| UC-10 | Kelola Pengguna dan Role | SRS-F-38 |
| UC-11 | Lihat Log Aktivitas | SRS-F-40 |
| UC-12 | Hitung Nominal Invoice | SRS-F-08, SRS-F-09, SRS-F-10, SRS-F-11, SRS-F-12 |
| UC-13 | Terapkan Potongan Uang Muka | SRS-F-13 |
| UC-14 | Perbarui Status Invoice | SRS-F-19, SRS-F-29 |
| UC-15 | Deteksi Jatuh Tempo | SRS-F-30 |
| UC-16 | Catat Log Aktivitas | SRS-F-39 |
| Umum | Berlaku pada seluruh use case (autentikasi dan authorization) | SRS-F-36, SRS-F-37 |

&nbsp;

[image1]: <data:image/png;base64,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> "ERD"