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

function addDialIntentFilters(androidManifest) {
  const manifest = androidManifest.manifest;
  const application = manifest.application?.[0];
  if (!application) return androidManifest;

  const mainActivity = application.activity?.find(
    (act) => act.$ && act.$['android:name'] === '.MainActivity'
  );

  if (!mainActivity) return androidManifest;

  if (!mainActivity['intent-filter']) {
    mainActivity['intent-filter'] = [];
  }

  // 1. DIAL Action intent filter
  const hasDialFilter = mainActivity['intent-filter'].some((filter) =>
    filter.action?.some((a) => a.$ && a.$['android:name'] === 'android.intent.action.DIAL') &&
    !filter.data
  );

  if (!hasDialFilter) {
    mainActivity['intent-filter'].push({
      action: [{ $: { 'android:name': 'android.intent.action.DIAL' } }],
      category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
    });
  }

  // 2. tel: scheme intent filter
  const hasTelFilter = mainActivity['intent-filter'].some((filter) =>
    filter.data?.some((d) => d.$ && d.$['android:scheme'] === 'tel')
  );

  if (!hasTelFilter) {
    mainActivity['intent-filter'].push({
      action: [
        { $: { 'android:name': 'android.intent.action.DIAL' } },
        { $: { 'android:name': 'android.intent.action.CALL' } },
        { $: { 'android:name': 'android.intent.action.VIEW' } },
      ],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [{ $: { 'android:scheme': 'tel' } }],
    });
  }

  return androidManifest;
}

const withAndroidCallLog = (config) => {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addPermissions(config.modResults);
    config.modResults = addDialIntentFilters(config.modResults);
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
    }
    if (!contents.includes('VoiceSearchPackage')) {
      const importStmt = 'import com.ils_nazir.PhoneApp.voice.VoiceSearchPackage';
      if (!contents.includes(importStmt)) {
        contents = contents.replace(
          /(package com\.ils_nazir\.PhoneApp)/,
          `$1\n\n${importStmt}`
        );
      }
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        `PackageList(this).packages.apply {\n          add(VoiceSearchPackage())`
      );
    }
    config.modResults.contents = contents;
    return config;
  });

  return config;
};

module.exports = createRunOncePlugin(
  withAndroidCallLog,
  'withAndroidCallLog',
  '1.0.0'
);
