const { withAndroidManifest, withMainApplication, createRunOncePlugin } = require('@expo/config-plugins');

function addPermissions(androidManifest) {
  const manifest = androidManifest.manifest;
  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }

  const permissions = [
    'android.permission.READ_CALL_LOG',
    'android.permission.WRITE_CALL_LOG',
    'android.permission.READ_CONTACTS',
    'android.permission.WRITE_CONTACTS',
    'android.permission.CALL_PHONE',
    'android.permission.READ_PHONE_STATE',
    'android.permission.VIBRATE',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.INTERNET',
  ];

  permissions.forEach((permName) => {
    const exists = manifest['uses-permission'].some(
      (item) => item.$ && item.$['android:name'] === permName
    );
    if (!exists) {
      manifest['uses-permission'].push({
        $: { 'android:name': permName },
      });
    }
  });

  return androidManifest;
}

const withAndroidCallLog = (config) => {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addPermissions(config.modResults);
    return config;
  });

  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('CallLogPackage')) {
      const importStmt = 'import com.ils_nazir.PhoneApp.calllog.CallLogPackage';
      if (!contents.includes(importStmt)) {
        contents = contents.replace(
          /(package com\.ils_nazir\.PhoneApp)/,
          `$1\n\n${importStmt}`
        );
      }
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        `PackageList(this).packages.apply {\n          add(CallLogPackage())`
      );
      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
};

module.exports = createRunOncePlugin(
  withAndroidCallLog,
  'withAndroidCallLog',
  '1.0.0'
);
