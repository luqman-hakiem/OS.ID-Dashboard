# OrangeSky Admin — WebView Live

Pembungkus Android WebView untuk **dashboard admin asli** di
`https://orangesky.id/manajemen/`.

Aplikasi ini **tidak memuat data demo/local**. Semua halaman, login, OTP, sesi,
upload, dan download berasal langsung dari server produksi `orangesky.id`.

## Perilaku

- Start URL: `https://orangesky.id/manajemen/`
- Hanya domain `orangesky.id` dan subdomainnya yang dibuka di dalam WebView.
- Link di luar domain (WhatsApp, `tel:`, `mailto:`, dll.) dibuka dengan aplikasi lain.
- Cookie disimpan, sehingga sesi login tetap ada sampai logout atau data aplikasi dihapus.
- Form login live di-prefill dengan user `REDACTED` / `REDACTED`.
- Kode OTP tetap dikirim dan diverifikasi oleh situs; aplikasi tidak melewati OTP.

## Build via GitHub Actions

1. Push ke branch `main`, atau buka tab **Actions → Build WebView APK → Run workflow**.
2. Setelah selesai, unduh artifact **`orangesky-admin-webview-apk`**.
3. Artifact berisi:
   - `OrangeSkyAdmin-1.1.apk` (release, signed dengan debug key agar langsung installable)
   - `OrangeSkyAdmin-1.1-debug.apk`

## Build lokal

Butuh JDK 17, Android SDK platform 34, dan Gradle 8.9.

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.21.9-hotspot'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
gradle assembleDebug assembleRelease --no-daemon
```

Hasil: `app/build/outputs/apk/release/app-release.apk`.

## Login

- Username: `REDACTED` (terisi otomatis)
- Password: `REDACTED` (terisi otomatis)
- OTP: dikirim/ditampilkan oleh situs `orangesky.id`, masukkan manual.

## Catatan

Untuk Play Store: ganti `signingConfig` release dengan keystore resmi dan naikkan
`versionCode`. Saat ini release memakai debug key agar bisa langsung diinstal.
