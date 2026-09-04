import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionService } from '../../services/ActionService';
import { ContactsService, PhoneContact, T9SearchResult } from '../../services/ContactsService';
import { useLanguage } from '../../services/LanguageContext';
import { AppIcon } from '../Common/AppIcon';
import { ContactListItem } from '../Contacts/ContactListItem';
import { CreateContactModal } from '../Contacts/CreateContactModal';

interface DialpadViewProps {
  contacts: PhoneContact[];
  onCallPlaced?: (phoneNumber: string) => void;
  onContactSelect?: (contact: PhoneContact) => void;
  onContactCreated?: () => void;
  onClose?: () => void;
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
  onClose,
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
    <View style={styles.container}>
      {/* Top Drag / Collapse Handle if modal */}
      {onClose && (
        <TouchableOpacity
          style={styles.handleRow}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <View style={styles.sheetHandle} />
          <TouchableOpacity
            onPress={onClose}
            style={styles.collapseBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Vertical Matched Contacts List Area */}
      {t9Results.length > 0 ? (
        <FlatList
          data={t9Results}
          keyExtractor={(item) => item.contact.id + (item.matchedNumber || '')}
          renderItem={({ item }) => (
            <ContactListItem
              contact={item.contact}
              matchedNumber={item.matchedNumber}
              onSelect={(c) => {
                ActionService.triggerHaptic('selection');
                if (onContactSelect) {
                  onContactSelect(c);
                } else {
                  setInputNumber(item.matchedNumber || c.phoneNumbers[0]?.number || '');
                }
              }}
              onCall={(phone) => {
                ActionService.placeCall(phone);
                if (onCallPlaced) onCallPlaced(phone);
              }}
              onWhatsApp={(phone) => {
                ActionService.openWhatsApp(phone);
              }}
            />
          )}
          contentContainerStyle={styles.verticalResultsList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        />
      ) : (
        <View style={styles.emptyResultsSpace} />
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
      </View>

      {/* Quick Action Bar (when number entered) */}
      {/* {inputNumber.length > 0 && (
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
      )} */}

      {/* Keypad 3x4 Grid */}
      <View style={styles.keypadGrid}>
        {KEYS.map((k) => (
          <Pressable
            key={k.digit}
            style={styles.keyButton}
            onPress={() => handleKeyPress(k.digit)}
            onLongPress={k.digit === '0' ? handleZeroLongPress : undefined}
            android_disableSound={false}
            android_ripple={{
              color: '#E2E8F0',
              borderless: true,
              radius: 40,
            }}
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
          </Pressable>
        ))}
      </View>

      {/* Big Green Call Button with Backspace */}
      <View style={styles.callRow}>
        {inputNumber.length > 0 && (
          <View style={styles.backspaceButton} />
        )}
        <TouchableOpacity
          style={[styles.callButton, !inputNumber && styles.callButtonDisabled]}
          onPress={handleCall}
          disabled={!inputNumber}
          activeOpacity={0.8}
        >
          <AppIcon name="call" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        {inputNumber.length > 0 && (
          <TouchableOpacity
            style={styles.backspaceButton}
            onPress={handleBackspace}
            onLongPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon name="backspace" size={32} color="#475569" />
          </TouchableOpacity>
        )}
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
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  handleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
    height: 22,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  collapseBtn: {
    position: 'absolute',
    right: 16,
    top: 0,
    padding: 2,
  },
  verticalResultsList: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyResultsSpace: {
    flex: 1,
  },
  dialpadBottomSection: {
    width: '100%',
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  displayArea: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 2,
  },
  numberText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    flex: 1,
  },
  numberTextSmall: {
    fontSize: 24,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 4,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
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
    paddingHorizontal: 20,
    gap: 10,
  },
  keyButton: {
    width: (Dimensions.get('window').width - 40 - 20) / 3,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 32,
  },
  lettersText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  callRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 10,
  },
  callButton: {
    width: 78,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  callButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  backspaceButton: {
    padding: 8,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
