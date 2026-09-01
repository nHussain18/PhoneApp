import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/Common/AppIcon';
import { ActionService } from '../services/ActionService';
import { CallLogService } from '../services/CallLogService';
import { ContactsService } from '../services/ContactsService';
import { SupportedLanguage, useLanguage } from '../services/LanguageContext';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const [hasPermissions, setHasPermissions] = useState<boolean>(true);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);

  useEffect(() => {
    checkPermissionsStatus();
  }, []);

  const handleCheckForUpdates = async () => {
    ActionService.triggerHaptic('impactLight');
    if (__DEV__) {
      Alert.alert('Development Mode', 'OTA updates are not active in development mode.');
      return;
    }

    try {
      setIsCheckingUpdate(true);
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        setIsCheckingUpdate(false);
        ActionService.triggerHaptic('success');
        Alert.alert(
          t('updatesTitle'),
          t('updateDownloaded'),
          [
            {
              text: t('restartNow'),
              onPress: () => Updates.reloadAsync(),
            },
          ]
        );
      } else {
        setIsCheckingUpdate(false);
        Alert.alert(t('updatesTitle'), t('noUpdateAvailable'));
      }
    } catch (e) {
      setIsCheckingUpdate(false);
      Alert.alert(t('updatesTitle'), t('updateError'));
    }
  };

  const checkPermissionsStatus = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const perms = [
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      ];
      const results = await PermissionsAndroid.requestMultiple(perms);
      const allGranted = Object.values(results).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
      setHasPermissions(allGranted);
    } catch (e) {
      console.warn('Error checking permissions:', e);
    }
  };

  const handleRequestPermissions = async () => {
    ActionService.triggerHaptic('selection');
    if (Platform.OS !== 'android') return;
    try {
      const perms = [
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.WRITE_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      ];
      const results = await PermissionsAndroid.requestMultiple(perms);
      const allGranted = Object.values(results).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
      setHasPermissions(allGranted);
    } catch (e) {
      console.warn('Error requesting permissions:', e);
    }
  };

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    ActionService.triggerHaptic('selection');
    setLanguage(lang);
  };

  const handleClearAllLogs = () => {
    ActionService.triggerHaptic('impactHeavy');
    Alert.alert(t('clearAllLogs'), t('clearAllLogsPrompt'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('clearAllLogs'),
        style: 'destructive',
        onPress: async () => {
          await CallLogService.clearAllCallLogs();
          Alert.alert('Success', t('allLogsCleared'));
        },
      },
    ]);
  };

  const handleBack = () => {
    ActionService.triggerHaptic('selection');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="arrow-back" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settingsTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(40, insets.bottom + 24) }]}>
        {/* Language Selection Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('selectLanguage')}</Text>

          <TouchableOpacity
            style={[
              styles.optionRow,
              language === 'en' && styles.optionRowSelected,
            ]}
            onPress={() => handleSelectLanguage('en')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Text style={styles.langFlag}>🇬🇧</Text>
              <View>
                <Text style={styles.optionTitle}>{t('english')}</Text>
                <Text style={styles.optionSub}>Default English UI</Text>
              </View>
            </View>
            <View
              style={[
                styles.radioCircle,
                language === 'en' && styles.radioCircleSelected,
              ]}
            >
              {language === 'en' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionRow,
              language === 'hi' && styles.optionRowSelected,
            ]}
            onPress={() => handleSelectLanguage('hi')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Text style={styles.langFlag}>🇮🇳</Text>
              <View>
                <Text style={styles.optionTitle}>{t('hindi')}</Text>
                <Text style={styles.optionSub}>सरल हिन्दी इंटरफ़ेस</Text>
              </View>
            </View>
            <View
              style={[
                styles.radioCircle,
                language === 'hi' && styles.radioCircleSelected,
              ]}
            >
              {language === 'hi' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Create Contact Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('contacts')}</Text>
          <TouchableOpacity
            style={styles.createContactBtn}
            onPress={() => ContactsService.presentSystemContactForm()}
            activeOpacity={0.7}
          >
            <AppIcon name="person-add-outline" color="#2563EB" />
            <View>
              <Text style={styles.createContactTitle}>{t('createNewContact')}</Text>
              <Text style={styles.createContactSub}>Save new name & number to phone</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Permissions Status Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('permissionsTitle')}</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('callLogPerm')}</Text>
            <View
              style={[
                styles.badge,
                hasPermissions ? styles.badgeGreen : styles.badgeRed,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  hasPermissions ? styles.badgeTextGreen : styles.badgeTextRed,
                ]}
              >
                {hasPermissions ? `✓ ${t('granted')}` : `✕ ${t('notGranted')}`}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('contactsPerm')}</Text>
            <View
              style={[
                styles.badge,
                hasPermissions ? styles.badgeGreen : styles.badgeRed,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  hasPermissions ? styles.badgeTextGreen : styles.badgeTextRed,
                ]}
              >
                {hasPermissions ? `✓ ${t('granted')}` : `✕ ${t('notGranted')}`}
              </Text>
            </View>
          </View>

          {!hasPermissions && (
            <TouchableOpacity
              style={styles.grantButton}
              onPress={handleRequestPermissions}
            >
              <Text style={styles.grantButtonText}>{t('grantPerms')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Data Management Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('dangerZone')}</Text>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearAllLogs}
            activeOpacity={0.7}
          >
            <AppIcon name="trash-outline" size={20} color="#DC2626" />
            <Text style={styles.dangerButtonText}>{t('clearAllLogs')}</Text>
          </TouchableOpacity>
        </View>

        {/* App Updates Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('updatesTitle')}</Text>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleCheckForUpdates}
            disabled={isCheckingUpdate}
            activeOpacity={0.7}
          >
            {isCheckingUpdate ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
            ) : (
              <AppIcon name="refresh-outline" size={20} color="#2563EB" />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.updateButtonTitle}>
                {isCheckingUpdate ? t('checkingUpdates') : t('checkUpdates')}
              </Text>
              <Text style={styles.updateButtonSub}>
                {Updates.channel ? `Channel: ${Updates.channel}` : 'Over-the-air auto sync'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About App Card */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>{t('aboutApp')}</Text>
          <Text style={styles.aboutVersion}>{t('appVersion')} 1.0.0 (Expo SDK 57)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  createContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  createContactIcon: {
    fontSize: 22,
  },
  createContactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  createContactSub: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    backgroundColor:'red',
    color: '#0F172A',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionRowSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  langFlag: {
    fontSize: 26,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: '#15803D',
  },
  badgeTextRed: {
    color: '#B91C1C',
  },
  grantButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
  },
  dangerButtonIcon: {
    fontSize: 20,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  updateButtonIcon: {
    fontSize: 20,
  },
  updateButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  updateButtonSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  aboutVersion: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
