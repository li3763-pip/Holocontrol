plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.holocontrol.verificador"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.holocontrol.verificador"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "2.5.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    // Use the existing web source tree as assets — no file duplication needed.
    // Structure under src/ mirrors what the HTML expects:
    //   file:///android_asset/apps/verificador/index.html
    //   relative paths like ../../shared/css/variables.css resolve correctly.
    sourceSets.getByName("main") {
        assets.srcDirs("../../src")
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.activity.ktx)
}
