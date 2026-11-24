# Add project specific ProGuard / R8 rules here.
# Enabled for release so Google Play DEX Obscurity / optimization scores clear ≥25%.

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
    void set*(***);
    *** get*();
}
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

# RN loads these via JNI even in release (ClassNotFoundException crash without keep)
-keep class com.facebook.react.devsupport.** { *; }
-keep class com.facebook.react.soloader.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.common.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.runtime.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.internal.** { *; }
-keep class com.facebook.react.config.** { *; }
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# Hermes / JNI
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }

# OkHttp / Okio (common RN networking)
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# react-native-reanimated / worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# RevenueCat
-keep class com.revenuecat.purchases.** { *; }
-dontwarn com.revenuecat.purchases.**

# Google Play Billing / IAP
-keep class com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Image crop picker / similar reflection-heavy libs
-keep class com.reactnative.ivpusic.imagepicker.** { *; }

# Keep line numbers for crash reports (Play / Crashlytics)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
