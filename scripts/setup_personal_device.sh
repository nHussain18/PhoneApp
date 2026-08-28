#!/usr/bin/env bash

# Personal Device Setup & ADB Privilege Script for Motorola Android 15
# Run this script after installing the debug APK on your personal device.

PACKAGE_NAME="com.ils_nazir.PhoneApp"
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

echo "=========================================================="
echo " Personal Motorola Android 15 Setup Script"
echo " Package: $PACKAGE_NAME"
echo "=========================================================="

# Check if ADB device is connected
if ! adb devices | grep -q "device$"; then
    echo "ERROR: No ADB device connected. Please connect your Motorola phone via USB and enable USB Debugging."
    exit 1
fi

echo "[1/4] Installing Debug APK..."
adb install -r "$APK_PATH"

echo "[2/4] Granting Runtime Permissions via ADB..."
adb shell pm grant "$PACKAGE_NAME" android.permission.RECORD_AUDIO
adb shell pm grant "$PACKAGE_NAME" android.permission.READ_PHONE_STATE
adb shell pm grant "$PACKAGE_NAME" android.permission.CALL_PHONE
adb shell pm grant "$PACKAGE_NAME" android.permission.POST_NOTIFICATIONS 2>/dev/null || true

echo "[3/4] Setting AppOps Privileges for Personal Handset Use..."
adb shell appops set "$PACKAGE_NAME" RECORD_AUDIO allow
adb shell appops set "$PACKAGE_NAME" SYSTEM_ALERT_WINDOW allow
adb shell appops set "$PACKAGE_NAME" READ_CALL_LOG allow
adb shell appops set "$PACKAGE_NAME" GET_USAGE_STATS allow
adb shell appops set "$PACKAGE_NAME" BIND_ACCESSIBILITY_SERVICE allow 2>/dev/null || true

echo "[4/4] Bypassing Android 15 Sideload Restricted Settings..."
adb shell appops set "$PACKAGE_NAME" MANAGE_EXTERNAL_STORAGE allow 2>/dev/null || true

echo "=========================================================="
echo " SUCCESS! All ADB permissions and AppOps privileges set."
echo " Launch PhoneApp on your phone to test low-level PCM capture."
echo "=========================================================="
