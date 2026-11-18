# OS.ID Dashboard — WebView Live

Pembungkus Android WebView untuk **dashboard admin asli** di
`https://orangesky.id/manajemen/`.

Aplikasi ini **tidak memuat data demo/local** dan **tidak menyimpan kredensial**.
Semua halaman, login, OTP, sesi, upload, dan download berasal langsung dari
server produksi `orangesky.id`.

## Unduh

APK terbaru: https://github.com/luqman-hakiem/orangesky-admin-webview/releases/latest

Hanya varian **release** yang dipublikasikan. Varian debug tidak diunggah.

## Perilaku

- Start URL: `https://orangesky.id/manajemen/`
- Hanya domain `orangesky.id` dan subdomainnya yang dibuka di dalam WebView.
- Link di luar domain (WhatsApp, `tel:`, `mailto:`, dll.) dibuka dengan aplikasi lain.
- Cookie disimpan, sehingga sesi login tetap ada sampai logout atau data aplikasi dihapus.
- Antarmuka bergaya aplikasi Android: top bar judul + refresh + menu `⋮`, serta bottom navigation mengambang 5 menu (Beranda, Booking, Property, Member, Laporan).
- Bottom navigation otomatis tersembunyi saat halaman di-scroll ke bawah dan muncul lagi saat di-scroll ke atas.
- Indikator loading berupa ikon berputar + teks `Memuat...` muncul saat menunggu jaringan, ditambah progress bar tipis di atas halaman.
- Menu tambahan (Rate Plan, Voucher, User, Tools, laporan lain, Ganti Password, Log Out) ada di tombol `⋮`.
- Chrome aplikasi otomatis disembunyikan saat halaman login, sehingga layar login tetap bersih.
- Skala halaman dikembalikan ke perilaku versi 1.3 yang lebih nyaman; tidak ada injeksi viewport/CSS buatan.
- Mulai v1.6 APK ditandatangani dengan kunci tetap, sehingga update berikutnya bisa mengtimpa instalasi lama tanpa uninstall.
- Kredensial tidak disimpan/diisi otomatis; pengguna login manual di halaman situs.
- Kode OTP tetap dikirim dan diverifikasi oleh situs; aplikasi tidak melewati OTP.

## Build via GitHub Actions

1. Push ke branch `main`, atau buka tab **Actions → Build WebView APK → Run workflow**.
2. Setelah selesai, unduh artifact **`orangesky-admin-webview-apk`**.
3. Artifact berisi:
   - `OS.ID-Dashboard-1.7.apk` (release, ditandatangani kunci tetap agar bisa mengtimpa versi sebelumnya)
4. Workflow mendekode keystore dariGitHub Actions secrets `OSID_KEYSTORE_B64`,
   `OSID_KEYSTORE_PASSWORD`, `OSID_KEYSTORE_KEY_PASSWORD`, dan `OSID_KEYSTORE_ALIAS`.

## Build lokal

Butuh JDK 17, Android SDK platform 34, dan Gradle 8.9. Siapkan variabel signing
yang sama dengan secrets GitHub lalu jalankan:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.21.9-hotspot'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
$env:OSID_KEYSTORE_PATH='C:\path\ke\osid-release.keystore'
$env:OSID_KEYSTORE_PASSWORD='<dari secret>'
$env:OSID_KEYSTORE_ALIAS='<dari secret>'
$env:OSID_KEYSTORE_KEY_PASSWORD='<dari secret>'
gradle assembleRelease --no-daemon
```

Hasil: `app/build/outputs/apk/release/app-release.apk`.

## Catatan

- Versi v1.5 ke bawah dibangun dengan debug key otomatis GitHub yang berubah setiap
  run. Karena itu, saat pertama kali memasang v1.6/v1.7 di perangkat yang masih
  memuat v1.5 atau lama, Android mungkin meminta uninstall sekali. Setelah v1.6
  atau lebih baru terpasang, rilis berikutnya dapat langsung mengtimpa.
- Untuk Play Store: ganti keystore dengan keystore resmi dan naikkan `versionCode`.
