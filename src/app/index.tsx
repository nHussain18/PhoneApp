import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CallLogList } from '../components/CallLog/CallLogList';
import { AppIcon } from '../components/Common/AppIcon';
import { ContactDetailsModal } from '../components/Contacts/ContactDetailsModal';
import { ContactsList } from '../components/Contacts/ContactsList';
import { DialpadView } from '../components/Dialpad/DialpadView';
import { BottomTabBar, BottomTabType } from '../components/Navigation/BottomTabBar';
import { ActionService } from '../services/ActionService';
import { CallLogService, GroupedCallLog } from '../services/CallLogService';
import { ContactsService, PhoneContact } from '../services/ContactsService';
import { useLanguage } from '../services/LanguageContext';

export default function PhoneHomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  // 3 separate tabs: Recents (default open), Keypad in center, Contacts
  const [activeTab, setActiveTab] = useState<BottomTabType>('RECENTS');

  const [hasPermissions, setHasPermissions] = useState<boolean>(true);
  const [callLogs, setCallLogs] = useState<GroupedCallLog[]>([]);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<PhoneContact | null>(null);

  // Request Android Permissions
  const checkAndRequestPermissions = async () => {
    if (Platform.OS !== 'android') return;

    try {
      const perms = [
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.WRITE_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      ];

      const results = await PermissionsAndroid.requestMultiple(perms);
      const allGranted = Object.values(results).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      setHasPermissions(allGranted);
      loadAllData();
    } catch (e) {
      console.warn('Error checking permissions:', e);
    }
  };

  const loadCallLogs = useCallback(async () => {
    if (!CallLogService.isAvailable()) return;
    setIsLoadingLogs(true);
    try {
      const rawLogs = await CallLogService.getCallLogs(250);
      const grouped = CallLogService.groupCallLogs(rawLogs);
      setCallLogs(grouped);
    } catch (e) {
      console.error('Error loading call logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const loadContacts = useCallback(async (forceRefresh = false) => {
    setIsLoadingContacts(true);
    try {
      const list = await ContactsService.loadContacts(forceRefresh);
      setContacts(list);
    } catch (e) {
      console.error('Error loading contacts:', e);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const loadAllData = useCallback(() => {
    loadCallLogs();
    loadContacts();
  }, [loadCallLogs, loadContacts]);

  useEffect(() => {
    checkAndRequestPermissions();

    // Live Call Log ContentObserver Listener
    const sub = CallLogService.onCallLogChanged(() => {
      loadCallLogs();
    });

    // AppState Listener (auto refresh when returning to app from phone call)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadCallLogs();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      sub.remove();
      appStateSub.remove();
    };
  }, [loadCallLogs, loadContacts]);

  const handleDeleteCallLog = async (id: string) => {
    ActionService.triggerHaptic('impactLight');
    await CallLogService.deleteCallLog(id);
    loadCallLogs();
  };

  const handleSelectContactFromCallLog = (phoneNumber: string, name?: string) => {
    const found = contacts.find((c) =>
      c.phoneNumbers.some(
        (p) =>
          p.number.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '') ||
          (name && c.name.toLowerCase() === name.toLowerCase())
      )
    );

    if (found) {
      setSelectedContact(found);
    } else {
      setSelectedContact({
        id: phoneNumber,
        name: name || phoneNumber,
        phoneNumbers: [{ number: phoneNumber, label: 'Mobile' }],
        t9Representation: '',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appTitle')}</Text>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            ActionService.triggerHaptic('selection');
            router.push('/settings');
          }}
          activeOpacity={0.7}
        >
          <AppIcon name="settings-outline" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Permission Warning Banner if missing */}
      {!hasPermissions && (
        <TouchableOpacity
          style={styles.permBanner}
          onPress={checkAndRequestPermissions}
        >
          <Text style={styles.permBannerText}>
            {t('permWarning')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Main Content Area based on Active Tab */}
      <View style={styles.content}>
        {activeTab === 'RECENTS' && (
          <CallLogList
            groupedLogs={callLogs}
            isLoading={isLoadingLogs}
            onRefresh={loadCallLogs}
            onDeleteLog={handleDeleteCallLog}
            onSelectContact={handleSelectContactFromCallLog}
            contentPaddingBottom={20}
          />
        )}

        {activeTab === 'KEYPAD' && (
          <DialpadView
            contacts={contacts}
            onCallPlaced={() => {}}
            onContactSelect={(c) => {
              setSelectedContact(c);
            }}
            onContactCreated={() => loadContacts(false)}
          />
        )}

        {activeTab === 'CONTACTS' && (
          <ContactsList
            contacts={contacts}
            isLoading={isLoadingContacts}
            onRefresh={() => loadContacts(true)}
            onFavoriteToggled={() => loadContacts(false)}
          />
        )}
      </View>

      {/* 3-Tab Bottom Navigation: Recents (left) | Keypad (center) | Contacts (right) */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* Contact Details Sheet */}
      <ContactDetailsModal
        contact={selectedContact}
        visible={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onFavoriteToggled={() => loadContacts(false)}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    // borderBottomWidth: 1,
    // borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  permBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  permBannerText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
});
