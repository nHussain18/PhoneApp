import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionService } from '../../services/ActionService';
import { ContactsService, PhoneContact, T9SearchResult } from '../../services/ContactsService';
import { useLanguage } from '../../services/LanguageContext';
import { CreateContactModal } from '../Contacts/CreateContactModal';
import { AppIcon } from '../Common/AppIcon';

interface DialpadViewProps {
  contacts: PhoneContact[];
  onCallPlaced?: (phoneNumber: string) => void;
  onContactSelect?: (contact: PhoneContact) => void;
  onContactCreated?: () => void;
}

const KEYS = [
  { digit: '1', letters: '', hindi: '' },
  { digit: '2', letters: 'ABC', hindi: 'अ क ग' },
  { digit: '3', letters: 'DEF', hindi: 'च छ ज' },
  { digit: '4', letters: 'GHI', hindi: 'ट ठ ड' },
  { digit: '5', letters: 'JKL', hindi: 'त द न' },
  { digit: '6', letters: 'MNO', hindi: 'प ब म' },
  { digit: '7', letters: 'PQRS', hindi: 'य र ल व' },
  { digit: '8', letters: 'TUV', hindi: 'श स ह' },
  { digit: '9', letters: 'WXYZ', hindi: 'क्ष त्र ज्ञ' },
  { digit: '*', letters: '', hindi: '' },
  { digit: '0', letters: '+', hindi: '+' },
  { digit: '#', letters: '', hindi: '' },
];

