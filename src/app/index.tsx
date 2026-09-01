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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CallLogList } from '../components/CallLog/CallLogList';
import { AppIcon } from '../components/Common/AppIcon';
import { ContactDetailsModal } from '../components/Contacts/ContactDetailsModal';
import { ContactsList } from '../components/Contacts/ContactsList';
import { DialpadView } from '../components/Dialpad/DialpadView';
import { ActionService } from '../services/ActionService';
import { CallLogService, GroupedCallLog } from '../services/CallLogService';
import { ContactsService, PhoneContact } from '../services/ContactsService';
import { useLanguage } from '../services/LanguageContext';

type ActiveTab = 'RECENTS' | 'CONTACTS';

export default function PhoneHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('RECENTS');
  const [isDialpadVisible, setIsDialpadVisible] = useState<boolean>(false);
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
    // Find matching contact in loaded contacts list
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>{t('appTitle')}</Text>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              ActionService.triggerHaptic('selection');
              router.push('/settings');
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="settings" color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'RECENTS' && styles.tabButtonActive]}
            onPress={() => {
              ActionService.triggerHaptic('selection');
              setActiveTab('RECENTS');
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'RECENTS' && styles.tabButtonTextActive,
              ]}
            >
              {t('recents')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'CONTACTS' && styles.tabButtonActive]}
            onPress={() => {
              ActionService.triggerHaptic('selection');
              setActiveTab('CONTACTS');
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'CONTACTS' && styles.tabButtonTextActive,
              ]}
            >
              {t('contacts')}
            </Text>
          </TouchableOpacity>
        </View>
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

      {/* Main Content View */}
      <View style={styles.content}>
        {activeTab === 'RECENTS' ? (
          <CallLogList
            groupedLogs={callLogs}
            isLoading={isLoadingLogs}
            onRefresh={() => loadCallLogs()}
            onDeleteLog={handleDeleteCallLog}
            onSelectContact={handleSelectContactFromCallLog}
          />
        ) : (
          <ContactsList
            contacts={contacts}
            isLoading={isLoadingContacts}
            onRefresh={() => loadContacts(true)}
            onFavoriteToggled={() => loadContacts(false)}
          />
        )}
      </View>

      {/* Dialpad Slide-up / Bottom Sheet */}
      {isDialpadVisible && (
        <View style={styles.dialpadOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setIsDialpadVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.dialpadContainer}>
            <View style={styles.dialpadHandleRow}>
              <View style={styles.sheetHandle} />
              <TouchableOpacity
                onPress={() => setIsDialpadVisible(false)}
                style={styles.closeDialpadBtn}
              >
                <AppIcon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <DialpadView
              contacts={contacts}
              onCallPlaced={() => setIsDialpadVisible(false)}
              onContactSelect={(c) => {
                setIsDialpadVisible(false);
                setSelectedContact(c);
              }}
              onContactCreated={() => loadContacts(false)}
            />
          </View>
        </View>
      )}

      {/* Floating Keypad Toggle Button (FAB) */}
      {!isDialpadVisible && (
        <TouchableOpacity
          style={[
            styles.fabButton,
            { bottom: Math.max(20, insets.bottom + 16) },
          ]}
          onPress={() => {
            ActionService.triggerHaptic('impactMedium');
            setIsDialpadVisible(true);
          }}
          activeOpacity={0.85}
        >
          <AppIcon name="keypad" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )}

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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
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
  settingsIcon: {
    fontSize: 18,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0F172A',
    fontWeight: '700',
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
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  fabIcon: {
    fontSize: 26,
  },
  dialpadOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  dialpadContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dialpadHandleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    position: 'relative',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  closeDialpadBtn: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeDialpadText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'bold',
  },
});
