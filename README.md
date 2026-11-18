# OS.ID Dashboard — WebView Live

Pembungkus Android WebView untuk **dashboard admin asli** di
`https://orangesky.id/manajemen/`.

Aplikasi ini **tidak memuat data demo/local** dan **tidak menyimpan kredensial**.
Semua halaman, login, OTP, sesi, upload, dan download berasal langsung dari
server produksi `orangesky.id`.

## Unduh

APK terbaru: https://github.com/luqman-hakiem/orangesky-admin-webview/releases/latest

## Perilaku

- Start URL: `https://orangesky.id/manajemen/`
- Hanya domain `orangesky.id` dan subdomainnya yang dibuka di dalam WebView.
- Link di luar domain (WhatsApp, `tel:`, `mailto:`, dll.) dibuka dengan aplikasi lain.
- Cookie disimpan, sehingga sesi login tetap ada sampai logout atau data aplikasi dihapus.
- Kredensial tidak disimpan/diisi otomatis; pengguna login manual di halaman situs.
- Kode OTP tetap dikirim dan diverifikasi oleh situs; aplikasi tidak melewati OTP.

## Build via GitHub Actions

1. Push ke branch `main`, atau buka tab **Actions → Build WebView APK → Run workflow**.
2. Setelah selesai, unduh artifact **`orangesky-admin-webview-apk`**.
3. Artifact berisi:
   - `OS.ID-Dashboard-1.3.apk` (release, signed dengan debug key agar langsung installable)
   - `OS.ID-Dashboard-1.3-debug.apk`

## Build lokal

Butuh JDK 17, Android SDK platform 34, dan Gradle 8.9.

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.21.9-hotspot'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
gradle assembleDebug assembleRelease --no-daemon
```

Hasil: `app/build/outputs/apk/release/app-release.apk`.

## Catatan

Untuk Play Store: ganti `signingConfig` release dengan keystore resmi dan naikkan
`versionCode`. Saat ini release memakai debug key agar bisa langsung diinstal.
