import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionService } from '../../services/ActionService';
import { ContactsService } from '../../services/ContactsService';
import { useLanguage } from '../../services/LanguageContext';
import { AppIcon } from '../Common/AppIcon';

interface CreateContactModalProps {
  visible: boolean;
  initialPhoneNumber?: string;
  initialName?: string;
  onClose: () => void;
  onContactCreated: () => void;
}

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  visible,
  initialPhoneNumber = '',
  initialName = '',
  onClose,
  onContactCreated,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState<string>(initialName);
  const [lastName, setLastName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneNumber);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync initial values when modal opens
  React.useEffect(() => {
    if (visible) {
      setFirstName(initialName || '');
      setLastName('');
      setPhoneNumber(initialPhoneNumber || '');
    }
  }, [visible, initialName, initialPhoneNumber]);

  const handleSave = async () => {
    if (!firstName.trim() || !phoneNumber.trim()) {
      ActionService.triggerHaptic('impactHeavy');
      Alert.alert('Required Info', t('fillRequired'));
      return;
    }

    try {
      setIsSaving(true);
      const res = await ContactsService.createContact(firstName, lastName, phoneNumber);
      setIsSaving(false);

      if (res) {
        ActionService.triggerHaptic('success');
        Alert.alert('Success', t('contactSaved'));
        onContactCreated();
        onClose();
      } else {
        // Fallback to system form
        await ContactsService.presentSystemContactForm(phoneNumber, `${firstName} ${lastName}`.trim());
        onContactCreated();
        onClose();
      }
    } catch (e) {
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save contact.');
    }
  };

  const handleOpenSystemForm = async () => {
    ActionService.triggerHaptic('selection');
    onClose();
    await ContactsService.presentSystemContactForm(phoneNumber, `${firstName} ${lastName}`.trim());
    onContactCreated();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.titleRow}>
              <AppIcon name="person-add-outline" color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>{t('createNewContact')}</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AppIcon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(24, insets.bottom + 20) }]}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('firstName')} *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Ramesh"
                placeholderTextColor="#94A3B8"
                value={firstName}
                onChangeText={setFirstName}
                autoFocus
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('lastName')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Kumar"
                placeholderTextColor="#94A3B8"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('phoneNumberLabel')} *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#94A3B8"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>{t('saveContact')}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Native System Form Option */}
            <TouchableOpacity
              style={styles.systemFormButton}
              onPress={handleOpenSystemForm}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name="settings-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.systemFormText}>Open Full Google / Phone Form</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  systemFormButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  systemFormText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
