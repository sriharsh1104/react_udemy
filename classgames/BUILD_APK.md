# APK Build Guide - Class Games App

## Steps to Build APK:

### Step 1: Login to Expo Account
```bash
npx eas-cli login
```
(अगर account नहीं है तो पहले https://expo.dev पर free account बनाएं)

### Step 2: Build APK
```bash
npx eas-cli build --platform android --profile preview
```

यह command:
- APK file बनाएगा (AAB नहीं)
- Preview profile use करेगा (local testing के लिए)
- Build cloud पर होगा (15-20 minutes लग सकते हैं)

### Step 3: Download APK
Build complete होने के बाद:
- Terminal में download link मिलेगा
- या Expo dashboard से download करें: https://expo.dev/accounts/[your-username]/projects/classgames/builds

### Alternative: Local Build (अगर Android SDK installed है)
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```
APK file: `android/app/build/outputs/apk/release/app-release.apk`

## Important Notes:
- पहली बार build करने पर Expo account की जरूरत होगी
- Build cloud पर होगा (free tier available)
- APK file size: ~30-50 MB
- Android 5.0+ devices पर काम करेगा

## Quick Build Command:
```bash
npx eas-cli build --platform android --profile preview --non-interactive
```

