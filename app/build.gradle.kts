import org.gradle.api.GradleException

plugins {
    id("com.android.application")
}

// Kunci tanda tangan tetap (tersimpan sebagai GitHub Actions secrets).
// Ini membuat APK baru bisa mengtimpa versi lama tanpa uninstall.
val releaseKeystorePath = System.getenv("OSID_KEYSTORE_PATH")
val releaseKeystorePassword = System.getenv("OSID_KEYSTORE_PASSWORD")
val releaseKeyAlias = System.getenv("OSID_KEYSTORE_ALIAS")
val releaseKeyPassword = System.getenv("OSID_KEYSTORE_KEY_PASSWORD")

if (releaseKeystorePath == null || releaseKeystorePassword == null
        || releaseKeyAlias == null || releaseKeyPassword == null) {
    throw GradleException("Signing env vars are required: OSID_KEYSTORE_PATH, OSID_KEYSTORE_PASSWORD, OSID_KEYSTORE_ALIAS, OSID_KEYSTORE_KEY_PASSWORD")
}

android {
    namespace = "id.orangesky.admin"
    compileSdk = 34

    defaultConfig {
        applicationId = "id.orangesky.admin"
        minSdk = 26
        targetSdk = 34
        versionCode = 12
        versionName = "1.11"
    }

    signingConfigs {
        create("release") {
            storeFile = file(releaseKeystorePath!!)
            storePassword = releaseKeystorePassword!!
            keyAlias = releaseKeyAlias!!
            keyPassword = releaseKeyPassword!!
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
