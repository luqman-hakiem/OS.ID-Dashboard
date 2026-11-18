# OrangeSky Admin WebView APK

Dashboard admin OrangeSky dibungkus sebagai aplikasi Android WebView. Aset web statis
disimpan di `app/src/main/assets/public` dan disajikan pada origin `https://app.local/`
agar `localStorage` dan upload file berfungsi layaknya web.

## Build via GitHub Actions

1. Push ke branch `main`, atau buka tab **Actions** → **Build WebView APK** → **Run workflow**.
2. Setelah selesai, unduh artifact **`orangesky-admin-webview-apk`**.
3. Artifact berisi:
   - `OrangeSkyAdmin-1.0.apk` (release, signing debug)
   - `OrangeSkyAdmin-1.0-debug.apk` (debug)

## Build lokal

Butuh JDK 17, Android SDK platform 34, dan Gradle 8.9.

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.21.9-hotspot'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
gradle assembleDebug assembleRelease --no-daemon
```

Hasil: `app/build/outputs/apk/release/app-release.apk`.

## Login demo

- Username: `REDACTED`
- Password: `REDACTED`
- Kode OTP: `482913`

## Catatan

Data yang dipakai adalah data dummy lokal (`localStorage`), bukan koneksi langsung ke
database produksi `orangesky.id`. Untuk Play Store, ganti signingConfig release dengan
keystore resmi dan naikkan `versionCode`.