export const DialpadView: React.FC<DialpadViewProps> = ({
  contacts,
  onCallPlaced,
  onContactSelect,
  onContactCreated,
}) => {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const [inputNumber, setInputNumber] = useState<string>('');
  const [t9Results, setT9Results] = useState<T9SearchResult[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (inputNumber.length > 0) {
      const results = ContactsService.searchT9(inputNumber, contacts);
      setT9Results(results);
    } else {
      setT9Results([]);
    }
  }, [inputNumber, contacts]);

  const handleKeyPress = (digit: string) => {
    ActionService.triggerHaptic('impactLight');
    setInputNumber((prev) => prev + digit);
  };

  const handleZeroLongPress = () => {
    ActionService.triggerHaptic('impactMedium');
    setInputNumber((prev) => prev + '+');
  };

  const handleBackspace = () => {
    ActionService.triggerHaptic('selection');
    setInputNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    ActionService.triggerHaptic('impactMedium');
    setInputNumber('');
  };

  const handleCall = () => {
    if (!inputNumber) return;
    ActionService.placeCall(inputNumber);
    if (onCallPlaced) onCallPlaced(inputNumber);
  };

  const handleWhatsApp = () => {
    if (!inputNumber) return;
    ActionService.openWhatsApp(inputNumber);
  };

  const handleSms = () => {
    if (!inputNumber) return;
    ActionService.sendSms(inputNumber);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(20, insets.bottom + 16) }]}>
      {/* T9 Search Results Overlay / Preview */}
      {t9Results.length > 0 && (
        <View style={styles.t9Container}>
          <Text style={styles.t9Header}>{t('matches')} ({t9Results.length})</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.t9ScrollList}
          >
            {t9Results.slice(0, 10).map((res) => {
              const primaryPhone = res.contact.phoneNumbers[0]?.number || '';
              return (
                <TouchableOpacity
                  key={res.contact.id}
                  style={styles.t9Card}
                  onPress={() => {
                    ActionService.triggerHaptic('selection');
                    if (onContactSelect) {
                      onContactSelect(res.contact);
                    } else {
                      setInputNumber(primaryPhone);
                    }
                  }}
                >
                  <View style={styles.t9Avatar}>
                    <Text style={styles.t9AvatarText}>
                      {res.contact.name ? res.contact.name.charAt(0).toUpperCase() : '#'}
                    </Text>
                  </View>
                  <Text style={styles.t9Name} numberOfLines={1}>
                    {res.contact.name}
                  </Text>
                  <Text style={styles.t9Phone} numberOfLines={1}>
                    {res.matchedNumber || primaryPhone}
                  </Text>
                  <TouchableOpacity
                    style={styles.t9QuickCall}
                    onPress={() => {
                      ActionService.placeCall(res.matchedNumber || primaryPhone);
                      if (onCallPlaced) onCallPlaced(res.matchedNumber || primaryPhone);
                    }}
                  >
                    <AppIcon name="call" size={14} color="#15803D" style={{ marginRight: 4 }} />
                    <Text style={styles.t9QuickCallText}>{t('call')}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Dialed Number Display */}
      <View style={styles.displayArea}>
        <Text
          style={[
            styles.numberText,
            inputNumber.length > 12 ? styles.numberTextSmall : null,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {inputNumber || ' '}
        </Text>

        {inputNumber.length > 0 && (
          <TouchableOpacity
            style={styles.backspaceButton}
            onPress={handleBackspace}
            onLongPress={handleClear}
          >
            <AppIcon name="backspace-outline" size={24} color="#475569" />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Action Bar (when number entered) */}
      {inputNumber.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => {
              ActionService.triggerHaptic('selection');
              setIsCreateModalVisible(true);
            }}
          >
            <AppIcon name="person-add-outline" size={16} color="#2563EB" style={{ marginRight: 4 }} />
            <Text style={styles.actionChipText}>{t('addContact')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={handleWhatsApp}>
            <AppIcon name="logo-whatsapp" size={16} color="#16A34A" style={{ marginRight: 4 }} />
            <Text style={styles.actionChipText}>{t('whatsApp')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={handleSms}>
            <AppIcon name="mail-outline" size={16} color="#0284C7" style={{ marginRight: 4 }} />
            <Text style={styles.actionChipText}>{t('sms')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Keypad 3x4 Grid */}
      <View style={styles.keypadGrid}>
        {KEYS.map((k) => (
          <TouchableOpacity
            key={k.digit}
            style={styles.keyButton}
            onPress={() => handleKeyPress(k.digit)}
            onLongPress={k.digit === '0' ? handleZeroLongPress : undefined}
            activeOpacity={0.65}
          >
            <Text style={styles.digitText}>{k.digit}</Text>
            {k.letters ? (
              <Text
                style={styles.lettersText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {language === 'hi' && k.hindi ? k.hindi : k.letters}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Big Green Call Button */}
      <View style={styles.callRow}>
        <TouchableOpacity
          style={[styles.callButton, !inputNumber && styles.callButtonDisabled]}
          onPress={handleCall}
          disabled={!inputNumber}
          activeOpacity={0.8}
        >
          <AppIcon name="call" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Create Contact Modal from Dialpad */}
      <CreateContactModal
        visible={isCreateModalVisible}
        initialPhoneNumber={inputNumber}
        onClose={() => setIsCreateModalVisible(false)}
        onContactCreated={() => {
          if (onContactCreated) onContactCreated();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  t9Container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  t9Header: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  t9ScrollList: {
    paddingBottom: 10,
    gap: 10,
  },
  t9Card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    width: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  t9Avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  t9AvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  t9Name: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    width: '100%',
    textAlign: 'center',
  },
  t9Phone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    width: '100%',
    textAlign: 'center',
  },
  t9QuickCall: {
    marginTop: 6,
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  t9QuickCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  displayArea: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  numberText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    flex: 1,
  },
  numberTextSmall: {
    fontSize: 24,
  },
  backspaceButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backspaceText: {
    fontSize: 26,
    color: '#64748B',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  actionChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  keyButton: {
    width: (Dimensions.get('window').width - 48 - 28) / 3,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
  },
  digitText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 26,
  },
  lettersText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  callRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  callButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  callButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  callButtonIcon: {
    fontSize: 28,
  },
});
