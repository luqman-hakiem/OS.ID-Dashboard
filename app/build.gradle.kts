plugins {
    id("com.android.application")
}

android {
    namespace = "id.orangesky.admin"
    compileSdk = 34

    defaultConfig {
        applicationId = "id.orangesky.admin"
        minSdk = 26
        targetSdk = 34
        versionCode = 6
        versionName = "1.5"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
